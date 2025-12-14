using Microsoft.AspNetCore.Mvc;
using Application.DTOs;
using Application.Services;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class JobsController : ControllerBase
    {
        private readonly IJobService _jobService;

        public JobsController(IJobService jobService)
        {
            _jobService = jobService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<JobDto>>> GetJobs()
        {
            var result = await _jobService.GetJobsAsync();
            return Ok(result);
        }

        [HttpGet("department/{departmentId}")]
        public async Task<ActionResult<IEnumerable<JobDto>>> GetJobsByDepartment(int departmentId)
        {
            var result = await _jobService.GetJobsByDepartmentAsync(departmentId);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<JobDto>> GetJob(int id)
        {
            var result = await _jobService.GetJobAsync(id);
            if (result == null)
            {
                return NotFound();
            }

            return Ok(result);
        }
        [HttpPost]
        public async Task<ActionResult<JobDto>> CreateJob([FromBody] CreateJobDto dto)
        {
            var (result, error) = await _jobService.CreateJobAsync(dto);
            if (result == null)
            {
                return BadRequest(new { message = error ?? "Invalid request" });
            }

            return CreatedAtAction(nameof(GetJob), new { id = result.Id }, result);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<JobDto>> UpdateJob(int id, [FromBody] UpdateJobDto dto)
        {
            var (result, error, notFound) = await _jobService.UpdateJobAsync(id, dto);

            if (notFound)
            {
                return NotFound(new { message = "Job not found" });
            }

            if (result == null)
            {
                return BadRequest(new { message = error ?? "Invalid request" });
            }

            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteJob(int id)
        {
            var (success, message, notFound) = await _jobService.DeleteJobAsync(id);

            if (notFound)
            {
                return NotFound(new { message = "Job not found" });
            }

            if (!success)
            {
                return BadRequest(new { message = message ?? "Unable to delete job" });
            }

            if (!string.IsNullOrWhiteSpace(message))
            {
                return Ok(new { message });
            }

            return Ok(new { message = "Job deleted successfully" });
        }
    }
}
