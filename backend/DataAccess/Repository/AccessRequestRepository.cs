using Application.Repositories;
using Common.Entity;
using Data.Context;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.Repository;

public sealed class AccessRequestRepository : IAccessRequestRepository
{
    private readonly HRPortalDbContext _context;

    public AccessRequestRepository(HRPortalDbContext context)
    {
        _context = context;
    }

    public Task<AccessRequest?> FindByIdAsync(int accessRequestId, CancellationToken cancellationToken = default)
    {
        return _context.AccessRequests.FirstOrDefaultAsync(r => r.AccessRequestId == accessRequestId, cancellationToken);
    }

    public Task<AccessRequest?> FindPendingAsync(string requesterAdminId, string resourceType, int resourceId, CancellationToken cancellationToken = default)
    {
        return _context.AccessRequests
            .OrderByDescending(r => r.AccessRequestId)
            .FirstOrDefaultAsync(r =>
                r.RequesterAdminId == requesterAdminId &&
                r.ResourceType == resourceType &&
                r.ResourceId == resourceId &&
                r.Status == "Pending",
                cancellationToken);
    }

    public Task<AccessRequest?> FindActiveApprovalAsync(string requesterAdminId, string resourceType, int resourceId, DateTime nowUtc, CancellationToken cancellationToken = default)
    {
        return _context.AccessRequests
            .OrderByDescending(r => r.AccessRequestId)
            .FirstOrDefaultAsync(r =>
                r.RequesterAdminId == requesterAdminId &&
                r.ResourceType == resourceType &&
                r.ResourceId == resourceId &&
                r.Status == "Approved" &&
                r.AllowedUntil.HasValue &&
                r.AllowedUntil.Value > nowUtc,
                cancellationToken);
    }

    public Task<List<AccessRequest>> GetInboxAsync(string ownerAdminId, CancellationToken cancellationToken = default)
    {
        return _context.AccessRequests
            .AsNoTracking()
            .Where(r => r.OwnerAdminId == ownerAdminId)
            .OrderByDescending(r => r.AccessRequestId)
            .ToListAsync(cancellationToken);
    }

    public Task<List<AccessRequest>> GetOutboxAsync(string requesterAdminId, CancellationToken cancellationToken = default)
    {
        return _context.AccessRequests
            .AsNoTracking()
            .Where(r => r.RequesterAdminId == requesterAdminId)
            .OrderByDescending(r => r.AccessRequestId)
            .ToListAsync(cancellationToken);
    }

    public Task AddAsync(AccessRequest request, CancellationToken cancellationToken = default)
    {
        return _context.AccessRequests.AddAsync(request, cancellationToken).AsTask();
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return _context.SaveChangesAsync(cancellationToken);
    }
}
