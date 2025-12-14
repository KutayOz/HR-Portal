using Application.Repositories;
using Common.Entity;
using Data.Context;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.Repository;

public sealed class EmployeeRepository : IEmployeeRepository
{
    private readonly HRPortalDbContext _context;

    public EmployeeRepository(HRPortalDbContext context)
    {
        _context = context;
    }

    public Task<List<Employee>> GetNonTerminatedWithDetailsAsync(CancellationToken cancellationToken = default)
    {
        return _context.Employees
            .Include(e => e.Department)
            .Include(e => e.Job)
            .Where(e => e.EmploymentStatus != "Terminated")
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public Task<List<Employee>> GetNonTerminatedWithDetailsForOwnerAsync(string ownerAdminId, CancellationToken cancellationToken = default)
    {
        return _context.Employees
            .Include(e => e.Department)
            .Include(e => e.Job)
            .Include(e => e.Manager)
            .Include(e => e.Subordinates)
            .Include(e => e.AttendanceRecords.Where(a => a.Date.Date == DateTime.UtcNow.Date))
            .Where(e => e.EmploymentStatus != "Terminated" && e.OwnerAdminId == ownerAdminId)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public Task<List<Employee>> GetAllWithHierarchyAsync(CancellationToken cancellationToken = default)
    {
        return _context.Employees
            .Include(e => e.Department)
            .Include(e => e.Job)
            .Include(e => e.Manager)
            .Include(e => e.Subordinates)
            .Include(e => e.AttendanceRecords.Where(a => a.Date.Date == DateTime.UtcNow.Date))
            .Where(e => e.EmploymentStatus != "Terminated")
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public Task<Employee?> GetByIdWithDetailsAsync(int employeeId, CancellationToken cancellationToken = default)
    {
        return _context.Employees
            .Include(e => e.Department)
            .Include(e => e.Job)
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.EmployeeId == employeeId, cancellationToken);
    }

    public Task<Employee?> GetByIdWithHierarchyAsync(int employeeId, CancellationToken cancellationToken = default)
    {
        return _context.Employees
            .Include(e => e.Department)
            .Include(e => e.Job)
            .Include(e => e.Manager)
            .Include(e => e.Subordinates)
            .Include(e => e.AttendanceRecords.Where(a => a.Date.Date == DateTime.UtcNow.Date))
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.EmployeeId == employeeId, cancellationToken);
    }

    public Task<List<Employee>> GetSubordinatesAsync(int managerId, CancellationToken cancellationToken = default)
    {
        return _context.Employees
            .Include(e => e.Department)
            .Include(e => e.Job)
            .Where(e => e.ManagerId == managerId && e.EmploymentStatus != "Terminated")
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public Task<Employee?> FindByIdAsync(int employeeId, CancellationToken cancellationToken = default)
    {
        return _context.Employees.FirstOrDefaultAsync(e => e.EmployeeId == employeeId, cancellationToken);
    }

    public Task<bool> EmailExistsAsync(string email, int? excludingEmployeeId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Employees.AsQueryable().Where(e => e.Email == email);

        if (excludingEmployeeId.HasValue)
        {
            query = query.Where(e => e.EmployeeId != excludingEmployeeId.Value);
        }

        return query.AnyAsync(cancellationToken);
    }

    public Task AddAsync(Employee employee, CancellationToken cancellationToken = default)
    {
        return _context.Employees.AddAsync(employee, cancellationToken).AsTask();
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return _context.SaveChangesAsync(cancellationToken);
    }
}
