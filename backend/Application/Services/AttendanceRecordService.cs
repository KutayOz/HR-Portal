using Application.DTOs;
using Application.Repositories;
using Common.Entity;
using Microsoft.Extensions.Logging;

namespace Application.Services;

public sealed class AttendanceRecordService : IAttendanceRecordService
{
    private readonly IAttendanceRecordRepository _attendanceRecordRepository;
    private readonly IEmployeeRepository _employeeRepository;
    private readonly ILogger<AttendanceRecordService> _logger;

    public AttendanceRecordService(
        IAttendanceRecordRepository attendanceRecordRepository,
        IEmployeeRepository employeeRepository,
        ILogger<AttendanceRecordService> logger)
    {
        _attendanceRecordRepository = attendanceRecordRepository;
        _employeeRepository = employeeRepository;
        _logger = logger;
    }

    public async Task<List<AttendanceRecordDto>> GetRecordsByEmployeeAsync(int employeeId)
    {
        var records = await _attendanceRecordRepository.GetByEmployeeIdWithEmployeeAsync(employeeId);
        return records.Select(MapRecord).ToList();
    }

    public async Task<(AttendanceRecordDto? Result, string? ErrorMessage)> CreateRecordAsync(CreateAttendanceRecordDto dto)
    {
        if (dto == null)
        {
            return (null, "Request body is required");
        }

        var employee = await _employeeRepository.FindByIdAsync(dto.EmployeeId);
        if (employee == null)
        {
            return (null, "Employee not found");
        }

        var date = dto.Date.Date;
        if (date.Kind != DateTimeKind.Utc)
        {
            date = DateTime.SpecifyKind(date, DateTimeKind.Utc);
        }

        if (!TimeSpan.TryParse(dto.CheckInTime, out var checkIn))
        {
            return (null, "Invalid CheckInTime format (HH:mm)");
        }

        TimeSpan? checkOut = null;
        if (!string.IsNullOrEmpty(dto.CheckOutTime))
        {
            if (TimeSpan.TryParse(dto.CheckOutTime, out var parsed))
            {
                checkOut = parsed;
            }
            else
            {
                return (null, "Invalid CheckOutTime format (HH:mm)");
            }
        }

        TimeSpan? totalHours = null;
        if (checkOut.HasValue)
        {
            totalHours = checkOut.Value - checkIn;
        }

        var record = new AttendanceRecord
        {
            EmployeeId = dto.EmployeeId,
            Date = date,
            CheckInTime = checkIn,
            CheckOutTime = checkOut,
            TotalHours = totalHours,
            Status = dto.Status,
            Remarks = dto.Remarks ?? string.Empty,
            CreatedAt = DateTime.UtcNow
        };

        try
        {
            await _attendanceRecordRepository.AddAsync(record);
            await _attendanceRecordRepository.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating attendance record");
            var fullMessage = ex.ToString();
            if (fullMessage.Contains("IX_AttendanceRecords_EmployeeId_Date", StringComparison.OrdinalIgnoreCase) ||
                fullMessage.Contains("23505", StringComparison.Ordinal) ||
                fullMessage.Contains("duplicate key", StringComparison.OrdinalIgnoreCase))
            {
                return (null, "Attendance record already exists for this date");
            }

            return (null, "Unable to save attendance record");
        }

        // Auto-sync employee status if attendance is for today and status is not Present
        await SyncEmployeeStatusWithAttendanceAsync(employee, dto.Status, date);

        var result = new AttendanceRecordDto
        {
            Id = record.AttendanceRecordId,
            EmployeeId = record.EmployeeId,
            EmployeeName = employee.FirstName + " " + employee.LastName,
            Date = record.Date,
            CheckInTime = record.CheckInTime.ToString(@"hh\:mm"),
            CheckOutTime = record.CheckOutTime?.ToString(@"hh\:mm"),
            TotalHours = record.TotalHours?.TotalHours ?? 0,
            Status = record.Status,
            Remarks = record.Remarks
        };

        return (result, null);
    }

