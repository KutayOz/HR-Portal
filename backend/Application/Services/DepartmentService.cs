using Application.DTOs;
using Application.Exceptions;
using Application.Infrastructure;
using Application.Repositories;
using Microsoft.Extensions.Logging;

namespace Application.Services;

public sealed class DepartmentService : IDepartmentService
{
    private readonly IDepartmentRepository _departmentRepository;
    private readonly IAccessRequestRepository _accessRequestRepository;
    private readonly ICurrentAdminProvider _currentAdminProvider;
    private readonly ILogger<DepartmentService> _logger;

    public DepartmentService(
        IDepartmentRepository departmentRepository,
        IAccessRequestRepository accessRequestRepository,
        ICurrentAdminProvider currentAdminProvider,
        ILogger<DepartmentService> logger)
    {
        _departmentRepository = departmentRepository;
        _accessRequestRepository = accessRequestRepository;
        _currentAdminProvider = currentAdminProvider;
        _logger = logger;
    }

    public async Task<List<DepartmentDto>> GetDepartmentsAsync(OwnershipScope scope)
    {
        var departments = scope == OwnershipScope.Yours
            ? await GetOwnedDepartmentsAsync()
            : await _departmentRepository.GetAllWithJobsAsync();

        return departments.Select(MapDepartment).ToList();
    }

    public async Task<DepartmentDto?> GetDepartmentAsync(string id)
    {
        var departmentId = ParseDepartmentId(id);
        if (departmentId == null)
        {
            return null;
        }

        var department = await _departmentRepository.GetByIdWithJobsAsync(departmentId.Value);
        return department == null ? null : MapDepartment(department);
    }

    public async Task<(DepartmentDto? Result, string? ErrorMessage)> CreateDepartmentAsync(CreateDepartmentDto dto)
    {
        _logger.LogInformation("CreateDepartment called with: Name={Name}, Jobs={JobCount}", dto?.DepartmentName, dto?.Jobs?.Count ?? 0);

        if (dto == null)
        {
            return (null, "Request body is required");
        }

        if (string.IsNullOrWhiteSpace(dto.DepartmentName))
        {
            return (null, "Department name is required");
        }

        var existingDept = await _departmentRepository.FindByNameAsync(dto.DepartmentName);
        if (existingDept != null)
        {
            return (null, "Department name already exists");
        }

        if (dto.Jobs != null && dto.Jobs.Any())
        {
            for (var i = 0; i < dto.Jobs.Count; i++)
            {
                var jobDto = dto.Jobs[i];

                if (string.IsNullOrWhiteSpace(jobDto.JobTitle))
                {
                    return (null, $"Job position {i + 1}: Title cannot be empty");
                }
            }
        }

        var department = new Common.Entity.Department
        {
            DepartmentName = dto.DepartmentName.Trim(),
            Description = dto.Description?.Trim(),
            OwnerAdminId = _currentAdminProvider.AdminId,
            CreatedAt = DateTime.UtcNow
        };

        await _departmentRepository.AddAsync(department);
        await _departmentRepository.SaveChangesAsync();

        if (dto.Jobs != null && dto.Jobs.Any())
        {
            var jobsToAdd = dto.Jobs.Select(jobDto => new Common.Entity.Job
            {
                JobTitle = jobDto.JobTitle.Trim(),
                JobDescription = $"Position: {jobDto.JobTitle.Trim()}",
                MinSalary = jobDto.MinSalary ?? 0,
                MaxSalary = jobDto.MaxSalary ?? 0,
                DepartmentId = department.DepartmentId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            }).ToList();

            await _departmentRepository.AddJobsAsync(jobsToAdd);
            await _departmentRepository.SaveChangesAsync();
        }

        var created = await _departmentRepository.GetByIdWithJobsAsync(department.DepartmentId);
        if (created == null)
        {
            return (null, "Department created but could not be reloaded");
        }

        return (MapDepartment(created), null);
    }

