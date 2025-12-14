using Common.Entity;

namespace Application.Repositories;

public interface IAnnouncementRepository
{
    Task<List<Announcement>> GetActiveAsync(DateTime utcNow, CancellationToken cancellationToken = default);
    Task<Announcement?> FindByIdAsync(int announcementId, CancellationToken cancellationToken = default);
    Task AddAsync(Announcement announcement, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