    public async Task<(AttendanceRecordDto? Result, string? ErrorMessage, bool NotFound)> UpdateRecordAsync(int id, UpdateAttendanceRecordDto dto)
    {
        var record = await _attendanceRecordRepository.GetByIdWithEmployeeAsync(id);
        if (record == null)
        {
            return (null, null, true);
        }

        var date = dto.Date.Date;
        if (date.Kind != DateTimeKind.Utc)
        {
            date = DateTime.SpecifyKind(date, DateTimeKind.Utc);
        }

        if (!TimeSpan.TryParse(dto.CheckInTime, out var checkIn))
        {
            return (null, "Invalid CheckInTime format (HH:mm)", false);
        }

        TimeSpan? checkOut = null;
        if (!string.IsNullOrEmpty(dto.CheckOutTime))
        {
            if (TimeSpan.TryParse(dto.CheckOutTime, out var parsed))
            {
                checkOut = parsed;
            }
            else
            {
                return (null, "Invalid CheckOutTime format (HH:mm)", false);
            }
        }

        TimeSpan? totalHours = null;
        if (checkOut.HasValue)
        {
            totalHours = checkOut.Value - checkIn;
        }

        record.Date = date;
        record.CheckInTime = checkIn;
        record.CheckOutTime = checkOut;
        record.TotalHours = totalHours;
        record.Status = dto.Status;
        record.Remarks = dto.Remarks ?? string.Empty;
        record.UpdatedAt = DateTime.UtcNow;

        try
        {
            await _attendanceRecordRepository.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating attendance record");
            var fullMessage = ex.ToString();
            if (fullMessage.Contains("IX_AttendanceRecords_EmployeeId_Date", StringComparison.OrdinalIgnoreCase) ||
                fullMessage.Contains("23505", StringComparison.Ordinal) ||
                fullMessage.Contains("duplicate key", StringComparison.OrdinalIgnoreCase))
            {
                return (null, "Attendance record already exists for this date", false);
            }

            return (null, "Unable to update attendance record", false);
        }

        // Auto-sync employee status if attendance is for today and status changed
        var employee = await _employeeRepository.FindByIdAsync(record.EmployeeId);
        if (employee != null)
        {
            await SyncEmployeeStatusWithAttendanceAsync(employee, dto.Status, date);
        }

        var result = new AttendanceRecordDto
        {
            Id = record.AttendanceRecordId,
            EmployeeId = record.EmployeeId,
            EmployeeName = record.Employee.FirstName + " " + record.Employee.LastName,
            Date = record.Date,
            CheckInTime = record.CheckInTime.ToString(@"hh\:mm"),
            CheckOutTime = record.CheckOutTime?.ToString(@"hh\:mm"),
            TotalHours = record.TotalHours?.TotalHours ?? 0,
            Status = record.Status,
            Remarks = record.Remarks
        };

        return (result, null, false);
    }

    public async Task<(bool Success, string? ErrorMessage, bool NotFound)> DeleteRecordAsync(int id)
    {
        var record = await _attendanceRecordRepository.FindByIdAsync(id);
        if (record == null)
        {
            return (false, null, true);
        }

        _attendanceRecordRepository.Remove(record);
        await _attendanceRecordRepository.SaveChangesAsync();

        return (true, null, false);
    }

    private static AttendanceRecordDto MapRecord(AttendanceRecord r)
    {
        return new AttendanceRecordDto
        {
            Id = r.AttendanceRecordId,
            EmployeeId = r.EmployeeId,
            EmployeeName = r.Employee.FirstName + " " + r.Employee.LastName,
            Date = r.Date,
            CheckInTime = r.CheckInTime.ToString(@"hh\:mm"),
            CheckOutTime = r.CheckOutTime.HasValue ? r.CheckOutTime.Value.ToString(@"hh\:mm") : null,
            TotalHours = r.TotalHours.HasValue ? r.TotalHours.Value.TotalHours : 0,
            Status = r.Status,
            Remarks = r.Remarks
        };
    }

    private async Task SyncEmployeeStatusWithAttendanceAsync(Employee employee, string attendanceStatus, DateTime attendanceDate)
    {
        var today = DateTime.UtcNow.Date;
        
        // Only sync if the attendance record is for today
        if (attendanceDate.Date != today)
        {
            return;
        }

        // Map attendance status to employee status
        string? newEmployeeStatus = attendanceStatus switch
        {
            "Present" => "Active",
            "Absent" => "Absent",
            "Late" => "Late",
            "HalfDay" => "HalfDay",
            _ => null
        };

        if (newEmployeeStatus == null)
        {
            return;
        }

        // Only update if the status actually changes
        if (employee.EmploymentStatus != newEmployeeStatus && 
            (employee.EmploymentStatus == "Active" || 
             employee.EmploymentStatus == "Absent" || 
             employee.EmploymentStatus == "Late" || 
             employee.EmploymentStatus == "HalfDay"))
        {
            var oldStatus = employee.EmploymentStatus;
            employee.EmploymentStatus = newEmployeeStatus;
            employee.UpdatedAt = DateTime.UtcNow;
            await _employeeRepository.SaveChangesAsync();
            
            _logger.LogInformation(
                "Employee {EmployeeId} status changed from {OldStatus} to {NewStatus} based on attendance",
                employee.EmployeeId, oldStatus, newEmployeeStatus);
        }
    }
}
