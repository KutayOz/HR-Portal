using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Data.Context;
using API.DTOs;
using Common.Entity;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CandidatesController : ControllerBase
    {
        private readonly HRPortalDbContext _context;
        private readonly ILogger<CandidatesController> _logger;

        public CandidatesController(HRPortalDbContext context, ILogger<CandidatesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<CandidateDto>>> GetCandidates()
        {
            try
            {
                var candidateEntities = await _context.Candidates
                    .AsNoTracking()
                    .ToListAsync();

                var candidates = candidateEntities
                    .Select(c => new CandidateDto
                    {
                        Id = "C-" + c.CandidateId.ToString("D3"),
                        FirstName = c.FirstName,
                        LastName = c.LastName,
                        Skills = !string.IsNullOrEmpty(c.Skills) 
                            ? c.Skills.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(s => s.Trim()).ToList()
                            : new List<string>(),
                        LinkedInUrl = c.LinkedInProfile ?? "#",
                        ResumeUrl = c.ResumePath ?? "#",
                        AvatarUrl = "https://picsum.photos/200/200?random=" + (c.CandidateId + 100)
                    })
                    .ToList();

                return Ok(candidates);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching candidates");
                return StatusCode(500, new { message = "Error fetching candidates", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<CandidateDto>> CreateCandidate([FromBody] CreateCandidateDto dto)
        {
            try
            {
                // Check if email already exists
                if (await _context.Candidates.AnyAsync(c => c.Email == dto.Email))
                {
                    return BadRequest(new { message = "Email already exists" });
                }

                var candidate = new Candidate
                {
                    FirstName = dto.FirstName,
                    LastName = dto.LastName,
                    Email = dto.Email,
                    PhoneNumber = dto.PhoneNumber ?? string.Empty,
                    Address = string.Empty,
                    City = string.Empty,
                    State = string.Empty,
                    PostalCode = string.Empty,
                    Country = string.Empty,
                    ResumePath = dto.ResumePath ?? string.Empty,
                    LinkedInProfile = dto.LinkedInProfile ?? string.Empty,
                    CurrentCompany = string.Empty,
                    CurrentPosition = string.Empty,
                    YearsOfExperience = dto.YearsOfExperience,
                    Skills = dto.Skills ?? string.Empty,
                    HighestEducation = string.Empty,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Candidates.Add(candidate);
                await _context.SaveChangesAsync();

                var result = new CandidateDto
                {
                    Id = "C-" + candidate.CandidateId.ToString("D3"),
                    FirstName = candidate.FirstName,
                    LastName = candidate.LastName,
                    Skills = !string.IsNullOrEmpty(candidate.Skills) 
                        ? candidate.Skills.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(s => s.Trim()).ToList()
                        : new List<string>(),
                    LinkedInUrl = candidate.LinkedInProfile ?? "#",
                    ResumeUrl = candidate.ResumePath ?? "#",
                    AvatarUrl = "https://picsum.photos/200/200?random=" + (candidate.CandidateId + 100)
                };

                return Ok(result);
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Database error creating candidate");
                return StatusCode(500, new
                {
                    message = "Database error creating candidate",
                    error = ex.InnerException?.Message ?? ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating candidate");
                return StatusCode(500, new { message = "Error creating candidate", error = ex.Message });
            }
        }
    }
}
