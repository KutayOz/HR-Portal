using Application.DTOs;
using Application.Repositories;
using Common.Entity;

namespace Application.Services;

public sealed class AccessRequestService : IAccessRequestService
{
    private readonly IAccessRequestRepository _accessRequestRepository;
    private readonly IDepartmentRepository _departmentRepository;
    private readonly IEmployeeRepository _employeeRepository;
    private readonly ICandidateRepository _candidateRepository;
    private readonly IJobApplicationRepository _jobApplicationRepository;
    private readonly ILeaveRequestRepository _leaveRequestRepository;

    public AccessRequestService(
        IAccessRequestRepository accessRequestRepository,
        IDepartmentRepository departmentRepository,
        IEmployeeRepository employeeRepository,
        ICandidateRepository candidateRepository,
        IJobApplicationRepository jobApplicationRepository,
        ILeaveRequestRepository leaveRequestRepository)
    {
        _accessRequestRepository = accessRequestRepository;
        _departmentRepository = departmentRepository;
        _employeeRepository = employeeRepository;
        _candidateRepository = candidateRepository;
        _jobApplicationRepository = jobApplicationRepository;
        _leaveRequestRepository = leaveRequestRepository;
    }

    public async Task<(AccessRequestDto? Result, string? ErrorMessage, bool NotFound)> CreateAsync(string requesterAdminId, CreateAccessRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(requesterAdminId))
        {
            return (null, "Requester admin id is required", false);
        }

        if (dto == null || string.IsNullOrWhiteSpace(dto.ResourceType) || string.IsNullOrWhiteSpace(dto.ResourceId))
        {
            return (null, "ResourceType and ResourceId are required", false);
        }

        var (resourceType, resourceNumericId, notFound) = await ResolveResourceAsync(dto.ResourceType, dto.ResourceId);
        if (notFound)
        {
            return (null, "Resource not found", true);
        }

        var ownerAdminId = await ResolveOwnerAdminIdAsync(resourceType, resourceNumericId);
        if (string.IsNullOrWhiteSpace(ownerAdminId))
        {
            return (null, "Owner admin is not assigned for this resource", false);
        }

        if (string.Equals(ownerAdminId, requesterAdminId, StringComparison.OrdinalIgnoreCase))
        {
            return (null, "You already own this resource", false);
        }

        var existingApproved = await _accessRequestRepository.FindActiveApprovalAsync(requesterAdminId, resourceType, resourceNumericId, DateTime.UtcNow);
        if (existingApproved != null)
        {
            return (Map(existingApproved), null, false);
        }

        var existingPending = await _accessRequestRepository.FindPendingAsync(requesterAdminId, resourceType, resourceNumericId);
        if (existingPending != null)
        {
            return (Map(existingPending), null, false);
        }

        var request = new AccessRequest
        {
            ResourceType = resourceType,
            ResourceId = resourceNumericId,
            OwnerAdminId = ownerAdminId,
            RequesterAdminId = requesterAdminId,
            Status = "Pending",
            RequestedAt = DateTime.UtcNow,
            Note = dto.Note
        };

        await _accessRequestRepository.AddAsync(request);
        await _accessRequestRepository.SaveChangesAsync();

