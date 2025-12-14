using Common.Entity;

namespace Application.Repositories;

public interface IAccessRequestRepository
{
    Task<AccessRequest?> FindByIdAsync(int accessRequestId, CancellationToken cancellationToken = default);
    Task<AccessRequest?> FindPendingAsync(string requesterAdminId, string resourceType, int resourceId, CancellationToken cancellationToken = default);
    Task<AccessRequest?> FindActiveApprovalAsync(string requesterAdminId, string resourceType, int resourceId, DateTime nowUtc, CancellationToken cancellationToken = default);

    Task<List<AccessRequest>> GetInboxAsync(string ownerAdminId, CancellationToken cancellationToken = default);
    Task<List<AccessRequest>> GetOutboxAsync(string requesterAdminId, CancellationToken cancellationToken = default);

    Task AddAsync(AccessRequest request, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
