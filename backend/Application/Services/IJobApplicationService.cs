using Application.DTOs;
using Application.Infrastructure;

namespace Application.Services;

public interface IJobApplicationService
{
    Task<List<JobApplicationDto>> GetJobApplicationsAsync(OwnershipScope scope);
    Task<JobApplicationDto?> GetJobApplicationAsync(string id);
    Task<(JobApplicationDto? Result, string? ErrorMessage)> CreateJobApplicationAsync(CreateJobApplicationDto dto);
    Task<(JobApplicationDto? Result, string? ErrorMessage, bool NotFound)> UpdateJobApplicationAsync(string id, UpdateJobApplicationDto dto);
    Task<(bool Success, string? ErrorMessage, bool NotFound)> DeleteJobApplicationAsync(string id);
}
