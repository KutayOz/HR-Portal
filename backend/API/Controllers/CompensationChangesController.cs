using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Data.Context;
using API.DTOs;
using Common.Entity;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CompensationChangesController : ControllerBase
    {
        private readonly HRPortalDbContext _context;
        private readonly ILogger<CompensationChangesController> _logger;

        public CompensationChangesController(HRPortalDbContext context, ILogger<CompensationChangesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet("employee/{employeeId}")]
        public async Task<ActionResult<IEnumerable<CompensationChangeDto>>> GetChangesByEmployee(int employeeId)
        {
            try
            {
                var changes = await _context.CompensationChanges
                    .Include(c => c.Employee)
                    .Where(c => c.EmployeeId == employeeId)
                    .OrderByDescending(c => c.EffectiveDate)
                    .Select(c => new CompensationChangeDto
                    {
                        Id = c.CompensationChangeId,
                        EmployeeId = c.EmployeeId,
                        EmployeeName = c.Employee.FirstName + " " + c.Employee.LastName,
                        OldSalary = c.OldSalary,
                        NewSalary = c.NewSalary,
                        ChangeAmount = c.ChangeAmount,
                        ChangePercentage = c.ChangePercentage,
                        ChangeReason = c.ChangeReason,
                        EffectiveDate = c.EffectiveDate,
                        ApprovedBy = c.ApprovedBy,
                        ApprovedDate = c.ApprovedDate,
                        Comments = c.Comments
                    })
                    .ToListAsync();

                return Ok(changes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching compensation changes");
                return StatusCode(500, new { message = "Error fetching compensation changes", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<CompensationChangeDto>> CreateChange([FromBody] CreateCompensationChangeDto dto)
        {
            try
            {
                var employee = await _context.Employees.FindAsync(dto.EmployeeId);
                if (employee == null)
                    return BadRequest(new { message = "Employee not found" });

                var changeAmount = dto.NewSalary - dto.OldSalary;
                var changePercentage = dto.OldSalary > 0 ? (changeAmount / dto.OldSalary) * 100 : 0;

                var change = new CompensationChange
                {
                    EmployeeId = dto.EmployeeId,
                    OldSalary = dto.OldSalary,
                    NewSalary = dto.NewSalary,
                    ChangeAmount = changeAmount,
                    ChangePercentage = changePercentage,
                    ChangeReason = dto.ChangeReason,
                    EffectiveDate = dto.EffectiveDate,
                    ApprovedBy = dto.ApprovedBy,
                    ApprovedDate = dto.ApprovedBy.HasValue ? DateTime.UtcNow : null,
                    Comments = dto.Comments,
                    CreatedAt = DateTime.UtcNow
                };

                _context.CompensationChanges.Add(change);
                await _context.SaveChangesAsync();

                var result = new CompensationChangeDto
                {
                    Id = change.CompensationChangeId,
                    EmployeeId = change.EmployeeId,
                    EmployeeName = employee.FirstName + " " + employee.LastName,
                    OldSalary = change.OldSalary,
                    NewSalary = change.NewSalary,
                    ChangeAmount = change.ChangeAmount,
                    ChangePercentage = change.ChangePercentage,
                    ChangeReason = change.ChangeReason,
                    EffectiveDate = change.EffectiveDate,
                    ApprovedBy = change.ApprovedBy,
                    ApprovedDate = change.ApprovedDate,
                    Comments = change.Comments
                };

                return CreatedAtAction(nameof(GetChangesByEmployee), new { employeeId = result.EmployeeId }, result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating compensation change");
                return StatusCode(500, new { message = "Error creating compensation change", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<CompensationChangeDto>> UpdateChange(int id, [FromBody] UpdateCompensationChangeDto dto)
        {
            try
            {
                var change = await _context.CompensationChanges
                    .Include(c => c.Employee)
                    .FirstOrDefaultAsync(c => c.CompensationChangeId == id);

                if (change == null)
                    return NotFound(new { message = "Compensation change not found" });

                var changeAmount = dto.NewSalary - dto.OldSalary;
                var changePercentage = dto.OldSalary > 0 ? (changeAmount / dto.OldSalary) * 100 : 0;

                change.OldSalary = dto.OldSalary;
                change.NewSalary = dto.NewSalary;
                change.ChangeAmount = changeAmount;
                change.ChangePercentage = changePercentage;
                change.ChangeReason = dto.ChangeReason;
                change.EffectiveDate = dto.EffectiveDate;
                change.ApprovedBy = dto.ApprovedBy;
                if (dto.ApprovedBy.HasValue && !change.ApprovedDate.HasValue)
                {
                    change.ApprovedDate = DateTime.UtcNow;
                }
                change.Comments = dto.Comments;

                await _context.SaveChangesAsync();

                var result = new CompensationChangeDto
                {
                    Id = change.CompensationChangeId,
                    EmployeeId = change.EmployeeId,
                    EmployeeName = change.Employee.FirstName + " " + change.Employee.LastName,
                    OldSalary = change.OldSalary,
                    NewSalary = change.NewSalary,
                    ChangeAmount = change.ChangeAmount,
                    ChangePercentage = change.ChangePercentage,
                    ChangeReason = change.ChangeReason,
                    EffectiveDate = change.EffectiveDate,
                    ApprovedBy = change.ApprovedBy,
                    ApprovedDate = change.ApprovedDate,
                    Comments = change.Comments
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating compensation change");
                return StatusCode(500, new { message = "Error updating compensation change", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteChange(int id)
        {
            try
            {
                var change = await _context.CompensationChanges.FindAsync(id);
                if (change == null)
                    return NotFound(new { message = "Compensation change not found" });

                _context.CompensationChanges.Remove(change);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Compensation change deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting compensation change");
                return StatusCode(500, new { message = "Error deleting compensation change", error = ex.Message });
            }
        }
    }
}