        return (Map(request), null, false);
    }

    public async Task<List<AccessRequestDto>> GetInboxAsync(string ownerAdminId)
    {
        if (string.IsNullOrWhiteSpace(ownerAdminId))
        {
            return new List<AccessRequestDto>();
        }

        var items = await _accessRequestRepository.GetInboxAsync(ownerAdminId);
        return items.Select(Map).ToList();
    }

    public async Task<List<AccessRequestDto>> GetOutboxAsync(string requesterAdminId)
    {
        if (string.IsNullOrWhiteSpace(requesterAdminId))
        {
            return new List<AccessRequestDto>();
        }

        var items = await _accessRequestRepository.GetOutboxAsync(requesterAdminId);
        return items.Select(Map).ToList();
    }

    public async Task<(AccessRequestDto? Result, string? ErrorMessage, bool NotFound)> ApproveAsync(int accessRequestId, string ownerAdminId, DecideAccessRequestDto dto)
    {
        var request = await _accessRequestRepository.FindByIdAsync(accessRequestId);
        if (request == null)
        {
            return (null, null, true);
        }

        if (!string.Equals(request.OwnerAdminId, ownerAdminId, StringComparison.OrdinalIgnoreCase))
        {
            return (null, "Only the owner admin can approve this request", false);
        }

        if (!string.Equals(request.Status, "Pending", StringComparison.OrdinalIgnoreCase))
        {
            return (Map(request), null, false);
        }

        var minutes = dto?.AllowMinutes ?? 15;
        if (minutes <= 0)
        {
            minutes = 15;
        }

        request.Status = "Approved";
        request.DecidedAt = DateTime.UtcNow;
        request.AllowedUntil = DateTime.UtcNow.AddMinutes(minutes);

        await _accessRequestRepository.SaveChangesAsync();

        return (Map(request), null, false);
    }

    public async Task<(AccessRequestDto? Result, string? ErrorMessage, bool NotFound)> DenyAsync(int accessRequestId, string ownerAdminId)
    {
        var request = await _accessRequestRepository.FindByIdAsync(accessRequestId);
        if (request == null)
        {
            return (null, null, true);
        }

        if (!string.Equals(request.OwnerAdminId, ownerAdminId, StringComparison.OrdinalIgnoreCase))
        {
            return (null, "Only the owner admin can deny this request", false);
        }

        if (!string.Equals(request.Status, "Pending", StringComparison.OrdinalIgnoreCase))
        {
            return (Map(request), null, false);
        }

        request.Status = "Denied";
        request.DecidedAt = DateTime.UtcNow;
        request.AllowedUntil = null;

        await _accessRequestRepository.SaveChangesAsync();

        return (Map(request), null, false);
    }

    private async Task<(string ResourceType, int ResourceId, bool NotFound)> ResolveResourceAsync(string resourceType, string resourceId)
    {
        var normalizedType = resourceType.Trim();

        if (!TryParseId(resourceId, out var numericId))
        {
            return (normalizedType, 0, true);
        }

        switch (normalizedType.ToLowerInvariant())
        {
            case "department":
                return ("Department", numericId, await _departmentRepository.FindByIdAsync(numericId) == null);
            case "employee":
                return ("Employee", numericId, await _employeeRepository.FindByIdAsync(numericId) == null);
            case "candidate":
                return ("Candidate", numericId, await _candidateRepository.FindByIdAsync(numericId) == null);
            case "jobapplication":
                return ("JobApplication", numericId, await _jobApplicationRepository.FindByIdAsync(numericId) == null);
            case "leaverequest":
                return ("LeaveRequest", numericId, await _leaveRequestRepository.FindByIdAsync(numericId) == null);
            default:
                return (normalizedType, numericId, true);
        }
    }

    private async Task<string?> ResolveOwnerAdminIdAsync(string resourceType, int resourceId)
    {
        switch (resourceType)
        {
            case "Department":
                return (await _departmentRepository.FindByIdAsync(resourceId))?.OwnerAdminId;
            case "Employee":
                return (await _employeeRepository.FindByIdAsync(resourceId))?.OwnerAdminId;
            case "Candidate":
                return (await _candidateRepository.FindByIdAsync(resourceId))?.OwnerAdminId;
            case "JobApplication":
                return (await _jobApplicationRepository.FindByIdAsync(resourceId))?.OwnerAdminId;
            case "LeaveRequest":
                return (await _leaveRequestRepository.FindByIdAsync(resourceId))?.OwnerAdminId;
            default:
                return null;
        }
    }

    private static bool TryParseId(string raw, out int id)
    {
        id = 0;
        if (string.IsNullOrWhiteSpace(raw))
        {
            return false;
        }

        var value = raw.Trim();
        var separators = new[] { "D-", "E-", "C-", "APP-", "L-" };
        foreach (var prefix in separators)
        {
            if (value.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            {
                value = value.Substring(prefix.Length);
                break;
            }
        }

        return int.TryParse(value, out id);
    }

    private static AccessRequestDto Map(AccessRequest r)
    {
        return new AccessRequestDto
        {
            Id = "AR-" + r.AccessRequestId,
            ResourceType = r.ResourceType,
            ResourceId = r.ResourceType switch
            {
                "Department" => "D-" + r.ResourceId.ToString("D2"),
                "Employee" => "E-" + r.ResourceId,
                "Candidate" => "C-" + r.ResourceId.ToString("D3"),
                "JobApplication" => "APP-" + r.ResourceId.ToString("D3"),
                "LeaveRequest" => "L-" + r.ResourceId,
                _ => r.ResourceId.ToString()
            },
            OwnerAdminId = r.OwnerAdminId,
            RequesterAdminId = r.RequesterAdminId,
            Status = r.Status,
            RequestedAt = r.RequestedAt.ToString("o"),
            DecidedAt = r.DecidedAt?.ToString("o"),
            AllowedUntil = r.AllowedUntil?.ToString("o"),
            Note = r.Note
        };
    }
}
