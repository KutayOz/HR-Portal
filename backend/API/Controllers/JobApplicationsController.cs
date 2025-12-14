using Microsoft.AspNetCore.Mvc;
using Application.DTOs;
using Application.Services;
using Application.Infrastructure;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class JobApplicationsController : ControllerBase
    {
        private readonly IJobApplicationService _jobApplicationService;

        public JobApplicationsController(IJobApplicationService jobApplicationService)
        {
            _jobApplicationService = jobApplicationService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<JobApplicationDto>>> GetJobApplications([FromQuery] string? scope = null)
        {
            var parsedScope = OwnershipScopeParser.Parse(scope);
            var applications = await _jobApplicationService.GetJobApplicationsAsync(parsedScope);
            return Ok(applications);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<JobApplicationDto>> GetJobApplication(string id)
        {
            var application = await _jobApplicationService.GetJobApplicationAsync(id);

            if (application == null)
            {
                return NotFound();
            }

            return Ok(application);
        }

        [HttpPost]
        public async Task<ActionResult<JobApplicationDto>> CreateJobApplication([FromBody] CreateJobApplicationDto dto)
        {
            var (result, error) = await _jobApplicationService.CreateJobApplicationAsync(dto);

            if (result == null)
            {
                return BadRequest(new { message = error ?? "Invalid request" });
            }

            return CreatedAtAction(nameof(GetJobApplication), new { id = result.Id }, result);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<JobApplicationDto>> UpdateJobApplication(string id, [FromBody] UpdateJobApplicationDto dto)
        {
            var (result, error, notFound) = await _jobApplicationService.UpdateJobApplicationAsync(id, dto);

            if (notFound)
            {
                return NotFound(new { message = "Job application not found" });
            }

            if (result == null)
            {
                return BadRequest(new { message = error ?? "Invalid request" });
            }

            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteJobApplication(string id)
        {
            var (success, error, notFound) = await _jobApplicationService.DeleteJobApplicationAsync(id);

            if (notFound)
            {
                return NotFound(new { message = "Job application not found" });
            }

            if (!success)
            {
                return BadRequest(new { message = error ?? "Unable to delete job application" });
            }

            return Ok(new { message = "Job application deleted successfully" });
        }
    }
}
