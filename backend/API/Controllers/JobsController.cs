using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Data.Context;
using API.DTOs;
using Common.Entity;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class JobsController : ControllerBase
    {
        private readonly HRPortalDbContext _context;
        private readonly ILogger<JobsController> _logger;

        public JobsController(HRPortalDbContext context, ILogger<JobsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<JobDto>>> GetJobs()
        {
            try
            {
                var jobs = await _context.Jobs
                    .Include(j => j.Department)
                    .Select(j => new JobDto
                    {
                        Id = j.JobId,
                        Title = j.JobTitle,
                        Description = j.JobDescription,
                        MinSalary = j.MinSalary,
                        MaxSalary = j.MaxSalary,
                        DepartmentId = j.DepartmentId,
                        DepartmentName = j.Department.DepartmentName
                    })
                    .ToListAsync();

                return Ok(jobs);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching jobs");
                return StatusCode(500, new { message = "Error fetching jobs", error = ex.Message });
            }
        }

        [HttpGet("department/{departmentId}")]
        public async Task<ActionResult<IEnumerable<JobDto>>> GetJobsByDepartment(int departmentId)
        {
            try
            {
                var jobs = await _context.Jobs
                    .Where(j => j.DepartmentId == departmentId)
                    .Select(j => new JobDto
                    {
                        Id = j.JobId,
                        Title = j.JobTitle,
                        Description = j.JobDescription,
                        MinSalary = j.MinSalary,
                        MaxSalary = j.MaxSalary,
                        DepartmentId = j.DepartmentId,
                        DepartmentName = j.Department.DepartmentName
                    })
                    .ToListAsync();

                return Ok(jobs);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching jobs by department");
                return StatusCode(500, new { message = "Error fetching jobs by department", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<JobDto>> GetJob(int id)
        {
            try
            {
                var job = await _context.Jobs
                    .Include(j => j.Department)
                    .Where(j => j.JobId == id)
                    .Select(j => new JobDto
                    {
                        Id = j.JobId,
                        Title = j.JobTitle,
                        Description = j.JobDescription,
                        MinSalary = j.MinSalary,
                        MaxSalary = j.MaxSalary,
                        DepartmentId = j.DepartmentId,
                        DepartmentName = j.Department.DepartmentName
                    })
                    .FirstOrDefaultAsync();

                if (job == null)
                    return NotFound();

                return Ok(job);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching job");
                return StatusCode(500, new { message = "Error fetching job", error = ex.Message });
            }
        }
        [HttpPost]
        public async Task<ActionResult<JobDto>> CreateJob([FromBody] CreateJobDto dto)
        {
            try
            {
                var department = await _context.Departments.FindAsync(dto.DepartmentId);
                if (department == null)
                    return BadRequest(new { message = "Department not found" });

                var job = new Job
                {
                    JobTitle = dto.Title,
                    JobDescription = dto.Description,
                    MinSalary = dto.MinSalary,
                    MaxSalary = dto.MaxSalary,
                    DepartmentId = dto.DepartmentId,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Jobs.Add(job);
                await _context.SaveChangesAsync();

                var result = new JobDto
                {
                    Id = job.JobId,
                    Title = job.JobTitle,
                    Description = job.JobDescription,
                    MinSalary = job.MinSalary,
                    MaxSalary = job.MaxSalary,
                    DepartmentId = job.DepartmentId,
                    DepartmentName = department.DepartmentName
                };

                return CreatedAtAction(nameof(GetJob), new { id = result.Id }, result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating job");
                return StatusCode(500, new { message = "Error creating job", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<JobDto>> UpdateJob(int id, [FromBody] UpdateJobDto dto)
        {
            try
            {
                var job = await _context.Jobs
                    .Include(j => j.Department)
                    .FirstOrDefaultAsync(j => j.JobId == id);

                if (job == null)
                    return NotFound(new { message = "Job not found" });

                job.JobTitle = dto.Title;
                job.JobDescription = dto.Description;
                job.MinSalary = dto.MinSalary;
                job.MaxSalary = dto.MaxSalary;
                job.IsActive = dto.IsActive;
                job.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                var result = new JobDto
                {
                    Id = job.JobId,
                    Title = job.JobTitle,
                    Description = job.JobDescription,
                    MinSalary = job.MinSalary,
                    MaxSalary = job.MaxSalary,
                    DepartmentId = job.DepartmentId,
                    DepartmentName = job.Department.DepartmentName
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating job");
                return StatusCode(500, new { message = "Error updating job", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteJob(int id)
        {
            try
            {
                var job = await _context.Jobs.FindAsync(id);
                if (job == null)
                    return NotFound(new { message = "Job not found" });

                // Check if job is used
                if (await _context.Employees.AnyAsync(e => e.JobId == id) || 
                    await _context.JobApplications.AnyAsync(ja => ja.JobId == id))
                {
                    // Soft delete if used
                    job.IsActive = false;
                    job.UpdatedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                    return Ok(new { message = "Job deactivated (soft deleted) because it is in use" });
                }

                _context.Jobs.Remove(job);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Job deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting job");
                return StatusCode(500, new { message = "Error deleting job", error = ex.Message });
            }
        }
    }
}
