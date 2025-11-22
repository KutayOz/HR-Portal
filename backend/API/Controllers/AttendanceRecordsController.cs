using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Data.Context;
using API.DTOs;
using Common.Entity;
using System.Globalization;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AttendanceRecordsController : ControllerBase
    {
        private readonly HRPortalDbContext _context;
        private readonly ILogger<AttendanceRecordsController> _logger;

        public AttendanceRecordsController(HRPortalDbContext context, ILogger<AttendanceRecordsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet("employee/{employeeId}")]
        public async Task<ActionResult<IEnumerable<AttendanceRecordDto>>> GetRecordsByEmployee(int employeeId)
        {
            try
            {
                var records = await _context.AttendanceRecords
                    .Include(r => r.Employee)
                    .Where(r => r.EmployeeId == employeeId)
                    .OrderByDescending(r => r.Date)
                    .Select(r => new AttendanceRecordDto
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
                    })
                    .ToListAsync();

                return Ok(records);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching attendance records");
                return StatusCode(500, new { message = "Error fetching attendance records", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<AttendanceRecordDto>> CreateRecord([FromBody] CreateAttendanceRecordDto dto)
        {
            try
            {
                var employee = await _context.Employees.FindAsync(dto.EmployeeId);
                if (employee == null)
                    return BadRequest(new { message = "Employee not found" });

                if (!TimeSpan.TryParse(dto.CheckInTime, out var checkIn))
                    return BadRequest(new { message = "Invalid CheckInTime format (HH:mm)" });

                TimeSpan? checkOut = null;
                if (!string.IsNullOrEmpty(dto.CheckOutTime))
                {
                    if (TimeSpan.TryParse(dto.CheckOutTime, out var co))
                        checkOut = co;
                    else
                        return BadRequest(new { message = "Invalid CheckOutTime format (HH:mm)" });
                }

                TimeSpan? totalHours = null;
                if (checkOut.HasValue)
                {
                    totalHours = checkOut.Value - checkIn;
                }

                var record = new AttendanceRecord
                {
                    EmployeeId = dto.EmployeeId,
                    Date = dto.Date,
                    CheckInTime = checkIn,
                    CheckOutTime = checkOut,
                    TotalHours = totalHours,
                    Status = dto.Status,
                    Remarks = dto.Remarks,
                    CreatedAt = DateTime.UtcNow
                };

                _context.AttendanceRecords.Add(record);
                await _context.SaveChangesAsync();

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

                return CreatedAtAction(nameof(GetRecordsByEmployee), new { employeeId = result.EmployeeId }, result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating attendance record");
                return StatusCode(500, new { message = "Error creating attendance record", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<AttendanceRecordDto>> UpdateRecord(int id, [FromBody] UpdateAttendanceRecordDto dto)
        {
            try
            {
                var record = await _context.AttendanceRecords
                    .Include(r => r.Employee)
                    .FirstOrDefaultAsync(r => r.AttendanceRecordId == id);

                if (record == null)
                    return NotFound(new { message = "Attendance record not found" });

                if (!TimeSpan.TryParse(dto.CheckInTime, out var checkIn))
                    return BadRequest(new { message = "Invalid CheckInTime format (HH:mm)" });

                TimeSpan? checkOut = null;
                if (!string.IsNullOrEmpty(dto.CheckOutTime))
                {
                    if (TimeSpan.TryParse(dto.CheckOutTime, out var co))
                        checkOut = co;
                    else
                        return BadRequest(new { message = "Invalid CheckOutTime format (HH:mm)" });
                }

                TimeSpan? totalHours = null;
                if (checkOut.HasValue)
                {
                    totalHours = checkOut.Value - checkIn;
                }

                record.Date = dto.Date;
                record.CheckInTime = checkIn;
                record.CheckOutTime = checkOut;
                record.TotalHours = totalHours;
                record.Status = dto.Status;
                record.Remarks = dto.Remarks;
                record.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

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

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating attendance record");
                return StatusCode(500, new { message = "Error updating attendance record", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteRecord(int id)
        {
            try
            {
                var record = await _context.AttendanceRecords.FindAsync(id);
                if (record == null)
                    return NotFound(new { message = "Attendance record not found" });

                _context.AttendanceRecords.Remove(record);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Attendance record deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting attendance record");
                return StatusCode(500, new { message = "Error deleting attendance record", error = ex.Message });
            }
        }
    }
}
