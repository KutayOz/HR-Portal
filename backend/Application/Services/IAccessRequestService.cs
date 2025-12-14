using Application.DTOs;

namespace Application.Services;

public interface IAccessRequestService
{
    Task<(AccessRequestDto? Result, string? ErrorMessage, bool NotFound)> CreateAsync(string requesterAdminId, CreateAccessRequestDto dto);
    Task<List<AccessRequestDto>> GetInboxAsync(string ownerAdminId);
    Task<List<AccessRequestDto>> GetOutboxAsync(string requesterAdminId);
    Task<(AccessRequestDto? Result, string? ErrorMessage, bool NotFound)> ApproveAsync(int accessRequestId, string ownerAdminId, DecideAccessRequestDto dto);
    Task<(AccessRequestDto? Result, string? ErrorMessage, bool NotFound)> DenyAsync(int accessRequestId, string ownerAdminId);
}
