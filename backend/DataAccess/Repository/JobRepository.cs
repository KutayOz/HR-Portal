using Common.Entity;
using Data.Context;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.Repository;

public sealed class JobRepository : Application.Repositories.IJobRepository
{
    private readonly HRPortalDbContext _context;

    public JobRepository(HRPortalDbContext context)
    {
        _context = context;
    }

    public Task<List<Job>> GetAllWithDepartmentAsync(CancellationToken cancellationToken = default)
    {
        return _context.Jobs
            .Include(j => j.Department)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public Task<List<Job>> GetByDepartmentIdAsync(int departmentId, CancellationToken cancellationToken = default)
    {
        return _context.Jobs
            .Include(j => j.Department)
            .Where(j => j.DepartmentId == departmentId)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public Task<Job?> GetByIdWithDepartmentAsync(int jobId, CancellationToken cancellationToken = default)
    {
        return _context.Jobs
            .Include(j => j.Department)
            .FirstOrDefaultAsync(j => j.JobId == jobId, cancellationToken);
    }

    public Task<Job?> FindByIdAsync(int jobId, CancellationToken cancellationToken = default)
    {
        return _context.Jobs.FirstOrDefaultAsync(j => j.JobId == jobId, cancellationToken);
    }

    public async Task<bool> IsJobInUseAsync(int jobId, CancellationToken cancellationToken = default)
    {
        var usedByEmployees = await _context.Employees.AnyAsync(e => e.JobId == jobId, cancellationToken);
        if (usedByEmployees)
        {
            return true;
        }

        var usedByApplications = await _context.JobApplications.AnyAsync(ja => ja.JobId == jobId, cancellationToken);
        return usedByApplications;
    }

    public Task AddAsync(Job job, CancellationToken cancellationToken = default)
    {
        return _context.Jobs.AddAsync(job, cancellationToken).AsTask();
    }

    public void Remove(Job job)
    {
        _context.Jobs.Remove(job);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return _context.SaveChangesAsync(cancellationToken);
    }
}
