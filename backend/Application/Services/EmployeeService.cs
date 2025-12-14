using System.Globalization;
using Application.DTOs;
using Application.Exceptions;
using Application.Infrastructure;
using Application.Kafka;
using Application.Kafka.Events;
using Application.Repositories;
using Common.Entity;
using Microsoft.Extensions.Logging;

namespace Application.Services;

public sealed class EmployeeService : IEmployeeService
{
    private static readonly string[] AllowedDateFormats = { "yyyy-MM-dd", "dd.MM.yyyy" };

    private readonly IEmployeeRepository _employeeRepository;
    private readonly IDepartmentRepository _departmentRepository;
    private readonly IJobRepository _jobRepository;
    private readonly IAccessRequestRepository _accessRequestRepository;
    private readonly IEmploymentContractRepository _employmentContractRepository;
    private readonly ICurrentAdminProvider _currentAdminProvider;
    private readonly IKafkaProducer? _kafkaProducer;
    private readonly ILogger<EmployeeService> _logger;

    public EmployeeService(
        IEmployeeRepository employeeRepository,
        IDepartmentRepository departmentRepository,
        IJobRepository jobRepository,
        IAccessRequestRepository accessRequestRepository,
        IEmploymentContractRepository employmentContractRepository,
        ICurrentAdminProvider currentAdminProvider,
        ILogger<EmployeeService> logger,
        IKafkaProducer? kafkaProducer = null)
    {
        _employeeRepository = employeeRepository;
        _departmentRepository = departmentRepository;
        _jobRepository = jobRepository;
        _accessRequestRepository = accessRequestRepository;
        _employmentContractRepository = employmentContractRepository;
        _currentAdminProvider = currentAdminProvider;
        _logger = logger;
        _kafkaProducer = kafkaProducer;
    }

    public async Task<List<EmployeeDto>> GetEmployeesAsync(OwnershipScope scope)
    {
        var employees = scope == OwnershipScope.Yours
            ? await GetOwnedEmployeesAsync()
            : await _employeeRepository.GetNonTerminatedWithDetailsAsync();
        return employees.Select(MapEmployee).ToList();
    }

    public async Task<EmployeeDto?> GetEmployeeAsync(string id)
    {
        var employeeId = ParseEmployeeId(id);
        if (employeeId == null)
        {
            return null;
        }

        var employee = await _employeeRepository.GetByIdWithDetailsAsync(employeeId.Value);
        return employee == null ? null : MapEmployee(employee);
    }

