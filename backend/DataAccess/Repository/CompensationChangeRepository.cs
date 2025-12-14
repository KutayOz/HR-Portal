using Application.Repositories;
using Common.Entity;
using Data.Context;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.Repository;

public sealed class CompensationChangeRepository : ICompensationChangeRepository
{
    private readonly HRPortalDbContext _context;

    public CompensationChangeRepository(HRPortalDbContext context)
    {
        _context = context;
    }

    public Task<List<CompensationChange>> GetByEmployeeIdWithEmployeeAsync(int employeeId, CancellationToken cancellationToken = default)
    {
        return _context.CompensationChanges
            .Include(c => c.Employee)
            .Where(c => c.EmployeeId == employeeId)
            .OrderByDescending(c => c.EffectiveDate)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public Task<CompensationChange?> GetByIdWithEmployeeAsync(int compensationChangeId, CancellationToken cancellationToken = default)
    {
        return _context.CompensationChanges
            .Include(c => c.Employee)
            .FirstOrDefaultAsync(c => c.CompensationChangeId == compensationChangeId, cancellationToken);
    }

    public Task<CompensationChange?> FindByIdAsync(int compensationChangeId, CancellationToken cancellationToken = default)
    {
        return _context.CompensationChanges.FirstOrDefaultAsync(c => c.CompensationChangeId == compensationChangeId, cancellationToken);
    }

    public Task AddAsync(CompensationChange change, CancellationToken cancellationToken = default)
    {
        return _context.CompensationChanges.AddAsync(change, cancellationToken).AsTask();
    }

    public void Remove(CompensationChange change)
    {
        _context.CompensationChanges.Remove(change);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return _context.SaveChangesAsync(cancellationToken);
    }
}
