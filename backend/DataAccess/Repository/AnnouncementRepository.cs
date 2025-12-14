using Application.Repositories;
using Common.Entity;
using Data.Context;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.Repository;

public sealed class AnnouncementRepository : IAnnouncementRepository
{
    private readonly HRPortalDbContext _context;

    public AnnouncementRepository(HRPortalDbContext context)
    {
        _context = context;
    }

    public Task<List<Announcement>> GetActiveAsync(DateTime utcNow, CancellationToken cancellationToken = default)
    {
        return _context.Announcements
            .Where(a => a.IsActive && (!a.ExpiryDate.HasValue || a.ExpiryDate.Value > utcNow))
            .OrderByDescending(a => a.Priority)
            .ThenByDescending(a => a.PublishDate)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public Task<Announcement?> FindByIdAsync(int announcementId, CancellationToken cancellationToken = default)
    {
        return _context.Announcements
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.AnnouncementId == announcementId, cancellationToken);
    }

    public Task AddAsync(Announcement announcement, CancellationToken cancellationToken = default)
    {
        return _context.Announcements.AddAsync(announcement, cancellationToken).AsTask();
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return _context.SaveChangesAsync(cancellationToken);
    }
}
