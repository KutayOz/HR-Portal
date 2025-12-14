using Microsoft.AspNetCore.Mvc;
using Application.DTOs;
using Application.Services;
using Application.Infrastructure;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EmployeesController : ControllerBase
    {
        private readonly IEmployeeService _employeeService;

        public EmployeesController(IEmployeeService employeeService)
        {
            _employeeService = employeeService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<EmployeeDto>>> GetEmployees([FromQuery] string? scope = null)
        {
            var parsedScope = OwnershipScopeParser.Parse(scope);
            var employees = await _employeeService.GetEmployeesAsync(parsedScope);
            return Ok(employees);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<EmployeeDto>> GetEmployee(string id)
        {
            var employee = await _employeeService.GetEmployeeAsync(id);

            if (employee == null)
            {
                return NotFound();
            }

            return Ok(employee);
        }

        [HttpGet("{id}/subordinates")]
        public async Task<ActionResult<IEnumerable<EmployeeDto>>> GetSubordinates(string id)
        {
            var subordinates = await _employeeService.GetSubordinatesAsync(id);
            return Ok(subordinates);
        }

        [HttpPost]
        public async Task<ActionResult<EmployeeDto>> CreateEmployee([FromBody] CreateEmployeeDto dto)
        {
            var (result, error) = await _employeeService.CreateEmployeeAsync(dto);

            if (result == null)
            {
                return BadRequest(new { message = error ?? "Invalid request" });
            }

            return CreatedAtAction(nameof(GetEmployee), new { id = result.Id }, result);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<EmployeeDto>> UpdateEmployee(string id, [FromBody] UpdateEmployeeDto dto)
        {
            var (result, error, notFound) = await _employeeService.UpdateEmployeeAsync(id, dto);

            if (notFound)
            {
                return NotFound(new { message = "Employee not found" });
            }

            if (result == null)
            {
                return BadRequest(new { message = error ?? "Invalid request" });
            }

            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteEmployee(string id)
        {
            var (success, error, notFound) = await _employeeService.TerminateEmployeeAsync(id);

            if (notFound)
            {
                return NotFound(new { message = "Employee not found" });
            }

            if (!success)
            {
                return BadRequest(new { message = error ?? "Unable to terminate employee" });
            }

            return Ok(new { message = "Employee terminated successfully" });
        }
    }
}
