using Microsoft.AspNetCore.Mvc;
using Application.DTOs;
using Application.Services;
using Application.Infrastructure;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DepartmentsController : ControllerBase
    {
        private readonly IDepartmentService _departmentService;
        private readonly ILogger<DepartmentsController> _logger;

        public DepartmentsController(IDepartmentService departmentService, ILogger<DepartmentsController> logger)
        {
            _departmentService = departmentService;
            _logger = logger;
        }

        // Debug endpoint to test DTO binding
        [HttpPost("test")]
        [ApiExplorerSettings(IgnoreApi = true)]
        public ActionResult<object> TestDepartmentDto([FromBody] CreateDepartmentDto dto)
        {
            _logger.LogInformation("TestDepartmentDto called");
            
            if (dto == null)
            {
                return BadRequest(new { message = "DTO is null - check JSON format", received = "null" });
            }

            return Ok(new 
            { 
                message = "DTO received successfully",
                data = new
                {
                    departmentName = dto.DepartmentName,
                    description = dto.Description,
                    jobCount = dto.Jobs?.Count ?? 0,
                    jobs = dto.Jobs?.Select(j => new { j.JobTitle, j.MinSalary, j.MaxSalary }).ToList()
                }
            });
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<DepartmentDto>>> GetDepartments([FromQuery] string? scope = null)
        {
            var parsedScope = OwnershipScopeParser.Parse(scope);
            var result = await _departmentService.GetDepartmentsAsync(parsedScope);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<DepartmentDto>> GetDepartment(string id)
        {
            var result = await _departmentService.GetDepartmentAsync(id);
            if (result == null)
            {
                return NotFound();
            }

            return Ok(result);
        }

        [HttpPost]
        public async Task<ActionResult<DepartmentDto>> CreateDepartment([FromBody] CreateDepartmentDto dto)
        {
            var (result, error) = await _departmentService.CreateDepartmentAsync(dto);

            if (result == null)
            {
                return BadRequest(new { message = error ?? "Invalid request" });
            }

            return StatusCode(201, result);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<DepartmentDto>> UpdateDepartment(string id, [FromBody] UpdateDepartmentDto dto)
        {
            var (result, error, notFound) = await _departmentService.UpdateDepartmentAsync(id, dto);

            if (notFound)
            {
                return NotFound(new { message = "Department not found" });
            }

            if (result == null)
            {
                return BadRequest(new { message = error ?? "Invalid request" });
            }

            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteDepartment(string id)
        {
            var (success, error, notFound) = await _departmentService.DeleteDepartmentAsync(id);

            if (notFound)
            {
                return NotFound(new { message = "Department not found" });
            }

            if (!success)
            {
                return BadRequest(new { message = error ?? "Unable to delete department" });
            }

            return Ok(new { message = "Department deleted successfully" });
        }
    }
}
