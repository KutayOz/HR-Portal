using Application.Repositories;
using Common.Entity;
using Data.Context;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.Repository;

public sealed class AdminDelegationRepository : IAdminDelegationRepository
{
    private readonly HRPortalDbContext _context;

    public AdminDelegationRepository(HRPortalDbContext context)
    {
        _context = context;
    }

    public Task<List<AdminDelegation>> GetByFromAdminAsync(string fromAdminId, CancellationToken cancellationToken = default)
    {
        return _context.AdminDelegations
            .Where(d => d.FromAdminId == fromAdminId)
            .OrderByDescending(d => d.CreatedAt)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public Task<List<AdminDelegation>> GetByToAdminAsync(string toAdminId, CancellationToken cancellationToken = default)
    {
        return _context.AdminDelegations
            .Where(d => d.ToAdminId == toAdminId)
            .OrderByDescending(d => d.CreatedAt)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public Task<List<AdminDelegation>> GetActiveByToAdminAsync(string toAdminId, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        return _context.AdminDelegations
            .Where(d => d.ToAdminId == toAdminId && 
                        d.Status == "Active" && 
                        d.StartDate <= now && 
                        d.EndDate > now)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public Task<AdminDelegation?> FindByIdAsync(int delegationId, CancellationToken cancellationToken = default)
    {
        return _context.AdminDelegations.FirstOrDefaultAsync(d => d.DelegationId == delegationId, cancellationToken);
    }

    public Task AddAsync(AdminDelegation delegation, CancellationToken cancellationToken = default)
    {
        return _context.AdminDelegations.AddAsync(delegation, cancellationToken).AsTask();
    }

    public void Remove(AdminDelegation delegation)
    {
        _context.AdminDelegations.Remove(delegation);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return _context.SaveChangesAsync(cancellationToken);
    }
}
