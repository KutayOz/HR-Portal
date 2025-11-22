using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Data.Context;
using API.DTOs;
using Common.Entity;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class JobApplicationsController : ControllerBase
    {
        private readonly HRPortalDbContext _context;
        private readonly ILogger<JobApplicationsController> _logger;

        public JobApplicationsController(HRPortalDbContext context, ILogger<JobApplicationsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<JobApplicationDto>>> GetJobApplications()
        {
            try
            {
                var applicationEntities = await _context.JobApplications
                    .Include(ja => ja.Candidate)
                    .Include(ja => ja.Job)
                    .ThenInclude(j => j.Department)
                    .ToListAsync();

                var applications = applicationEntities
                    .Select(ja => new JobApplicationDto
                    {
                        Id = "APP-" + ja.ApplicationId.ToString("D3"),
                        CandidateId = "C-" + ja.CandidateId.ToString("D3"),
                        Candidate = new CandidateDto
                        {
                            Id = "C-" + ja.Candidate.CandidateId.ToString("D3"),
                            FirstName = ja.Candidate.FirstName,
                            LastName = ja.Candidate.LastName,
                            Skills = !string.IsNullOrEmpty(ja.Candidate.Skills) 
                                ? ja.Candidate.Skills.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(s => s.Trim()).ToList()
                                : new List<string>(),
                            LinkedInUrl = ja.Candidate.LinkedInProfile ?? "#",
                            ResumeUrl = ja.Candidate.ResumePath ?? "#",
                            AvatarUrl = "https://picsum.photos/200/200?random=" + (ja.Candidate.CandidateId + 100)
                        },
                        Position = ja.Job.JobTitle,
                        DepartmentId = "D-" + ja.Job.DepartmentId.ToString("D2"),
                        Status = ja.Status,
                        InterviewNotes = ja.InterviewNotes,
                        ExpectedSalary = ja.ExpectedSalary ?? 0,
                        MatchScore = CalculateMatchScore(ja.Candidate.YearsOfExperience, ja.ExpectedSalary, ja.Job.MaxSalary)
                    })
                    .ToList();

                return Ok(applications);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching job applications");
                return StatusCode(500, new { message = "Error fetching job applications", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<JobApplicationDto>> GetJobApplication(string id)
        {
            try
            {
                var applicationId = int.Parse(id.Replace("APP-", ""));
                
                var applicationEntities = await _context.JobApplications
                    .Include(ja => ja.Candidate)
                    .Include(ja => ja.Job)
                    .ThenInclude(j => j.Department)
                    .Where(ja => ja.ApplicationId == applicationId)
                    .ToListAsync();

                var application = applicationEntities
                    .Select(ja => new JobApplicationDto
                    {
                        Id = "APP-" + ja.ApplicationId.ToString("D3"),
                        CandidateId = "C-" + ja.CandidateId.ToString("D3"),
                        Candidate = new CandidateDto
                        {
                            Id = "C-" + ja.Candidate.CandidateId.ToString("D3"),
                            FirstName = ja.Candidate.FirstName,
                            LastName = ja.Candidate.LastName,
                            Skills = !string.IsNullOrEmpty(ja.Candidate.Skills) 
                                ? ja.Candidate.Skills.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(s => s.Trim()).ToList()
                                : new List<string>(),
                            LinkedInUrl = ja.Candidate.LinkedInProfile ?? "#",
                            ResumeUrl = ja.Candidate.ResumePath ?? "#",
                            AvatarUrl = "https://picsum.photos/200/200?random=" + (ja.Candidate.CandidateId + 100)
                        },
                        Position = ja.Job.JobTitle,
                        DepartmentId = "D-" + ja.Job.DepartmentId.ToString("D2"),
                        Status = ja.Status,
                        InterviewNotes = ja.InterviewNotes,
                        ExpectedSalary = ja.ExpectedSalary ?? 0,
                        MatchScore = CalculateMatchScore(ja.Candidate.YearsOfExperience, ja.ExpectedSalary, ja.Job.MaxSalary)
                    })
                    .FirstOrDefault();

                if (application == null)
                    return NotFound();

                return Ok(application);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching job application");
                return StatusCode(500, new { message = "Error fetching job application", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<JobApplicationDto>> CreateJobApplication([FromBody] CreateJobApplicationDto dto)
        {
            try
            {
                // Verify candidate and job exist
                var candidate = await _context.Candidates.FindAsync(dto.CandidateId);
                if (candidate == null)
                    return BadRequest(new { message = "Candidate not found" });

                var job = await _context.Jobs.FindAsync(dto.JobId);
                if (job == null)
                    return BadRequest(new { message = "Job not found" });

                var application = new JobApplication
                {
                    CandidateId = dto.CandidateId,
                    JobId = dto.JobId,
                    ApplicationDate = DateTime.UtcNow,
                    Status = "Applied",
                    InterviewNotes = dto.InterviewNotes,
                    ExpectedSalary = dto.ExpectedSalary,
                    CreatedAt = DateTime.UtcNow
                };

                _context.JobApplications.Add(application);
                await _context.SaveChangesAsync();

                var resultEntities = await _context.JobApplications
                    .Include(ja => ja.Candidate)
                    .Include(ja => ja.Job)
                    .ThenInclude(j => j.Department)
                    .Where(ja => ja.ApplicationId == application.ApplicationId)
                    .ToListAsync();

                var result = resultEntities
                    .Select(ja => new JobApplicationDto
                    {
                        Id = "APP-" + ja.ApplicationId.ToString("D3"),
                        CandidateId = "C-" + ja.CandidateId.ToString("D3"),
                        Candidate = new CandidateDto
                        {
                            Id = "C-" + ja.Candidate.CandidateId.ToString("D3"),
                            FirstName = ja.Candidate.FirstName,
                            LastName = ja.Candidate.LastName,
                            Skills = !string.IsNullOrEmpty(ja.Candidate.Skills) 
                                ? ja.Candidate.Skills.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(s => s.Trim()).ToList()
                                : new List<string>(),
                            LinkedInUrl = ja.Candidate.LinkedInProfile ?? "#",
                            ResumeUrl = ja.Candidate.ResumePath ?? "#",
                            AvatarUrl = "https://picsum.photos/200/200?random=" + (ja.Candidate.CandidateId + 100)
                        },
                        Position = ja.Job.JobTitle,
                        DepartmentId = "D-" + ja.Job.DepartmentId.ToString("D2"),
                        Status = ja.Status,
                        InterviewNotes = ja.InterviewNotes,
                        ExpectedSalary = ja.ExpectedSalary ?? 0,
                        MatchScore = CalculateMatchScore(ja.Candidate.YearsOfExperience, ja.ExpectedSalary, ja.Job.MaxSalary)
                    })
                    .FirstOrDefault();

                return CreatedAtAction(nameof(GetJobApplication), new { id = result.Id }, result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating job application");
                return StatusCode(500, new { message = "Error creating job application", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<JobApplicationDto>> UpdateJobApplication(string id, [FromBody] UpdateJobApplicationDto dto)
        {
            try
            {
                var applicationId = int.Parse(id.Replace("APP-", ""));
                var application = await _context.JobApplications.FindAsync(applicationId);

                if (application == null)
                    return NotFound(new { message = "Job application not found" });

                application.Status = dto.Status;
                application.InterviewNotes = dto.InterviewNotes;
                application.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                var resultEntities = await _context.JobApplications
                    .Include(ja => ja.Candidate)
                    .Include(ja => ja.Job)
                    .ThenInclude(j => j.Department)
                    .Where(ja => ja.ApplicationId == applicationId)
                    .ToListAsync();

                var result = resultEntities
                    .Select(ja => new JobApplicationDto
                    {
                        Id = "APP-" + ja.ApplicationId.ToString("D3"),
                        CandidateId = "C-" + ja.CandidateId.ToString("D3"),
                        Candidate = new CandidateDto
                        {
                            Id = "C-" + ja.Candidate.CandidateId.ToString("D3"),
                            FirstName = ja.Candidate.FirstName,
                            LastName = ja.Candidate.LastName,
                            Skills = !string.IsNullOrEmpty(ja.Candidate.Skills) 
                                ? ja.Candidate.Skills.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(s => s.Trim()).ToList()
                                : new List<string>(),
                            LinkedInUrl = ja.Candidate.LinkedInProfile ?? "#",
                            ResumeUrl = ja.Candidate.ResumePath ?? "#",
                            AvatarUrl = "https://picsum.photos/200/200?random=" + (ja.Candidate.CandidateId + 100)
                        },
                        Position = ja.Job.JobTitle,
                        DepartmentId = "D-" + ja.Job.DepartmentId.ToString("D2"),
                        Status = ja.Status,
                        InterviewNotes = ja.InterviewNotes,
                        ExpectedSalary = ja.ExpectedSalary ?? 0,
                        MatchScore = CalculateMatchScore(ja.Candidate.YearsOfExperience, ja.ExpectedSalary, ja.Job.MaxSalary)
                    })
                    .FirstOrDefault();

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating job application");
                return StatusCode(500, new { message = "Error updating job application", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteJobApplication(string id)
        {
            try
            {
                var applicationId = int.Parse(id.Replace("APP-", ""));
                var application = await _context.JobApplications.FindAsync(applicationId);

                if (application == null)
                    return NotFound(new { message = "Job application not found" });

                _context.JobApplications.Remove(application);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Job application deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting job application");
                return StatusCode(500, new { message = "Error deleting job application", error = ex.Message });
            }
        }

        private int CalculateMatchScore(int? yearsOfExperience, decimal? expectedSalary, decimal maxSalary)
        {
            // Simple match score calculation
            int score = 70; // Base score

            // Experience bonus (max 20 points)
            if (yearsOfExperience.HasValue)
            {
                score += Math.Min(yearsOfExperience.Value * 2, 20);
            }

            // Salary expectation fit (max 10 points)
            if (expectedSalary.HasValue && maxSalary > 0)
            {
                var salaryRatio = (double)(expectedSalary.Value / maxSalary);
                if (salaryRatio <= 0.8)
                    score += 10;
                else if (salaryRatio <= 1.0)
                    score += 5;
            }

            return Math.Min(score, 100);
        }
    }
}
