using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Data.Context;
using API.DTOs;
using Common.Entity;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AnnouncementsController : ControllerBase
    {
        private readonly HRPortalDbContext _context;
        private readonly ILogger<AnnouncementsController> _logger;

        public AnnouncementsController(HRPortalDbContext context, ILogger<AnnouncementsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<AnnouncementDto>>> GetAnnouncements()
        {
            try
            {
                var announcements = await _context.Announcements
                    .Where(a => a.IsActive && (!a.ExpiryDate.HasValue || a.ExpiryDate.Value > DateTime.UtcNow))
                    .OrderByDescending(a => a.Priority)
                    .ThenByDescending(a => a.PublishDate)
                    .Select(a => new AnnouncementDto
                    {
                        Id = "ANN-" + a.AnnouncementId.ToString(),
                        Title = a.Title,
                        Content = a.Content,
                        Priority = a.Priority,
                        ExpiryDate = a.ExpiryDate.HasValue ? a.ExpiryDate.Value.ToString("yyyy-MM-dd") : ""
                    })
                    .ToListAsync();

                return Ok(announcements);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching announcements");
                return StatusCode(500, new { message = "Error fetching announcements", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<AnnouncementDto>> GetAnnouncement(string id)
        {
            try
            {
                var announcementId = int.Parse(id.Replace("ANN-", ""));
                
                var announcement = await _context.Announcements
                    .Where(a => a.AnnouncementId == announcementId)
                    .Select(a => new AnnouncementDto
                    {
                        Id = "ANN-" + a.AnnouncementId.ToString(),
                        Title = a.Title,
                        Content = a.Content,
                        Priority = a.Priority,
                        ExpiryDate = a.ExpiryDate.HasValue ? a.ExpiryDate.Value.ToString("yyyy-MM-dd") : ""
                    })
                    .FirstOrDefaultAsync();

                if (announcement == null)
                    return NotFound();

                return Ok(announcement);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching announcement");
                return StatusCode(500, new { message = "Error fetching announcement", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<AnnouncementDto>> CreateAnnouncement([FromBody] CreateAnnouncementDto dto)
        {
            try
            {
                var announcement = new Announcement
                {
                    Title = dto.Title,
                    Content = dto.Content,
                    AnnouncementType = dto.AnnouncementType,
                    Priority = dto.Priority,
                    PublishDate = string.IsNullOrEmpty(dto.PublishDate) ? DateTime.UtcNow : DateTime.Parse(dto.PublishDate),
                    ExpiryDate = string.IsNullOrEmpty(dto.ExpiryDate) ? null : DateTime.Parse(dto.ExpiryDate),
                    TargetDepartmentId = dto.TargetDepartmentId,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Announcements.Add(announcement);
                await _context.SaveChangesAsync();

                var result = new AnnouncementDto
                {
                    Id = "ANN-" + announcement.AnnouncementId.ToString(),
                    Title = announcement.Title,
                    Content = announcement.Content,
                    Priority = announcement.Priority,
                    ExpiryDate = announcement.ExpiryDate.HasValue ? announcement.ExpiryDate.Value.ToString("yyyy-MM-dd") : ""
                };

                return CreatedAtAction(nameof(GetAnnouncement), new { id = result.Id }, result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating announcement");
                return StatusCode(500, new { message = "Error creating announcement", error = ex.Message });
            }
        }
    }
}
