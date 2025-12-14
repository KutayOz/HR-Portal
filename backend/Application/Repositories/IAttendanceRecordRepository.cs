using Common.Entity;

namespace Application.Repositories;

public interface IAttendanceRecordRepository
{
    Task<List<AttendanceRecord>> GetByEmployeeIdWithEmployeeAsync(int employeeId, CancellationToken cancellationToken = default);
    Task<AttendanceRecord?> GetByIdWithEmployeeAsync(int attendanceRecordId, CancellationToken cancellationToken = default);
    Task<AttendanceRecord?> FindByIdAsync(int attendanceRecordId, CancellationToken cancellationToken = default);

    Task AddAsync(AttendanceRecord attendanceRecord, CancellationToken cancellationToken = default);
    void Remove(AttendanceRecord attendanceRecord);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
