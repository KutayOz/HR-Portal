using Application.DTOs;
using Application.Exceptions;
using Application.Infrastructure;
using Application.Repositories;
using Common.Entity;
using Microsoft.Extensions.Logging;

namespace Application.Services;

public sealed class CandidateService : ICandidateService
{
    private readonly ICandidateRepository _candidateRepository;
    private readonly IJobApplicationRepository _jobApplicationRepository;
    private readonly IAccessRequestRepository _accessRequestRepository;
    private readonly ICurrentAdminProvider _currentAdminProvider;
    private readonly ILogger<CandidateService> _logger;

    public CandidateService(
        ICandidateRepository candidateRepository,
        IJobApplicationRepository jobApplicationRepository,
        IAccessRequestRepository accessRequestRepository,
        ICurrentAdminProvider currentAdminProvider,
        ILogger<CandidateService> logger)
    {
        _candidateRepository = candidateRepository;
        _jobApplicationRepository = jobApplicationRepository;
        _accessRequestRepository = accessRequestRepository;
        _currentAdminProvider = currentAdminProvider;
        _logger = logger;
    }

    public async Task<List<CandidateDto>> GetCandidatesAsync(OwnershipScope scope)
    {
        var candidateEntities = scope == OwnershipScope.Yours
            ? await GetOwnedCandidatesAsync()
            : await _candidateRepository.GetAllAsync();

        return candidateEntities
            .Select(MapCandidate)
            .ToList();
    }

    public async Task<(CandidateDto? Result, string? ErrorMessage)> CreateCandidateAsync(CreateCandidateDto dto)
    {
        if (dto == null)
        {
            return (null, "Request body is required");
        }

        if (string.IsNullOrWhiteSpace(dto.Email))
        {
            return (null, "Email is required");
        }

        if (await _candidateRepository.EmailExistsAsync(dto.Email))
        {
            return (null, "Email already exists");
        }

        var candidate = new Candidate
        {
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Email = dto.Email,
            PhoneNumber = dto.PhoneNumber ?? string.Empty,
            Address = string.Empty,
            City = string.Empty,
            State = string.Empty,
            PostalCode = string.Empty,
            Country = string.Empty,
            ResumePath = dto.ResumePath ?? string.Empty,
            LinkedInProfile = dto.LinkedInProfile ?? string.Empty,
            CurrentCompany = string.Empty,
            CurrentPosition = string.Empty,
            YearsOfExperience = dto.YearsOfExperience,
            Skills = dto.Skills ?? string.Empty,
            HighestEducation = string.Empty,
            OwnerAdminId = _currentAdminProvider.AdminId,
            CreatedAt = DateTime.UtcNow
        };

        await _candidateRepository.AddAsync(candidate);
        await _candidateRepository.SaveChangesAsync();

        return (MapCandidate(candidate), null);
    }

    public async Task<(bool Success, string? ErrorMessage, bool NotFound)> DeleteCandidateAsync(int id)
    {
        var candidate = await _candidateRepository.FindByIdAsync(id);
        if (candidate == null)
        {
            return (false, null, true);
        }

        await EnsureHasEditAccessAsync(candidate.OwnerAdminId, id);

        var applications = await _jobApplicationRepository.GetByCandidateIdAsync(id);
        if (applications.Any())
        {
            _jobApplicationRepository.RemoveRange(applications);
        }

        _candidateRepository.Remove(candidate);
        await _candidateRepository.SaveChangesAsync();

        return (true, null, false);
    }

    private async Task<List<Candidate>> GetOwnedCandidatesAsync()
    {
        var adminId = _currentAdminProvider.AdminId;
        if (string.IsNullOrWhiteSpace(adminId))
        {
            return new List<Candidate>();
        }

        return await _candidateRepository.GetAllForOwnerAsync(adminId);
    }

    private async Task EnsureHasEditAccessAsync(string? ownerAdminId, int candidateId)
    {
        var adminId = _currentAdminProvider.AdminId;
        if (string.IsNullOrWhiteSpace(adminId))
        {
            throw new ForbiddenException("X-Admin-Id header is required");
        }

        if (string.IsNullOrWhiteSpace(ownerAdminId))
        {
            var candidate = await _candidateRepository.FindByIdAsync(candidateId);
            if (candidate != null && string.IsNullOrWhiteSpace(candidate.OwnerAdminId))
            {
                candidate.OwnerAdminId = adminId;
                await _candidateRepository.SaveChangesAsync();
            }

            return;
        }

        if (string.Equals(ownerAdminId, adminId, StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        var approved = await _accessRequestRepository.FindActiveApprovalAsync(adminId, "Candidate", candidateId, DateTime.UtcNow);
        if (approved == null)
        {
            throw new ForbiddenException("You do not have access to modify this candidate");
        }
    }

    private static CandidateDto MapCandidate(Candidate c)
    {
        return new CandidateDto
        {
            Id = "C-" + c.CandidateId.ToString("D3"),
            FirstName = c.FirstName,
            LastName = c.LastName,
            Email = c.Email,
            PhoneNumber = string.IsNullOrWhiteSpace(c.PhoneNumber) ? null : c.PhoneNumber,
            Skills = !string.IsNullOrEmpty(c.Skills)
                ? c.Skills.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(s => s.Trim()).ToList()
                : new List<string>(),
            LinkedInUrl = c.LinkedInProfile ?? "#",
            ResumeUrl = c.ResumePath ?? "#",
            AvatarUrl = "https://picsum.photos/200/200?random=" + (c.CandidateId + 100),
            OwnerAdminId = c.OwnerAdminId
        };
    }
}
