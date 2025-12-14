using Application.Repositories;
using Common.Entity;
using Data.Context;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.Repository;

public sealed class LeaveRequestRepository : ILeaveRequestRepository
{
    private readonly HRPortalDbContext _context;

    public LeaveRequestRepository(HRPortalDbContext context)
    {
        _context = context;
    }

    public Task<List<LeaveRequest>> GetAllWithEmployeeAsync(CancellationToken cancellationToken = default)
    {
        return _context.LeaveRequests
            .Include(lr => lr.Employee)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public Task<List<LeaveRequest>> GetAllWithEmployeeForOwnerAsync(string ownerAdminId, CancellationToken cancellationToken = default)
    {
        return _context.LeaveRequests
            .Include(lr => lr.Employee)
            .Where(lr => lr.OwnerAdminId == ownerAdminId)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public Task<LeaveRequest?> GetByIdWithEmployeeAsync(int leaveRequestId, CancellationToken cancellationToken = default)
    {
        return _context.LeaveRequests
            .Include(lr => lr.Employee)
            .AsNoTracking()
            .FirstOrDefaultAsync(lr => lr.LeaveRequestId == leaveRequestId, cancellationToken);
    }

    public Task<LeaveRequest?> FindByIdAsync(int leaveRequestId, CancellationToken cancellationToken = default)
    {
        return _context.LeaveRequests.FirstOrDefaultAsync(lr => lr.LeaveRequestId == leaveRequestId, cancellationToken);
    }

    public Task<LeaveRequest?> FindActiveApprovedLeaveAsync(int employeeId, DateTime date, CancellationToken cancellationToken = default)
    {
        return _context.LeaveRequests
            .Where(lr => lr.EmployeeId == employeeId &&
                         lr.Status == "Approved" &&
                         lr.StartDate.Date <= date.Date &&
                         lr.EndDate.Date >= date.Date)
            .AsNoTracking()
            .FirstOrDefaultAsync(cancellationToken);
    }

    public Task AddAsync(LeaveRequest leaveRequest, CancellationToken cancellationToken = default)
    {
        return _context.LeaveRequests.AddAsync(leaveRequest, cancellationToken).AsTask();
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return _context.SaveChangesAsync(cancellationToken);
    }
}
