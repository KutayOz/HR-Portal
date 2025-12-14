using Application.DTOs;
using Application.Exceptions;
using Application.Infrastructure;
using Application.Repositories;
using Common.Entity;
using Microsoft.Extensions.Logging;

namespace Application.Services;

public sealed class JobApplicationService : IJobApplicationService
{
    private readonly IJobApplicationRepository _jobApplicationRepository;
    private readonly ICandidateRepository _candidateRepository;
    private readonly IJobRepository _jobRepository;
    private readonly IAccessRequestRepository _accessRequestRepository;
    private readonly ICurrentAdminProvider _currentAdminProvider;
    private readonly ILogger<JobApplicationService> _logger;

    public JobApplicationService(
        IJobApplicationRepository jobApplicationRepository,
        ICandidateRepository candidateRepository,
        IJobRepository jobRepository,
        IAccessRequestRepository accessRequestRepository,
        ICurrentAdminProvider currentAdminProvider,
        ILogger<JobApplicationService> logger)
    {
        _jobApplicationRepository = jobApplicationRepository;
        _candidateRepository = candidateRepository;
        _jobRepository = jobRepository;
        _accessRequestRepository = accessRequestRepository;
        _currentAdminProvider = currentAdminProvider;
        _logger = logger;
    }

    public async Task<List<JobApplicationDto>> GetJobApplicationsAsync(OwnershipScope scope)
    {
        var applicationEntities = scope == OwnershipScope.Yours
            ? await GetOwnedApplicationsAsync()
            : await _jobApplicationRepository.GetAllWithDetailsAsync();

        return applicationEntities
            .Select(MapApplication)
            .ToList();
    }

    public async Task<JobApplicationDto?> GetJobApplicationAsync(string id)
    {
        var applicationId = ParseApplicationId(id);
        if (applicationId == null)
        {
            return null;
        }

        var application = await _jobApplicationRepository.GetByIdWithDetailsAsync(applicationId.Value);
        return application == null ? null : MapApplication(application);
    }

    public async Task<(JobApplicationDto? Result, string? ErrorMessage)> CreateJobApplicationAsync(CreateJobApplicationDto dto)
    {
        if (dto == null)
        {
            return (null, "Request body is required");
        }

        var candidate = await _candidateRepository.FindByIdAsync(dto.CandidateId);
        if (candidate == null)
        {
            return (null, "Candidate not found");
        }

        var job = await _jobRepository.FindByIdAsync(dto.JobId);
        if (job == null)
        {
            return (null, "Job not found");
        }

        var application = new JobApplication
        {
            CandidateId = dto.CandidateId,
            JobId = dto.JobId,
            ApplicationDate = DateTime.UtcNow,
            Status = "Applied",
            CoverLetter = string.Empty,
            InterviewNotes = dto.InterviewNotes ?? string.Empty,
            RejectionReason = string.Empty,
            ExpectedSalary = dto.ExpectedSalary,
            OwnerAdminId = _currentAdminProvider.AdminId,
            CreatedAt = DateTime.UtcNow
        };

        await _jobApplicationRepository.AddAsync(application);
        await _jobApplicationRepository.SaveChangesAsync();

        var resultEntity = await _jobApplicationRepository.GetByIdWithDetailsAsync(application.ApplicationId);
        if (resultEntity == null)
        {
            _logger.LogWarning("Job application created but could not be reloaded: {Id}", application.ApplicationId);
            return (null, "Job application created but could not be reloaded");
        }

        return (MapApplication(resultEntity), null);
    }

    public async Task<(JobApplicationDto? Result, string? ErrorMessage, bool NotFound)> UpdateJobApplicationAsync(string id, UpdateJobApplicationDto dto)
    {
        if (dto == null || string.IsNullOrEmpty(dto.Status))
        {
            return (null, "Status is required", false);
        }

        var applicationId = ParseApplicationId(id);
        if (applicationId == null)
        {
            return (null, "Invalid application id", false);
        }

        var application = await _jobApplicationRepository.FindByIdAsync(applicationId.Value);
        if (application == null)
        {
            return (null, null, true);
        }

        await EnsureHasEditAccessAsync(application.OwnerAdminId, applicationId.Value);

        application.Status = dto.Status;
        application.InterviewNotes = dto.InterviewNotes ?? string.Empty;
        if (dto.OfferedSalary.HasValue)
        {
            application.OfferedSalary = dto.OfferedSalary.Value;
        }
        application.UpdatedAt = DateTime.UtcNow;

        await _jobApplicationRepository.SaveChangesAsync();

        var updatedEntity = await _jobApplicationRepository.GetByIdWithDetailsAsync(applicationId.Value);
        if (updatedEntity == null)
        {
            return (null, "Job application updated but could not be reloaded", false);
        }

        return (MapApplication(updatedEntity), null, false);
    }

