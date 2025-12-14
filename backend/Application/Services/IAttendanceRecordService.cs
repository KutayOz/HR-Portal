using Application.DTOs;

namespace Application.Services;

public interface IAttendanceRecordService
{
    Task<List<AttendanceRecordDto>> GetRecordsByEmployeeAsync(int employeeId);
    Task<(AttendanceRecordDto? Result, string? ErrorMessage)> CreateRecordAsync(CreateAttendanceRecordDto dto);
    Task<(AttendanceRecordDto? Result, string? ErrorMessage, bool NotFound)> UpdateRecordAsync(int id, UpdateAttendanceRecordDto dto);
    Task<(bool Success, string? ErrorMessage, bool NotFound)> DeleteRecordAsync(int id);
}
