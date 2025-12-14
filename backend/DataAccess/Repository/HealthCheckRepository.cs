using Application.Repositories;
using Data.Context;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.Repository;

public sealed class HealthCheckRepository : IHealthCheckRepository
{
    private readonly HRPortalDbContext _context;

    public HealthCheckRepository(HRPortalDbContext context)
    {
        _context = context;
    }

    public Task<bool> CanConnectAsync(CancellationToken cancellationToken = default)
    {
        return _context.Database.CanConnectAsync(cancellationToken);
    }
}
