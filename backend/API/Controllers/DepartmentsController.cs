using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Data.Context;
using API.DTOs;
using Common.Entity;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DepartmentsController : ControllerBase
    {
        private readonly HRPortalDbContext _context;
        private readonly ILogger<DepartmentsController> _logger;

        public DepartmentsController(HRPortalDbContext context, ILogger<DepartmentsController> logger)
        {
            _context = context;
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
        public async Task<ActionResult<IEnumerable<DepartmentDto>>> GetDepartments()
        {
            try
            {
                var departments = await _context.Departments
                    .Include(d => d.Jobs)
                    .Select(d => new DepartmentDto
                    {
                        Id = "D-" + d.DepartmentId.ToString("D2"),
                        Name = d.DepartmentName,
                        Description = d.Description ?? "",
                        Jobs = d.Jobs.Select(j => new JobDto
                        {
                            Id = j.JobId,
                            Title = j.JobTitle,
                            Description = j.JobDescription,
                            MinSalary = j.MinSalary,
                            MaxSalary = j.MaxSalary,
                            DepartmentId = j.DepartmentId
                        }).ToList()
                    })
                    .ToListAsync();

                return Ok(departments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching departments");
                return StatusCode(500, new { message = "Error fetching departments", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<DepartmentDto>> GetDepartment(string id)
        {
            try
            {
                var departmentId = int.Parse(id.Replace("D-", ""));
                
                var department = await _context.Departments
                    .Include(d => d.Jobs)
                    .Where(d => d.DepartmentId == departmentId)
                    .Select(d => new DepartmentDto
                    {
                        Id = "D-" + d.DepartmentId.ToString("D2"),
                        Name = d.DepartmentName,
                        Description = d.Description ?? "",
                        Jobs = d.Jobs.Select(j => new JobDto
                        {
                            Id = j.JobId,
                            Title = j.JobTitle,
                            Description = j.JobDescription,
                            MinSalary = j.MinSalary,
                            MaxSalary = j.MaxSalary,
                            DepartmentId = j.DepartmentId
                        }).ToList()
                    })
                    .FirstOrDefaultAsync();

                if (department == null)
                    return NotFound();

                return Ok(department);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching department");
                return StatusCode(500, new { message = "Error fetching department", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<DepartmentDto>> CreateDepartment([FromBody] CreateDepartmentDto dto)
        {
            try
            {
                // Log the incoming request for debugging
                _logger.LogInformation("CreateDepartment called with: Name={Name}, Jobs={JobCount}", 
                    dto?.DepartmentName, dto?.Jobs?.Count ?? 0);

                // Validate input
                if (dto == null)
                {
                    _logger.LogWarning("CreateDepartment: DTO is null");
                    return BadRequest(new { message = "Request body is required" });
                }

                if (string.IsNullOrWhiteSpace(dto.DepartmentName))
                {
                    _logger.LogWarning("CreateDepartment: Department name is empty");
                    return BadRequest(new { message = "Department name is required" });
                }

                // Check if department name already exists
                var existingDept = await _context.Departments
                    .FirstOrDefaultAsync(d => d.DepartmentName == dto.DepartmentName.Trim());
                
                if (existingDept != null)
                {
                    _logger.LogWarning("CreateDepartment: Department name already exists: {Name}", dto.DepartmentName);
                    return BadRequest(new { message = "Department name already exists" });
                }

                // Validate jobs if provided (salary is optional)
                if (dto.Jobs != null && dto.Jobs.Any())
                {
                    for (int i = 0; i < dto.Jobs.Count; i++)
                    {
                        var jobDto = dto.Jobs[i];

                        if (string.IsNullOrWhiteSpace(jobDto.JobTitle))
                        {
                            _logger.LogWarning("CreateDepartment: Job {Index} has empty title", i);
                            return BadRequest(new { message = $"Job position {i + 1}: Title cannot be empty" });
                        }

                        var hasMin = jobDto.MinSalary.HasValue;
                        var hasMax = jobDto.MaxSalary.HasValue;

                        // If one of the salary values is provided, require both and validate
                        if (hasMin || hasMax)
                        {
                            if (!hasMin || !hasMax)
                            {
                                _logger.LogWarning("CreateDepartment: Job {Index} has incomplete salary range", i);
                                return BadRequest(new { message = $"Job position {i + 1}: Both minimum and maximum salary must be provided when specifying a salary range" });
                            }

                            if (jobDto.MinSalary <= 0)
                            {
                                _logger.LogWarning("CreateDepartment: Job {Index} has invalid MinSalary: {Min}", i, jobDto.MinSalary);
                                return BadRequest(new { message = $"Job position {i + 1}: Minimum salary must be greater than zero" });
                            }
                            if (jobDto.MaxSalary <= 0)
                            {
                                _logger.LogWarning("CreateDepartment: Job {Index} has invalid MaxSalary: {Max}", i, jobDto.MaxSalary);
                                return BadRequest(new { message = $"Job position {i + 1}: Maximum salary must be greater than zero" });
                            }
                            if (jobDto.MinSalary > jobDto.MaxSalary)
                            {
                                _logger.LogWarning("CreateDepartment: Job {Index} has MinSalary > MaxSalary", i);
                                return BadRequest(new { message = $"Job position {i + 1}: Minimum salary cannot exceed maximum salary" });
                            }
                        }
                    }
                }

                var department = new Department
                {
                    DepartmentName = dto.DepartmentName.Trim(),
                    Description = dto.Description?.Trim(),
                    CreatedAt = DateTime.UtcNow
                };

                _context.Departments.Add(department);
                await _context.SaveChangesAsync();

                // Add jobs if provided
                if (dto.Jobs != null && dto.Jobs.Any())
                {
                    foreach (var jobDto in dto.Jobs)
                    {
                        var job = new Common.Entity.Job
                        {
                            JobTitle = jobDto.JobTitle.Trim(),
                            JobDescription = $"Position: {jobDto.JobTitle.Trim()}", // Default description
                            MinSalary = jobDto.MinSalary ?? 0,
                            MaxSalary = jobDto.MaxSalary ?? 0,
                            DepartmentId = department.DepartmentId,
                            IsActive = true,
                            CreatedAt = DateTime.UtcNow
                        };
                        _context.Jobs.Add(job);
                    }
                    await _context.SaveChangesAsync();
                }

                var result = await _context.Departments
                    .Include(d => d.Jobs)
                    .Where(d => d.DepartmentId == department.DepartmentId)
                    .Select(d => new DepartmentDto
                    {
                        Id = "D-" + d.DepartmentId.ToString("D2"),
                        Name = d.DepartmentName,
                        Description = d.Description ?? "",
                        Jobs = d.Jobs.Select(j => new JobDto
                        {
                            Id = j.JobId,
                            Title = j.JobTitle,
                            Description = j.JobDescription,
                            MinSalary = j.MinSalary,
                            MaxSalary = j.MaxSalary,
                            DepartmentId = j.DepartmentId
                        }).ToList()
                    })
                    .FirstOrDefaultAsync();

                _logger.LogInformation("Department created successfully: {Id} - {Name}", result.Id, result.Name);
                return StatusCode(201, result); // 201 Created with the result
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating department: {Message}. StackTrace: {StackTrace}", ex.Message, ex.StackTrace);
                
                // Return detailed error in development
                return StatusCode(500, new 
                { 
                    message = "Error creating department", 
                    error = ex.Message,
                    details = ex.InnerException?.Message,
                    stackTrace = ex.StackTrace?.Split('\n').Take(5).ToArray()
                });
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<DepartmentDto>> UpdateDepartment(string id, [FromBody] UpdateDepartmentDto dto)
        {
            try
            {
                var departmentId = int.Parse(id.Replace("D-", ""));
                var department = await _context.Departments.FindAsync(departmentId);

                if (department == null)
                    return NotFound(new { message = "Department not found" });

                // Check if name exists for another department
                if (await _context.Departments.AnyAsync(d => d.DepartmentName == dto.DepartmentName && d.DepartmentId != departmentId))
                {
                    return BadRequest(new { message = "Department name already exists" });
                }

                department.DepartmentName = dto.DepartmentName;
                department.Description = dto.Description;
                department.UpdatedAt = DateTime.UtcNow;

                // Optionally update existing job titles and salary ranges
                if (dto.Jobs != null && dto.Jobs.Any())
                {
                    var jobIds = dto.Jobs.Select(j => j.Id).ToList();
                    var jobs = await _context.Jobs
                        .Where(j => j.DepartmentId == departmentId && jobIds.Contains(j.JobId))
                        .ToListAsync();

                    foreach (var jobDto in dto.Jobs)
                    {
                        var job = jobs.FirstOrDefault(j => j.JobId == jobDto.Id);
                        if (job == null)
                        {
                            _logger.LogWarning("UpdateDepartment: Job {JobId} not found for Department {DepartmentId}", jobDto.Id, departmentId);
                            continue;
                        }

                        if (!string.IsNullOrWhiteSpace(jobDto.JobTitle))
                        {
                            job.JobTitle = jobDto.JobTitle.Trim();
                        }

                        var hasMin = jobDto.MinSalary.HasValue;
                        var hasMax = jobDto.MaxSalary.HasValue;

                        if (hasMin || hasMax)
                        {
                            if (!hasMin || !hasMax)
                            {
                                return BadRequest(new { message = "Both minimum and maximum salary must be provided when updating a salary range" });
                            }

                            if (jobDto.MinSalary <= 0 || jobDto.MaxSalary <= 0)
                            {
                                return BadRequest(new { message = "Salary values must be greater than zero" });
                            }

                            if (jobDto.MinSalary > jobDto.MaxSalary)
                            {
                                return BadRequest(new { message = "Minimum salary cannot exceed maximum salary" });
                            }

                            job.MinSalary = jobDto.MinSalary.Value;
                            job.MaxSalary = jobDto.MaxSalary.Value;
                        }

                        job.UpdatedAt = DateTime.UtcNow;
                    }
                }

                await _context.SaveChangesAsync();

                var result = await _context.Departments
                    .Include(d => d.Jobs)
                    .Where(d => d.DepartmentId == departmentId)
                    .Select(d => new DepartmentDto
                    {
                        Id = "D-" + d.DepartmentId.ToString("D2"),
                        Name = d.DepartmentName,
                        Description = d.Description ?? "",
                        Jobs = d.Jobs.Select(j => new JobDto
                        {
                            Id = j.JobId,
                            Title = j.JobTitle,
                            Description = j.JobDescription,
                            MinSalary = j.MinSalary,
                            MaxSalary = j.MaxSalary,
                            DepartmentId = j.DepartmentId
                        }).ToList()
                    })
                    .FirstOrDefaultAsync();

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating department");
                return StatusCode(500, new { message = "Error updating department", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteDepartment(string id)
        {
            try
            {
                var departmentId = int.Parse(id.Replace("D-", ""));
                var department = await _context.Departments
                    .Include(d => d.Employees)
                    .FirstOrDefaultAsync(d => d.DepartmentId == departmentId);

                if (department == null)
                    return NotFound(new { message = "Department not found" });

                // Check if department has employees
                if (department.Employees.Any())
                {
                    return BadRequest(new { message = "Cannot delete department with active employees. Please reassign employees first." });
                }

                _context.Departments.Remove(department);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Department deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting department");
                return StatusCode(500, new { message = "Error deleting department", error = ex.Message });
            }
        }
    }
}
