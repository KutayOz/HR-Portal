using Common.Entity;
using Data.Context;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.Repository;

public sealed class DepartmentRepository : Application.Repositories.IDepartmentRepository
{
    private readonly HRPortalDbContext _context;

    public DepartmentRepository(HRPortalDbContext context)
    {
        _context = context;
    }

    public Task<List<Department>> GetAllWithJobsAsync(CancellationToken cancellationToken = default)
    {
        return _context.Departments
            .Include(d => d.Jobs)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public Task<List<Department>> GetAllWithJobsForOwnerAsync(string ownerAdminId, CancellationToken cancellationToken = default)
    {
        return _context.Departments
            .Where(d => d.OwnerAdminId == ownerAdminId)
            .Include(d => d.Jobs)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public Task<Department?> GetByIdWithJobsAsync(int departmentId, CancellationToken cancellationToken = default)
    {
        return _context.Departments
            .Include(d => d.Jobs)
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.DepartmentId == departmentId, cancellationToken);
    }

    public Task<Department?> GetByIdWithEmployeesAsync(int departmentId, CancellationToken cancellationToken = default)
    {
        return _context.Departments
            .Include(d => d.Employees)
            .FirstOrDefaultAsync(d => d.DepartmentId == departmentId, cancellationToken);
    }

    public Task<Department?> FindByIdAsync(int departmentId, CancellationToken cancellationToken = default)
    {
        return _context.Departments.FirstOrDefaultAsync(d => d.DepartmentId == departmentId, cancellationToken);
    }

    public Task<Department?> FindByNameAsync(string departmentName, CancellationToken cancellationToken = default)
    {
        var normalized = departmentName.Trim();
        return _context.Departments.FirstOrDefaultAsync(d => d.DepartmentName == normalized, cancellationToken);
    }

    public Task<bool> DepartmentNameExistsAsync(
        string departmentName,
        int? excludingDepartmentId = null,
        CancellationToken cancellationToken = default)
    {
        var normalized = departmentName.Trim();

        var query = _context.Departments.AsQueryable().Where(d => d.DepartmentName == normalized);

        if (excludingDepartmentId.HasValue)
        {
            query = query.Where(d => d.DepartmentId != excludingDepartmentId.Value);
        }

        return query.AnyAsync(cancellationToken);
    }

    public Task AddAsync(Department department, CancellationToken cancellationToken = default)
    {
        return _context.Departments.AddAsync(department, cancellationToken).AsTask();
    }

    public Task AddJobsAsync(IEnumerable<Job> jobs, CancellationToken cancellationToken = default)
    {
        return _context.Jobs.AddRangeAsync(jobs, cancellationToken);
    }

    public Task<List<Job>> GetJobsByIdsAsync(int departmentId, IEnumerable<int> jobIds, CancellationToken cancellationToken = default)
    {
        var ids = jobIds.Distinct().ToList();

        return _context.Jobs
            .Where(j => j.DepartmentId == departmentId && ids.Contains(j.JobId))
            .ToListAsync(cancellationToken);
    }

    public void Remove(Department department)
    {
        _context.Departments.Remove(department);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return _context.SaveChangesAsync(cancellationToken);
    }
}
