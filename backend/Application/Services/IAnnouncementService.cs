using Application.DTOs;

namespace Application.Services;

public interface IAnnouncementService
{
    Task<List<AnnouncementDto>> GetAnnouncementsAsync();
    Task<AnnouncementDto?> GetAnnouncementAsync(string id);
    Task<(AnnouncementDto? Result, string? ErrorMessage)> CreateAnnouncementAsync(CreateAnnouncementDto dto);
}