    public async Task<(bool Success, string? ErrorMessage, bool NotFound)> DeleteJobApplicationAsync(string id)
    {
        var applicationId = ParseApplicationId(id);
        if (applicationId == null)
        {
            return (false, "Invalid application id", false);
        }

        var application = await _jobApplicationRepository.FindByIdAsync(applicationId.Value);
        if (application == null)
        {
            return (false, null, true);
        }

        await EnsureHasEditAccessAsync(application.OwnerAdminId, applicationId.Value);

        _jobApplicationRepository.Remove(application);
        await _jobApplicationRepository.SaveChangesAsync();
        return (true, null, false);
    }

    private async Task<List<JobApplication>> GetOwnedApplicationsAsync()
    {
        var adminId = _currentAdminProvider.AdminId;
        if (string.IsNullOrWhiteSpace(adminId))
        {
            return new List<JobApplication>();
        }

        return await _jobApplicationRepository.GetAllWithDetailsForOwnerAsync(adminId);
    }

    private async Task EnsureHasEditAccessAsync(string? ownerAdminId, int applicationId)
    {
        var adminId = _currentAdminProvider.AdminId;
        if (string.IsNullOrWhiteSpace(adminId))
        {
            throw new ForbiddenException("X-Admin-Id header is required");
        }

        if (string.IsNullOrWhiteSpace(ownerAdminId))
        {
            var application = await _jobApplicationRepository.FindByIdAsync(applicationId);
            if (application != null && string.IsNullOrWhiteSpace(application.OwnerAdminId))
            {
                application.OwnerAdminId = adminId;
                await _jobApplicationRepository.SaveChangesAsync();
            }

            return;
        }

        if (string.Equals(ownerAdminId, adminId, StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        var approved = await _accessRequestRepository.FindActiveApprovalAsync(adminId, "JobApplication", applicationId, DateTime.UtcNow);
        if (approved == null)
        {
            throw new ForbiddenException("You do not have access to modify this job application");
        }
    }

    private static int? ParseApplicationId(string id)
    {
        if (string.IsNullOrWhiteSpace(id))
        {
            return null;
        }

        if (id.StartsWith("APP-", StringComparison.OrdinalIgnoreCase))
        {
            id = id.Replace("APP-", "", StringComparison.OrdinalIgnoreCase);
        }

        return int.TryParse(id, out var parsed) ? parsed : null;
    }

    private static JobApplicationDto MapApplication(JobApplication ja)
    {
        return new JobApplicationDto
        {
            Id = "APP-" + ja.ApplicationId.ToString("D3"),
            CandidateId = "C-" + ja.CandidateId.ToString("D3"),
            Candidate = new CandidateDto
            {
                Id = "C-" + ja.Candidate.CandidateId.ToString("D3"),
                FirstName = ja.Candidate.FirstName,
                LastName = ja.Candidate.LastName,
                Email = ja.Candidate.Email,
                PhoneNumber = string.IsNullOrWhiteSpace(ja.Candidate.PhoneNumber) ? null : ja.Candidate.PhoneNumber,
                Skills = !string.IsNullOrEmpty(ja.Candidate.Skills)
                    ? ja.Candidate.Skills.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(s => s.Trim()).ToList()
                    : new List<string>(),
                LinkedInUrl = ja.Candidate.LinkedInProfile ?? "#",
                ResumeUrl = ja.Candidate.ResumePath ?? "#",
                AvatarUrl = "https://picsum.photos/200/200?random=" + (ja.Candidate.CandidateId + 100),
                OwnerAdminId = ja.Candidate.OwnerAdminId
            },
            Position = ja.Job.JobTitle,
            DepartmentId = "D-" + ja.Job.DepartmentId.ToString("D2"),
            Status = ja.Status,
            InterviewNotes = ja.InterviewNotes,
            ExpectedSalary = ja.ExpectedSalary ?? 0,
            OfferedSalary = ja.OfferedSalary,
            JobId = ja.JobId,
            MatchScore = CalculateMatchScore(ja.Candidate.YearsOfExperience, ja.ExpectedSalary, ja.Job.MaxSalary),
            OwnerAdminId = ja.OwnerAdminId
        };
    }

    private static int CalculateMatchScore(int? yearsOfExperience, decimal? expectedSalary, decimal maxSalary)
    {
        var score = 70;

        if (yearsOfExperience.HasValue)
        {
            score += Math.Min(yearsOfExperience.Value * 2, 20);
        }

        if (expectedSalary.HasValue && maxSalary > 0)
        {
            var salaryRatio = (double)(expectedSalary.Value / maxSalary);
            if (salaryRatio <= 0.8)
                score += 10;
            else if (salaryRatio <= 1.0)
                score += 5;
        }

        return Math.Min(score, 100);
    }
}
