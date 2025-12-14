using Application.DTOs;
using Application.Repositories;
using Common.Entity;
using Microsoft.Extensions.Logging;

namespace Application.Services;

public sealed class EmploymentContractService : IEmploymentContractService
{
    private readonly IEmploymentContractRepository _employmentContractRepository;
    private readonly IEmployeeRepository _employeeRepository;
    private readonly ILogger<EmploymentContractService> _logger;

    public EmploymentContractService(
        IEmploymentContractRepository employmentContractRepository,
        IEmployeeRepository employeeRepository,
        ILogger<EmploymentContractService> logger)
    {
        _employmentContractRepository = employmentContractRepository;
        _employeeRepository = employeeRepository;
        _logger = logger;
    }

    public async Task<List<EmploymentContractDto>> GetContractsByEmployeeAsync(int employeeId)
    {
        var contracts = await _employmentContractRepository.GetByEmployeeIdWithEmployeeAsync(employeeId);
        return contracts.Select(MapContract).ToList();
    }

    public async Task<EmploymentContractDto?> GetContractAsync(int id)
    {
        var contract = await _employmentContractRepository.GetByIdWithEmployeeAsync(id);
        return contract == null ? null : MapContract(contract);
    }

    public async Task<(EmploymentContractDto? Result, string? ErrorMessage)> CreateContractAsync(CreateEmploymentContractDto dto)
    {
        if (dto == null)
        {
            return (null, "Request body is required");
        }

        var employee = await _employeeRepository.FindByIdAsync(dto.EmployeeId);
        if (employee == null)
        {
            return (null, "Employee not found");
        }

        // Check if employee already has a contract (single contract per employee)
        var existingContracts = await _employmentContractRepository.GetByEmployeeIdWithEmployeeAsync(dto.EmployeeId);
        if (existingContracts.Any())
        {
            return (null, "Employee already has a contract. Use update instead.");
        }

        var contract = new EmploymentContract
        {
            EmployeeId = dto.EmployeeId,
            ContractType = dto.ContractType,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            Salary = dto.Salary,
            Currency = dto.Currency ?? "USD",
            PaymentFrequency = dto.PaymentFrequency ?? "Monthly",
            WorkingHoursPerWeek = dto.WorkingHoursPerWeek,
            Terms = dto.Terms ?? string.Empty,
            DocumentPath = dto.DocumentPath ?? string.Empty,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        await _employmentContractRepository.AddAsync(contract);
        await _employmentContractRepository.SaveChangesAsync();

        var result = new EmploymentContractDto
        {
            Id = contract.ContractId,
            EmployeeId = contract.EmployeeId,
            EmployeeName = employee.FirstName + " " + employee.LastName,
            ContractType = contract.ContractType,
            StartDate = contract.StartDate,
            EndDate = contract.EndDate,
            Salary = contract.Salary,
            Currency = contract.Currency,
            PaymentFrequency = contract.PaymentFrequency,
            WorkingHoursPerWeek = contract.WorkingHoursPerWeek,
            Terms = contract.Terms,
            IsActive = contract.IsActive,
            DocumentPath = contract.DocumentPath
        };

        return (result, null);
    }

    public async Task<(EmploymentContractDto? Result, string? ErrorMessage, bool NotFound)> UpdateContractAsync(int id, UpdateEmploymentContractDto dto)
    {
        if (dto == null)
        {
            return (null, "Request body is required", false);
        }

        var contract = await _employmentContractRepository.GetByIdWithEmployeeAsync(id);
        if (contract == null)
        {
            return (null, null, true);
        }

        contract.ContractType = dto.ContractType;
        contract.StartDate = dto.StartDate;
        contract.EndDate = dto.EndDate;
        contract.Salary = dto.Salary;
        contract.Currency = dto.Currency ?? contract.Currency;
        contract.PaymentFrequency = dto.PaymentFrequency ?? contract.PaymentFrequency;
        contract.WorkingHoursPerWeek = dto.WorkingHoursPerWeek;
        contract.Terms = dto.Terms ?? contract.Terms;
        contract.IsActive = dto.IsActive;
        contract.DocumentPath = dto.DocumentPath ?? contract.DocumentPath;
        contract.UpdatedAt = DateTime.UtcNow;

        await _employmentContractRepository.SaveChangesAsync();

        return (MapContract(contract), null, false);
    }

    public async Task<(bool Success, string? ErrorMessage, bool NotFound)> DeleteContractAsync(int id)
    {
        var contract = await _employmentContractRepository.FindByIdAsync(id);
        if (contract == null)
        {
            return (false, null, true);
        }

        _employmentContractRepository.Remove(contract);
        await _employmentContractRepository.SaveChangesAsync();

        return (true, null, false);
    }

    private static EmploymentContractDto MapContract(EmploymentContract c)
    {
        return new EmploymentContractDto
        {
            Id = c.ContractId,
            EmployeeId = c.EmployeeId,
            EmployeeName = c.Employee.FirstName + " " + c.Employee.LastName,
            ContractType = c.ContractType,
            StartDate = c.StartDate,
            EndDate = c.EndDate,
            Salary = c.Salary,
            Currency = c.Currency,
            PaymentFrequency = c.PaymentFrequency,
            WorkingHoursPerWeek = c.WorkingHoursPerWeek,
            Terms = c.Terms,
            IsActive = c.IsActive,
            DocumentPath = c.DocumentPath
        };
    }
}
