using Microsoft.AspNetCore.Mvc;
using Application.DTOs;
using Application.Services;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AttendanceRecordsController : ControllerBase
    {
        private readonly IAttendanceRecordService _attendanceRecordService;

        public AttendanceRecordsController(IAttendanceRecordService attendanceRecordService)
        {
            _attendanceRecordService = attendanceRecordService;
        }

        [HttpGet("employee/{employeeId}")]
        public async Task<ActionResult<IEnumerable<AttendanceRecordDto>>> GetRecordsByEmployee(int employeeId)
        {
            var records = await _attendanceRecordService.GetRecordsByEmployeeAsync(employeeId);
            return Ok(records);
        }

        [HttpPost]
        public async Task<ActionResult<AttendanceRecordDto>> CreateRecord([FromBody] CreateAttendanceRecordDto dto)
        {
            var (result, error) = await _attendanceRecordService.CreateRecordAsync(dto);

            if (result == null)
            {
                return BadRequest(new { message = error ?? "Invalid request" });
            }

            return CreatedAtAction(nameof(GetRecordsByEmployee), new { employeeId = result.EmployeeId }, result);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<AttendanceRecordDto>> UpdateRecord(int id, [FromBody] UpdateAttendanceRecordDto dto)
        {
            var (result, error, notFound) = await _attendanceRecordService.UpdateRecordAsync(id, dto);

            if (notFound)
            {
                return NotFound(new { message = "Attendance record not found" });
            }

            if (result == null)
            {
                return BadRequest(new { message = error ?? "Invalid request" });
            }

            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteRecord(int id)
        {
            var (success, error, notFound) = await _attendanceRecordService.DeleteRecordAsync(id);

            if (notFound)
            {
                return NotFound(new { message = "Attendance record not found" });
            }

            if (!success)
            {
                return BadRequest(new { message = error ?? "Unable to delete attendance record" });
            }

            return Ok(new { message = "Attendance record deleted successfully" });
        }
    }
}
