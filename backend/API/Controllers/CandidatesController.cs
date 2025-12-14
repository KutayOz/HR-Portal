using Microsoft.AspNetCore.Mvc;
using Application.DTOs;
using Application.Services;
using Application.Infrastructure;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CandidatesController : ControllerBase
    {
        private readonly ICandidateService _candidateService;

        public CandidatesController(ICandidateService candidateService)
        {
            _candidateService = candidateService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<CandidateDto>>> GetCandidates([FromQuery] string? scope = null)
        {
            var parsedScope = OwnershipScopeParser.Parse(scope);
            var candidates = await _candidateService.GetCandidatesAsync(parsedScope);
            return Ok(candidates);
        }

        [HttpPost]
        public async Task<ActionResult<CandidateDto>> CreateCandidate([FromBody] CreateCandidateDto dto)
        {
            var (result, error) = await _candidateService.CreateCandidateAsync(dto);

            if (result == null)
            {
                return BadRequest(new { message = error ?? "Invalid request" });
            }

            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteCandidate(int id)
        {
            var (success, error, notFound) = await _candidateService.DeleteCandidateAsync(id);

            if (notFound)
            {
                return NotFound(new { message = "Candidate not found" });
            }

            if (!success)
            {
                return BadRequest(new { message = error ?? "Unable to delete candidate" });
            }

            return Ok(new { message = "Candidate deleted successfully" });
        }
    }
}
