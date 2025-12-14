using Application.DTOs;
using Application.Repositories;
using Common.Entity;
using Microsoft.Extensions.Logging;

namespace Application.Services;

public sealed class AnnouncementService : IAnnouncementService
{
    private readonly IAnnouncementRepository _announcementRepository;
    private readonly ILogger<AnnouncementService> _logger;

    public AnnouncementService(IAnnouncementRepository announcementRepository, ILogger<AnnouncementService> logger)
    {
        _announcementRepository = announcementRepository;
        _logger = logger;
    }

    public async Task<List<AnnouncementDto>> GetAnnouncementsAsync()
    {
        var utcNow = DateTime.UtcNow;
        var announcements = await _announcementRepository.GetActiveAsync(utcNow);
        return announcements.Select(MapAnnouncement).ToList();
    }

    public async Task<AnnouncementDto?> GetAnnouncementAsync(string id)
    {
        var announcementId = ParseAnnouncementId(id);
        if (announcementId == null)
        {
            return null;
        }

        var announcement = await _announcementRepository.FindByIdAsync(announcementId.Value);
        return announcement == null ? null : MapAnnouncement(announcement);
    }

    public async Task<(AnnouncementDto? Result, string? ErrorMessage)> CreateAnnouncementAsync(CreateAnnouncementDto dto)
    {
        if (dto == null)
        {
            return (null, "Request body is required");
        }

        if (string.IsNullOrWhiteSpace(dto.Title))
        {
            return (null, "Title is required");
        }

        if (string.IsNullOrWhiteSpace(dto.Content))
        {
            return (null, "Content is required");
        }

        DateTime publishDate;
        try
        {
            publishDate = string.IsNullOrEmpty(dto.PublishDate) ? DateTime.UtcNow : DateTime.Parse(dto.PublishDate);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Invalid PublishDate: {PublishDate}", dto.PublishDate);
            return (null, "Invalid publishDate");
        }

        DateTime? expiryDate;
        try
        {
            expiryDate = string.IsNullOrEmpty(dto.ExpiryDate) ? null : DateTime.Parse(dto.ExpiryDate);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Invalid ExpiryDate: {ExpiryDate}", dto.ExpiryDate);
            return (null, "Invalid expiryDate");
        }

        var announcement = new Announcement
        {
            Title = dto.Title,
            Content = dto.Content,
            AnnouncementType = dto.AnnouncementType,
            Priority = dto.Priority,
            PublishDate = publishDate,
            ExpiryDate = expiryDate,
            TargetDepartmentId = dto.TargetDepartmentId,
            AttachmentPath = string.Empty,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        await _announcementRepository.AddAsync(announcement);
        await _announcementRepository.SaveChangesAsync();

        return (MapAnnouncement(announcement), null);
    }

    private static int? ParseAnnouncementId(string id)
    {
        if (string.IsNullOrWhiteSpace(id))
        {
            return null;
        }

        if (id.StartsWith("ANN-", StringComparison.OrdinalIgnoreCase))
        {
            id = id.Replace("ANN-", "", StringComparison.OrdinalIgnoreCase);
        }

        return int.TryParse(id, out var parsed) ? parsed : null;
    }

    private static AnnouncementDto MapAnnouncement(Announcement a)
    {
        return new AnnouncementDto
        {
            Id = "ANN-" + a.AnnouncementId,
            Title = a.Title,
            Content = a.Content,
            Priority = a.Priority,
            ExpiryDate = a.ExpiryDate.HasValue ? a.ExpiryDate.Value.ToString("yyyy-MM-dd") : ""
        };
    }
}
