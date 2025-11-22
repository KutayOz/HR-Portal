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
    public class EmployeesController : ControllerBase
    {
        private readonly HRPortalDbContext _context;
        private readonly ILogger<EmployeesController> _logger;

        public EmployeesController(HRPortalDbContext context, ILogger<EmployeesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<EmployeeDto>>> GetEmployees()
        {
            try
            {
                var employees = await _context.Employees
                    .Include(e => e.Department)
                    .Include(e => e.Job)
                    .Where(e => e.EmploymentStatus != "Terminated")
                    .Select(e => new EmployeeDto
                    {
                        Id = "E-" + e.EmployeeId.ToString(),
                        FirstName = e.FirstName,
                        LastName = e.LastName,
                        Email = e.Email,
                        PhoneNumber = e.PhoneNumber,
                        DepartmentId = "D-" + e.DepartmentId.ToString("D2"),
                        DepartmentName = e.Department.DepartmentName,
                        JobTitle = e.Job.JobTitle,
                        ManagerId = e.ManagerId.HasValue ? "E-" + e.ManagerId.Value.ToString() : null,
                        Status = e.EmploymentStatus,
                        CurrentSalary = e.CurrentSalary,
                        HireDate = e.HireDate.ToString("yyyy-MM-dd"),
                        TerminationDate = e.TerminationDate.HasValue ? e.TerminationDate.Value.ToString("yyyy-MM-dd") : null,
                        AvatarUrl = "https://picsum.photos/200/200?random=" + e.EmployeeId,
                        Skills = new List<string>()
                    })
                    .ToListAsync();

                return Ok(employees);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching employees");
                return StatusCode(500, new { message = "Error fetching employees", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<EmployeeDto>> GetEmployee(string id)
        {
            try
            {
                var employeeId = int.Parse(id.Replace("E-", ""));
                
                var employee = await _context.Employees
                    .Include(e => e.Department)
                    .Include(e => e.Job)
                    .Where(e => e.EmployeeId == employeeId)
                    .Select(e => new EmployeeDto
                    {
                        Id = "E-" + e.EmployeeId.ToString(),
                        FirstName = e.FirstName,
                        LastName = e.LastName,
                        Email = e.Email,
                        PhoneNumber = e.PhoneNumber,
                        DepartmentId = "D-" + e.DepartmentId.ToString("D2"),
                        DepartmentName = e.Department.DepartmentName,
                        JobTitle = e.Job.JobTitle,
                        ManagerId = e.ManagerId.HasValue ? "E-" + e.ManagerId.Value.ToString() : null,
                        Status = e.EmploymentStatus,
                        CurrentSalary = e.CurrentSalary,
                        HireDate = e.HireDate.ToString("yyyy-MM-dd"),
                        TerminationDate = e.TerminationDate.HasValue ? e.TerminationDate.Value.ToString("yyyy-MM-dd") : null,
                        AvatarUrl = "https://picsum.photos/200/200?random=" + e.EmployeeId,
                        Skills = new List<string>()
                    })
                    .FirstOrDefaultAsync();

                if (employee == null)
                    return NotFound();

                return Ok(employee);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching employee");
                return StatusCode(500, new { message = "Error fetching employee", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<EmployeeDto>> CreateEmployee([FromBody] CreateEmployeeDto dto)
        {
            try
            {
                // Check if email already exists
                if (await _context.Employees.AnyAsync(e => e.Email == dto.Email))
                {
                    return BadRequest(new { message = "Email already exists" });
                }

                // Basic validation for required numeric ids
                if (dto.DepartmentId <= 0)
                {
                    return BadRequest(new { message = "DepartmentId must be a positive number" });
                }

                if (dto.JobId <= 0)
                {
                    return BadRequest(new { message = "JobId must be a positive number" });
                }

                // Normalize managerId: treat 0 or negative as null
                if (dto.ManagerId.HasValue && dto.ManagerId.Value <= 0)
                {
                    dto.ManagerId = null;
                }

                // Parse dates with clear error messages (support multiple formats)
                var allowedFormats = new[] { "yyyy-MM-dd", "dd.MM.yyyy" };

                if (!DateTime.TryParseExact(dto.DateOfBirth, allowedFormats, CultureInfo.InvariantCulture,
                    DateTimeStyles.None, out var dateOfBirthParsed))
                {
                    return BadRequest(new { message = "Invalid dateOfBirth format. Use 'yyyy-MM-dd' (e.g. 2002-02-12)." });
                }

                if (!DateTime.TryParseExact(dto.HireDate, allowedFormats, CultureInfo.InvariantCulture,
                    DateTimeStyles.None, out var hireDateParsed))
                {
                    return BadRequest(new { message = "Invalid hireDate format. Use 'yyyy-MM-dd' (e.g. 2025-11-21)." });
                }

                // Mark as UTC so Npgsql can write to timestamp with time zone columns
                var dateOfBirth = DateTime.SpecifyKind(dateOfBirthParsed.Date, DateTimeKind.Utc);
                var hireDate = DateTime.SpecifyKind(hireDateParsed.Date, DateTimeKind.Utc);

                // Ensure referenced Department and Job exist to avoid FK errors
                var department = await _context.Departments.FindAsync(dto.DepartmentId);
                if (department == null)
                {
                    return BadRequest(new { message = "Department not found" });
                }

                var job = await _context.Jobs
                    .FirstOrDefaultAsync(j => j.JobId == dto.JobId && j.DepartmentId == dto.DepartmentId);
                if (job == null)
                {
                    return BadRequest(new { message = "Job not found for the selected department" });
                }

                var employee = new Employee
                {
                    FirstName = dto.FirstName,
                    LastName = dto.LastName,
                    Email = dto.Email,
                    PhoneNumber = dto.PhoneNumber,
                    DateOfBirth = dateOfBirth,
                    HireDate = hireDate,
                    DepartmentId = dto.DepartmentId,
                    JobId = dto.JobId,
                    ManagerId = dto.ManagerId,
                    CurrentSalary = dto.CurrentSalary,
                    EmploymentStatus = dto.EmploymentStatus,
                    Address = dto.Address ?? string.Empty,
                    City = dto.City ?? string.Empty,
                    State = dto.State ?? string.Empty,
                    PostalCode = dto.PostalCode ?? string.Empty,
                    Country = dto.Country ?? string.Empty,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Employees.Add(employee);
                await _context.SaveChangesAsync();

                var result = await _context.Employees
                    .Include(e => e.Department)
                    .Include(e => e.Job)
                    .Where(e => e.EmployeeId == employee.EmployeeId)
                    .Select(e => new EmployeeDto
                    {
                        Id = "E-" + e.EmployeeId.ToString(),
                        FirstName = e.FirstName,
                        LastName = e.LastName,
                        Email = e.Email,
                        PhoneNumber = e.PhoneNumber,
                        DepartmentId = "D-" + e.DepartmentId.ToString("D2"),
                        DepartmentName = e.Department.DepartmentName,
                        JobTitle = e.Job.JobTitle,
                        ManagerId = e.ManagerId.HasValue ? "E-" + e.ManagerId.Value.ToString() : null,
                        Status = e.EmploymentStatus,
                        CurrentSalary = e.CurrentSalary,
                        HireDate = e.HireDate.ToString("yyyy-MM-dd"),
                        TerminationDate = null,
                        AvatarUrl = "https://picsum.photos/200/200?random=" + e.EmployeeId,
                        Skills = new List<string>()
                    })
                    .FirstOrDefaultAsync();

                return CreatedAtAction(nameof(GetEmployee), new { id = result.Id }, result);
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Database error creating employee");
                return StatusCode(500, new
                {
                    message = "Database error creating employee",
                    error = ex.InnerException?.Message ?? ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating employee");
                return StatusCode(500, new { message = "Error creating employee", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<EmployeeDto>> UpdateEmployee(string id, [FromBody] UpdateEmployeeDto dto)
        {
            try
            {
                var employeeId = int.Parse(id.Replace("E-", ""));
                var employee = await _context.Employees.FindAsync(employeeId);

                if (employee == null)
                    return NotFound(new { message = "Employee not found" });

                // Check if email exists for another employee
                if (await _context.Employees.AnyAsync(e => e.Email == dto.Email && e.EmployeeId != employeeId))
                {
                    return BadRequest(new { message = "Email already exists" });
                }

                employee.FirstName = dto.FirstName;
                employee.LastName = dto.LastName;
                employee.Email = dto.Email;
                employee.PhoneNumber = dto.PhoneNumber;
                employee.DepartmentId = dto.DepartmentId;
                employee.JobId = dto.JobId;
                employee.ManagerId = dto.ManagerId;
                employee.CurrentSalary = dto.CurrentSalary;
                employee.EmploymentStatus = dto.EmploymentStatus;
                employee.Address = dto.Address;
                employee.City = dto.City;
                employee.State = dto.State;
                employee.PostalCode = dto.PostalCode;
                employee.Country = dto.Country;
                employee.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                var result = await _context.Employees
                    .Include(e => e.Department)
                    .Include(e => e.Job)
                    .Where(e => e.EmployeeId == employeeId)
                    .Select(e => new EmployeeDto
                    {
                        Id = "E-" + e.EmployeeId.ToString(),
                        FirstName = e.FirstName,
                        LastName = e.LastName,
                        Email = e.Email,
                        PhoneNumber = e.PhoneNumber,
                        DepartmentId = "D-" + e.DepartmentId.ToString("D2"),
                        DepartmentName = e.Department.DepartmentName,
                        JobTitle = e.Job.JobTitle,
                        ManagerId = e.ManagerId.HasValue ? "E-" + e.ManagerId.Value.ToString() : null,
                        Status = e.EmploymentStatus,
                        CurrentSalary = e.CurrentSalary,
                        HireDate = e.HireDate.ToString("yyyy-MM-dd"),
                        TerminationDate = e.TerminationDate.HasValue ? e.TerminationDate.Value.ToString("yyyy-MM-dd") : null,
                        AvatarUrl = "https://picsum.photos/200/200?random=" + e.EmployeeId,
                        Skills = new List<string>()
                    })
                    .FirstOrDefaultAsync();

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating employee");
                return StatusCode(500, new { message = "Error updating employee", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteEmployee(string id)
        {
            try
            {
                var employeeId = int.Parse(id.Replace("E-", ""));
                var employee = await _context.Employees.FindAsync(employeeId);

                if (employee == null)
                    return NotFound(new { message = "Employee not found" });

                // Soft delete - mark as terminated
                employee.EmploymentStatus = "Terminated";
                employee.TerminationDate = DateTime.UtcNow;
                employee.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Employee terminated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting employee");
                return StatusCode(500, new { message = "Error deleting employee", error = ex.Message });
            }
        }
    }
}
