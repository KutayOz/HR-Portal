using Application.Repositories;
using Common.Entity;
using Data.Context;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.Repository;

public sealed class AttendanceRecordRepository : IAttendanceRecordRepository
{
    private readonly HRPortalDbContext _context;

    public AttendanceRecordRepository(HRPortalDbContext context)
    {
        _context = context;
    }

    public Task<List<AttendanceRecord>> GetByEmployeeIdWithEmployeeAsync(int employeeId, CancellationToken cancellationToken = default)
    {
        return _context.AttendanceRecords
            .Include(r => r.Employee)
            .Where(r => r.EmployeeId == employeeId)
            .OrderByDescending(r => r.Date)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public Task<AttendanceRecord?> GetByIdWithEmployeeAsync(int attendanceRecordId, CancellationToken cancellationToken = default)
    {
        return _context.AttendanceRecords
            .Include(r => r.Employee)
            .FirstOrDefaultAsync(r => r.AttendanceRecordId == attendanceRecordId, cancellationToken);
    }

    public Task<AttendanceRecord?> FindByIdAsync(int attendanceRecordId, CancellationToken cancellationToken = default)
    {
        return _context.AttendanceRecords.FirstOrDefaultAsync(r => r.AttendanceRecordId == attendanceRecordId, cancellationToken);
    }

    public Task AddAsync(AttendanceRecord attendanceRecord, CancellationToken cancellationToken = default)
    {
        return _context.AttendanceRecords.AddAsync(attendanceRecord, cancellationToken).AsTask();
    }

    public void Remove(AttendanceRecord attendanceRecord)
    {
        _context.AttendanceRecords.Remove(attendanceRecord);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return _context.SaveChangesAsync(cancellationToken);
    }
}
