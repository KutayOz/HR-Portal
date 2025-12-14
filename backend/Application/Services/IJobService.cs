using Application.DTOs;

namespace Application.Services;

public interface IJobService
{
    Task<List<JobDto>> GetJobsAsync();
    Task<List<JobDto>> GetJobsByDepartmentAsync(int departmentId);
    Task<JobDto?> GetJobAsync(int id);
    Task<(JobDto? Result, string? ErrorMessage)> CreateJobAsync(CreateJobDto dto);
    Task<(JobDto? Result, string? ErrorMessage, bool NotFound)> UpdateJobAsync(int id, UpdateJobDto dto);
    Task<(bool Success, string? ErrorMessage, bool NotFound)> DeleteJobAsync(int id);
}
