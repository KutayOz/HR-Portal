using Application.DTOs;
using Application.Repositories;
using Microsoft.Extensions.Logging;

namespace Application.Services;

public sealed class JobService : IJobService
{
    private readonly IJobRepository _jobRepository;
    private readonly IDepartmentRepository _departmentRepository;
    private readonly ILogger<JobService> _logger;

    public JobService(IJobRepository jobRepository, IDepartmentRepository departmentRepository, ILogger<JobService> logger)
    {
        _jobRepository = jobRepository;
        _departmentRepository = departmentRepository;
        _logger = logger;
    }

    public async Task<List<JobDto>> GetJobsAsync()
    {
        var jobs = await _jobRepository.GetAllWithDepartmentAsync();
        return jobs.Select(MapJob).ToList();
    }

    public async Task<List<JobDto>> GetJobsByDepartmentAsync(int departmentId)
    {
        var jobs = await _jobRepository.GetByDepartmentIdAsync(departmentId);
        return jobs.Select(MapJob).ToList();
    }

    public async Task<JobDto?> GetJobAsync(int id)
    {
        var job = await _jobRepository.GetByIdWithDepartmentAsync(id);
        return job == null ? null : MapJob(job);
    }

    public async Task<(JobDto? Result, string? ErrorMessage)> CreateJobAsync(CreateJobDto dto)
    {
        if (dto == null)
        {
            return (null, "Request body is required");
        }

        var department = await _departmentRepository.FindByIdAsync(dto.DepartmentId);
        if (department == null)
        {
            return (null, "Department not found");
        }

        var job = new Common.Entity.Job
        {
            JobTitle = dto.Title,
            JobDescription = dto.Description,
            MinSalary = dto.MinSalary,
            MaxSalary = dto.MaxSalary,
            DepartmentId = dto.DepartmentId,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        await _jobRepository.AddAsync(job);
        await _jobRepository.SaveChangesAsync();

        var created = await _jobRepository.GetByIdWithDepartmentAsync(job.JobId);
        if (created == null)
        {
            _logger.LogWarning("Job created but could not be reloaded: {JobId}", job.JobId);
            return (null, "Job created but could not be reloaded");
        }

        return (MapJob(created), null);
    }

    public async Task<(JobDto? Result, string? ErrorMessage, bool NotFound)> UpdateJobAsync(int id, UpdateJobDto dto)
    {
        if (dto == null)
        {
            return (null, "Request body is required", false);
        }

        var job = await _jobRepository.GetByIdWithDepartmentAsync(id);
        if (job == null)
        {
            return (null, null, true);
        }

        job.JobTitle = dto.Title;
        job.JobDescription = dto.Description;
        job.MinSalary = dto.MinSalary;
        job.MaxSalary = dto.MaxSalary;
        job.IsActive = dto.IsActive;
        job.UpdatedAt = DateTime.UtcNow;

        await _jobRepository.SaveChangesAsync();

        var updated = await _jobRepository.GetByIdWithDepartmentAsync(id);
        if (updated == null)
        {
            return (null, "Job updated but could not be reloaded", false);
        }

        return (MapJob(updated), null, false);
    }

    public async Task<(bool Success, string? ErrorMessage, bool NotFound)> DeleteJobAsync(int id)
    {
        var job = await _jobRepository.FindByIdAsync(id);
        if (job == null)
        {
            return (false, null, true);
        }

        if (await _jobRepository.IsJobInUseAsync(id))
        {
            job.IsActive = false;
            job.UpdatedAt = DateTime.UtcNow;
            await _jobRepository.SaveChangesAsync();
            return (true, "Job deactivated (soft deleted) because it is in use", false);
        }

        _jobRepository.Remove(job);
        await _jobRepository.SaveChangesAsync();
        return (true, null, false);
    }

    private static JobDto MapJob(Common.Entity.Job j)
    {
        return new JobDto
        {
            Id = j.JobId,
            Title = j.JobTitle,
            Description = j.JobDescription,
            MinSalary = j.MinSalary,
            MaxSalary = j.MaxSalary,
            DepartmentId = j.DepartmentId,
            DepartmentName = j.Department?.DepartmentName
        };
    }
}