    public async Task<(EmployeeDto? Result, string? ErrorMessage)> CreateEmployeeAsync(CreateEmployeeDto dto)
    {
        if (dto == null)
        {
            return (null, "Request body is required");
        }

        if (await _employeeRepository.EmailExistsAsync(dto.Email))
        {
            return (null, "Email already exists");
        }

        if (dto.DepartmentId <= 0)
        {
            return (null, "DepartmentId must be a positive number");
        }

        if (dto.JobId <= 0)
        {
            return (null, "JobId must be a positive number");
        }

        var managerId = dto.ManagerId;
        if (managerId.HasValue && managerId.Value <= 0)
        {
            managerId = null;
        }

        if (!DateTime.TryParseExact(dto.DateOfBirth, AllowedDateFormats, CultureInfo.InvariantCulture, DateTimeStyles.None, out var dateOfBirthParsed))
        {
            return (null, "Invalid dateOfBirth format. Use 'yyyy-MM-dd' (e.g. 2002-02-12)." );
        }

        if (!DateTime.TryParseExact(dto.HireDate, AllowedDateFormats, CultureInfo.InvariantCulture, DateTimeStyles.None, out var hireDateParsed))
        {
            return (null, "Invalid hireDate format. Use 'yyyy-MM-dd' (e.g. 2025-11-21)." );
        }

        var dateOfBirth = DateTime.SpecifyKind(dateOfBirthParsed.Date, DateTimeKind.Utc);
        var hireDate = DateTime.SpecifyKind(hireDateParsed.Date, DateTimeKind.Utc);

        var department = await _departmentRepository.FindByIdAsync(dto.DepartmentId);
        if (department == null)
        {
            return (null, "Department not found");
        }

        var job = await _jobRepository.FindByIdAsync(dto.JobId);
        if (job == null || job.DepartmentId != dto.DepartmentId)
        {
            return (null, "Job not found for the selected department");
        }

        var employee = new Employee
        {
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Email = dto.Email,
            PhoneNumber = dto.PhoneNumber,
            DateOfBirth = dateOfBirth,
            HireDate = hireDate,
            DepartmentId = dto.DepartmentId,
            JobId = dto.JobId,
            ManagerId = managerId,
            CurrentSalary = dto.CurrentSalary,
            EmploymentStatus = dto.EmploymentStatus,
            Address = dto.Address ?? string.Empty,
            City = dto.City ?? string.Empty,
            State = dto.State ?? string.Empty,
            PostalCode = dto.PostalCode ?? string.Empty,
            Country = dto.Country ?? string.Empty,
            OwnerAdminId = _currentAdminProvider.AdminId,
            CreatedAt = DateTime.UtcNow
        };

        await _employeeRepository.AddAsync(employee);
        await _employeeRepository.SaveChangesAsync();

        // Auto-create initial employment contract
        try
        {
            var initialContract = new EmploymentContract
            {
                EmployeeId = employee.EmployeeId,
                ContractType = "FullTime",
                StartDate = hireDate,
                Salary = dto.CurrentSalary,
                Currency = "TRY",
                PaymentFrequency = "Monthly",
                WorkingHoursPerWeek = 40,
                Terms = "Standard employment contract",
                DocumentPath = string.Empty,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            await _employmentContractRepository.AddAsync(initialContract);
            await _employmentContractRepository.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to create initial contract for employee {EmployeeId}", employee.EmployeeId);
        }

        // Publish Kafka event
        if (_kafkaProducer != null)
        {
            try
            {
                var employeeEvent = new EmployeeCreatedEvent
                {
                    EmployeeId = employee.EmployeeId,
                    FullName = $"{employee.FirstName} {employee.LastName}",
                    Email = employee.Email,
                    DepartmentId = employee.DepartmentId,
                    DepartmentName = department.DepartmentName,
                    TriggeredBy = _currentAdminProvider.AdminId
                };
                await _kafkaProducer.PublishAsync(KafkaTopics.EmployeeEvents, employeeEvent);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to publish EmployeeCreatedEvent to Kafka");
            }
        }

        var result = new EmployeeDto
        {
            Id = "E-" + employee.EmployeeId,
            FirstName = employee.FirstName,
            LastName = employee.LastName,
            Email = employee.Email,
            PhoneNumber = employee.PhoneNumber,
            DepartmentId = "D-" + employee.DepartmentId.ToString("D2"),
            DepartmentName = department.DepartmentName,
            JobTitle = job.JobTitle,
            ManagerId = employee.ManagerId.HasValue ? "E-" + employee.ManagerId.Value : null,
            Status = employee.EmploymentStatus,
            CurrentSalary = employee.CurrentSalary,
            HireDate = employee.HireDate.ToString("yyyy-MM-dd"),
            TerminationDate = null,
            AvatarUrl = "https://picsum.photos/200/200?random=" + employee.EmployeeId,
            Skills = new List<string>()
        };

        return (result, null);
    }

    public async Task<(EmployeeDto? Result, string? ErrorMessage, bool NotFound)> UpdateEmployeeAsync(string id, UpdateEmployeeDto dto)
    {
        var employeeId = ParseEmployeeId(id);
        if (employeeId == null)
        {
            return (null, "Invalid employee id", false);
        }

        var employee = await _employeeRepository.FindByIdAsync(employeeId.Value);
        if (employee == null)
        {
            return (null, null, true);
        }

        await EnsureHasEditAccessAsync(employee.OwnerAdminId, employeeId.Value);

        if (await _employeeRepository.EmailExistsAsync(dto.Email, employeeId.Value))
        {
            return (null, "Email already exists", false);
        }

        employee.FirstName = dto.FirstName;
        employee.LastName = dto.LastName;
        employee.Email = dto.Email;
        employee.PhoneNumber = dto.PhoneNumber;
        employee.DepartmentId = dto.DepartmentId;
        employee.JobId = dto.JobId;
        employee.ManagerId = dto.ManagerId;
        employee.CurrentSalary = dto.CurrentSalary;
        employee.EmploymentStatus = dto.EmploymentStatus;
        employee.Address = dto.Address;
        employee.City = dto.City;
        employee.State = dto.State;
        employee.PostalCode = dto.PostalCode;
        employee.Country = dto.Country;
        employee.UpdatedAt = DateTime.UtcNow;

        await _employeeRepository.SaveChangesAsync();

        var updated = await _employeeRepository.GetByIdWithDetailsAsync(employeeId.Value);
        if (updated == null)
        {
            return (null, "Employee updated but could not be reloaded", false);
        }

        return (MapEmployee(updated), null, false);
    }

    public async Task<(bool Success, string? ErrorMessage, bool NotFound)> TerminateEmployeeAsync(string id)
    {
        var employeeId = ParseEmployeeId(id);
        if (employeeId == null)
        {
            return (false, "Invalid employee id", false);
        }

        var employee = await _employeeRepository.FindByIdAsync(employeeId.Value);
        if (employee == null)
        {
            return (false, null, true);
        }

        await EnsureHasEditAccessAsync(employee.OwnerAdminId, employeeId.Value);

        employee.EmploymentStatus = "Terminated";
        employee.TerminationDate = DateTime.UtcNow;
        employee.UpdatedAt = DateTime.UtcNow;

        await _employeeRepository.SaveChangesAsync();
        return (true, null, false);
    }

    private async Task<List<Employee>> GetOwnedEmployeesAsync()
    {
        var adminId = _currentAdminProvider.AdminId;
        if (string.IsNullOrWhiteSpace(adminId))
        {
            return new List<Employee>();
        }

        return await _employeeRepository.GetNonTerminatedWithDetailsForOwnerAsync(adminId);
    }

    private async Task EnsureHasEditAccessAsync(string? ownerAdminId, int employeeId)
    {
        var adminId = _currentAdminProvider.AdminId;
        if (string.IsNullOrWhiteSpace(adminId))
        {
            throw new ForbiddenException("X-Admin-Id header is required");
        }

        if (string.IsNullOrWhiteSpace(ownerAdminId))
        {
            var employee = await _employeeRepository.FindByIdAsync(employeeId);
            if (employee != null && string.IsNullOrWhiteSpace(employee.OwnerAdminId))
            {
                employee.OwnerAdminId = adminId;
                await _employeeRepository.SaveChangesAsync();
            }

            return;
        }

        if (string.Equals(ownerAdminId, adminId, StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        var approved = await _accessRequestRepository.FindActiveApprovalAsync(adminId, "Employee", employeeId, DateTime.UtcNow);
        if (approved == null)
        {
            throw new ForbiddenException("You do not have access to modify this employee");
        }
    }

    private static int? ParseEmployeeId(string id)
    {
        if (string.IsNullOrWhiteSpace(id))
        {
            return null;
        }

        if (id.StartsWith("E-", StringComparison.OrdinalIgnoreCase))
        {
            id = id.Replace("E-", "", StringComparison.OrdinalIgnoreCase);
        }

        return int.TryParse(id, out var parsed) ? parsed : null;
    }

    private static EmployeeDto MapEmployee(Employee e)
    {
        return new EmployeeDto
        {
            Id = "E-" + e.EmployeeId,
            FirstName = e.FirstName,
            LastName = e.LastName,
            Email = e.Email,
            PhoneNumber = e.PhoneNumber,
            DepartmentId = "D-" + e.DepartmentId.ToString("D2"),
            DepartmentName = e.Department.DepartmentName,
            JobTitle = e.Job.JobTitle,
            ManagerId = e.ManagerId.HasValue ? "E-" + e.ManagerId.Value : null,
            Status = e.EmploymentStatus,
            CurrentSalary = e.CurrentSalary,
            HireDate = e.HireDate.ToString("yyyy-MM-dd"),
            TerminationDate = e.TerminationDate.HasValue ? e.TerminationDate.Value.ToString("yyyy-MM-dd") : null,
            AvatarUrl = "https://picsum.photos/200/200?random=" + e.EmployeeId,
            Skills = new List<string>(),
            OwnerAdminId = e.OwnerAdminId
        };
    }
}