    public async Task<(DepartmentDto? Result, string? ErrorMessage, bool NotFound)> UpdateDepartmentAsync(string id, UpdateDepartmentDto dto)
    {
        if (dto == null)
        {
            return (null, "Request body is required", false);
        }

        var departmentId = ParseDepartmentId(id);
        if (departmentId == null)
        {
            return (null, "Invalid department id", false);
        }

        var department = await _departmentRepository.FindByIdAsync(departmentId.Value);
        if (department == null)
        {
            return (null, null, true);
        }

        await EnsureHasEditAccessAsync(department.OwnerAdminId, departmentId.Value);

        if (await _departmentRepository.DepartmentNameExistsAsync(dto.DepartmentName, departmentId.Value))
        {
            return (null, "Department name already exists", false);
        }

        department.DepartmentName = dto.DepartmentName;
        department.Description = dto.Description;
        department.UpdatedAt = DateTime.UtcNow;

        if (dto.Jobs != null && dto.Jobs.Any())
        {
            var existingJobIds = dto.Jobs.Where(j => j.Id > 0).Select(j => j.Id).ToList();
            var existingJobs = await _departmentRepository.GetJobsByIdsAsync(departmentId.Value, existingJobIds);
            var newJobs = new List<Common.Entity.Job>();

            foreach (var jobDto in dto.Jobs)
            {
                if (jobDto.Id > 0)
                {
                    var job = existingJobs.FirstOrDefault(j => j.JobId == jobDto.Id);
                    if (job == null)
                    {
                        _logger.LogWarning("UpdateDepartment: Job {JobId} not found for Department {DepartmentId}", jobDto.Id, departmentId.Value);
                        continue;
                    }

                    if (!string.IsNullOrWhiteSpace(jobDto.JobTitle))
                    {
                        job.JobTitle = jobDto.JobTitle.Trim();
                    }

                    if (jobDto.MinSalary.HasValue) job.MinSalary = jobDto.MinSalary.Value;
                    if (jobDto.MaxSalary.HasValue) job.MaxSalary = jobDto.MaxSalary.Value;

                    job.UpdatedAt = DateTime.UtcNow;
                }
                else
                {
                    if (string.IsNullOrWhiteSpace(jobDto.JobTitle))
                    {
                        return (null, "Job title is required for new positions", false);
                    }

                    newJobs.Add(new Common.Entity.Job
                    {
                        JobTitle = jobDto.JobTitle.Trim(),
                        JobDescription = $"Position: {jobDto.JobTitle.Trim()}",
                        MinSalary = jobDto.MinSalary ?? 0,
                        MaxSalary = jobDto.MaxSalary ?? 0,
                        DepartmentId = departmentId.Value,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }

            if (newJobs.Any())
            {
                await _departmentRepository.AddJobsAsync(newJobs);
            }
        }

        await _departmentRepository.SaveChangesAsync();

        var updated = await _departmentRepository.GetByIdWithJobsAsync(departmentId.Value);
        if (updated == null)
        {
            return (null, "Department updated but could not be reloaded", false);
        }

        return (MapDepartment(updated), null, false);
    }

    public async Task<(bool Success, string? ErrorMessage, bool NotFound)> DeleteDepartmentAsync(string id)
    {
        var departmentId = ParseDepartmentId(id);
        if (departmentId == null)
        {
            return (false, "Invalid department id", false);
        }

        var department = await _departmentRepository.GetByIdWithEmployeesAsync(departmentId.Value);
        if (department == null)
        {
            return (false, null, true);
        }

        await EnsureHasEditAccessAsync(department.OwnerAdminId, departmentId.Value);

        if (department.Employees.Any())
        {
            return (false, "Cannot delete department with active employees. Please reassign employees first.", false);
        }

        _departmentRepository.Remove(department);
        await _departmentRepository.SaveChangesAsync();
        return (true, null, false);
    }

    private async Task<List<Common.Entity.Department>> GetOwnedDepartmentsAsync()
    {
        var adminId = _currentAdminProvider.AdminId;
        if (string.IsNullOrWhiteSpace(adminId))
        {
            return new List<Common.Entity.Department>();
        }

        return await _departmentRepository.GetAllWithJobsForOwnerAsync(adminId);
    }

    private async Task EnsureHasEditAccessAsync(string? ownerAdminId, int departmentId)
    {
        var adminId = _currentAdminProvider.AdminId;
        if (string.IsNullOrWhiteSpace(adminId))
        {
            throw new ForbiddenException("X-Admin-Id header is required");
        }

        if (string.IsNullOrWhiteSpace(ownerAdminId))
        {
            var department = await _departmentRepository.FindByIdAsync(departmentId);
            if (department != null && string.IsNullOrWhiteSpace(department.OwnerAdminId))
            {
                department.OwnerAdminId = adminId;
                await _departmentRepository.SaveChangesAsync();
            }

            return;
        }

        if (string.Equals(ownerAdminId, adminId, StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        var approved = await _accessRequestRepository.FindActiveApprovalAsync(adminId, "Department", departmentId, DateTime.UtcNow);
        if (approved == null)
        {
            throw new ForbiddenException("You do not have access to modify this department");
        }
    }

    private static int? ParseDepartmentId(string id)
    {
        if (string.IsNullOrWhiteSpace(id))
        {
            return null;
        }

        if (id.StartsWith("D-", StringComparison.OrdinalIgnoreCase))
        {
            id = id.Replace("D-", "", StringComparison.OrdinalIgnoreCase);
        }

        return int.TryParse(id, out var parsed) ? parsed : null;
    }

    private static DepartmentDto MapDepartment(Common.Entity.Department d)
    {
        return new DepartmentDto
        {
            Id = "D-" + d.DepartmentId.ToString("D2"),
            Name = d.DepartmentName,
            Description = d.Description ?? "",
            OwnerAdminId = d.OwnerAdminId,
            Jobs = d.Jobs.Select(j => new JobDto
            {
                Id = j.JobId,
                Title = j.JobTitle,
                Description = j.JobDescription,
                MinSalary = j.MinSalary,
                MaxSalary = j.MaxSalary,
                DepartmentId = j.DepartmentId,
                DepartmentName = null
            }).ToList()
        };
    }
}
