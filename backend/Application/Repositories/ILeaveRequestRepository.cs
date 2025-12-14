using Common.Entity;

namespace Application.Repositories;

public interface ILeaveRequestRepository
{
    Task<List<LeaveRequest>> GetAllWithEmployeeAsync(CancellationToken cancellationToken = default);
    Task<List<LeaveRequest>> GetAllWithEmployeeForOwnerAsync(string ownerAdminId, CancellationToken cancellationToken = default);
    Task<LeaveRequest?> GetByIdWithEmployeeAsync(int leaveRequestId, CancellationToken cancellationToken = default);
    Task<LeaveRequest?> FindActiveApprovedLeaveAsync(int employeeId, DateTime date, CancellationToken cancellationToken = default);

    Task<LeaveRequest?> FindByIdAsync(int leaveRequestId, CancellationToken cancellationToken = default);

    Task AddAsync(LeaveRequest leaveRequest, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
