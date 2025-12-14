using Microsoft.AspNetCore.Mvc;
using Application.DTOs;
using Application.Services;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CompensationChangesController : ControllerBase
    {
        private readonly ICompensationChangeService _compensationChangeService;

        public CompensationChangesController(ICompensationChangeService compensationChangeService)
        {
            _compensationChangeService = compensationChangeService;
        }

        [HttpGet("employee/{employeeId}")]
        public async Task<ActionResult<IEnumerable<CompensationChangeDto>>> GetChangesByEmployee(int employeeId)
        {
            var changes = await _compensationChangeService.GetChangesByEmployeeAsync(employeeId);
            return Ok(changes);
        }

        [HttpPost]
        public async Task<ActionResult<CompensationChangeDto>> CreateChange([FromBody] CreateCompensationChangeDto dto)
        {
            var (result, error) = await _compensationChangeService.CreateChangeAsync(dto);

            if (result == null)
            {
                return BadRequest(new { message = error ?? "Invalid request" });
            }

            return CreatedAtAction(nameof(GetChangesByEmployee), new { employeeId = result.EmployeeId }, result);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<CompensationChangeDto>> UpdateChange(int id, [FromBody] UpdateCompensationChangeDto dto)
        {
            var (result, error, notFound) = await _compensationChangeService.UpdateChangeAsync(id, dto);

            if (notFound)
            {
                return NotFound(new { message = "Compensation change not found" });
            }

            if (result == null)
            {
                return BadRequest(new { message = error ?? "Invalid request" });
            }

            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteChange(int id)
        {
            var (success, error, notFound) = await _compensationChangeService.DeleteChangeAsync(id);

            if (notFound)
            {
                return NotFound(new { message = "Compensation change not found" });
            }

            if (!success)
            {
                return BadRequest(new { message = error ?? "Unable to delete compensation change" });
            }

            return Ok(new { message = "Compensation change deleted successfully" });
        }
    }
}
