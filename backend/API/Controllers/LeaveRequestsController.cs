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
    public class LeaveRequestsController : ControllerBase
    {
        private readonly HRPortalDbContext _context;
        private readonly ILogger<LeaveRequestsController> _logger;

        public LeaveRequestsController(HRPortalDbContext context, ILogger<LeaveRequestsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<LeaveRequestDto>>> GetLeaveRequests()
        {
            try
            {
                var leaveRequests = await _context.LeaveRequests
                    .Include(lr => lr.Employee)
                    .Select(lr => new LeaveRequestDto
                    {
                        Id = "L-" + lr.LeaveRequestId.ToString(),
                        EmployeeId = "E-" + lr.EmployeeId.ToString(),
                        EmployeeName = lr.Employee.FirstName + " " + lr.Employee.LastName,
                        Type = lr.LeaveType,
                        StartDate = lr.StartDate.ToString("yyyy-MM-dd"),
                        EndDate = lr.EndDate.ToString("yyyy-MM-dd"),
                        Status = lr.Status
                    })
                    .ToListAsync();

                return Ok(leaveRequests);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching leave requests");
                return StatusCode(500, new { message = "Error fetching leave requests", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<LeaveRequestDto>> GetLeaveRequest(string id)
        {
            try
            {
                var leaveRequestId = int.Parse(id.Replace("L-", ""));
                
                var leaveRequest = await _context.LeaveRequests
                    .Include(lr => lr.Employee)
                    .Where(lr => lr.LeaveRequestId == leaveRequestId)
                    .Select(lr => new LeaveRequestDto
                    {
                        Id = "L-" + lr.LeaveRequestId.ToString(),
                        EmployeeId = "E-" + lr.EmployeeId.ToString(),
                        EmployeeName = lr.Employee.FirstName + " " + lr.Employee.LastName,
                        Type = lr.LeaveType,
                        StartDate = lr.StartDate.ToString("yyyy-MM-dd"),
                        EndDate = lr.EndDate.ToString("yyyy-MM-dd"),
                        Status = lr.Status
                    })
                    .FirstOrDefaultAsync();

                if (leaveRequest == null)
                    return NotFound();

                return Ok(leaveRequest);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching leave request");
                return StatusCode(500, new { message = "Error fetching leave request", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<LeaveRequestDto>> CreateLeaveRequest([FromBody] CreateLeaveRequestDto dto)
        {
            try
            {
                // Basic validation for employee
                if (dto.EmployeeId <= 0)
                {
                    return BadRequest(new { message = "EmployeeId must be a positive number" });
                }

                var employee = await _context.Employees.FindAsync(dto.EmployeeId);
                if (employee == null)
                {
                    return BadRequest(new { message = "Employee not found" });
                }

                // Parse dates (support html date + dot format) and mark as UTC for PostgreSQL
                var allowedFormats = new[] { "yyyy-MM-dd", "dd.MM.yyyy" };

                if (!DateTime.TryParseExact(dto.StartDate, allowedFormats, CultureInfo.InvariantCulture,
                    DateTimeStyles.None, out var startParsed))
                {
                    return BadRequest(new { message = "Invalid startDate format. Use 'yyyy-MM-dd' (e.g. 2025-11-01)." });
                }

                if (!DateTime.TryParseExact(dto.EndDate, allowedFormats, CultureInfo.InvariantCulture,
                    DateTimeStyles.None, out var endParsed))
                {
                    return BadRequest(new { message = "Invalid endDate format. Use 'yyyy-MM-dd' (e.g. 2025-11-10)." });
                }

                var startDate = DateTime.SpecifyKind(startParsed.Date, DateTimeKind.Utc);
                var endDate = DateTime.SpecifyKind(endParsed.Date, DateTimeKind.Utc);

                if (endDate < startDate)
                {
                    return BadRequest(new { message = "End date cannot be before start date" });
                }

                var numberOfDays = (int)(endDate - startDate).TotalDays + 1;

                var leaveRequest = new LeaveRequest
                {
                    EmployeeId = dto.EmployeeId,
                    LeaveType = dto.LeaveType,
                    StartDate = startDate,
                    EndDate = endDate,
                    NumberOfDays = numberOfDays,
                    Reason = dto.Reason ?? string.Empty,
                    Status = "Pending",
                    ApprovedBy = null,
                    ApprovedDate = null,
                    ApproverComments = string.Empty,
                    CreatedAt = DateTime.UtcNow
                };

                _context.LeaveRequests.Add(leaveRequest);
                await _context.SaveChangesAsync();

                var result = await _context.LeaveRequests
                    .Include(lr => lr.Employee)
                    .Where(lr => lr.LeaveRequestId == leaveRequest.LeaveRequestId)
                    .Select(lr => new LeaveRequestDto
                    {
                        Id = "L-" + lr.LeaveRequestId.ToString(),
                        EmployeeId = "E-" + lr.EmployeeId.ToString(),
                        EmployeeName = lr.Employee.FirstName + " " + lr.Employee.LastName,
                        Type = lr.LeaveType,
                        StartDate = lr.StartDate.ToString("yyyy-MM-dd"),
                        EndDate = lr.EndDate.ToString("yyyy-MM-dd"),
                        Status = lr.Status
                    })
                    .FirstOrDefaultAsync();

                return CreatedAtAction(nameof(GetLeaveRequest), new { id = result.Id }, result);
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Database error creating leave request");
                return StatusCode(500, new
                {
                    message = "Database error creating leave request",
                    error = ex.InnerException?.Message ?? ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating leave request");
                return StatusCode(500, new { message = "Error creating leave request", error = ex.Message });
            }
        }

        [HttpPut("{id}/status")]
        public async Task<ActionResult<LeaveRequestDto>> UpdateLeaveStatus(string id, [FromBody] UpdateLeaveStatusDto dto)
        {
            try
            {
                var leaveRequestId = int.Parse(id.Replace("L-", ""));
                var leaveRequest = await _context.LeaveRequests.FindAsync(leaveRequestId);

                if (leaveRequest == null)
                    return NotFound(new { message = "Leave request not found" });

                leaveRequest.Status = dto.Status;
                leaveRequest.ApproverComments = dto.ApproverComments;
                leaveRequest.ApprovedDate = DateTime.UtcNow;
                leaveRequest.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                var result = await _context.LeaveRequests
                    .Include(lr => lr.Employee)
                    .Where(lr => lr.LeaveRequestId == leaveRequestId)
                    .Select(lr => new LeaveRequestDto
                    {
                        Id = "L-" + lr.LeaveRequestId.ToString(),
                        EmployeeId = "E-" + lr.EmployeeId.ToString(),
                        EmployeeName = lr.Employee.FirstName + " " + lr.Employee.LastName,
                        Type = lr.LeaveType,
                        StartDate = lr.StartDate.ToString("yyyy-MM-dd"),
                        EndDate = lr.EndDate.ToString("yyyy-MM-dd"),
                        Status = lr.Status
                    })
                    .FirstOrDefaultAsync();

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating leave status");
                return StatusCode(500, new { message = "Error updating leave status", error = ex.Message });
            }
        }
    }
}
