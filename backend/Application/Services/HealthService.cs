using Application.Repositories;
using Microsoft.Extensions.Logging;

namespace Application.Services;

public sealed class HealthService : IHealthService
{
    private readonly IHealthCheckRepository _healthCheckRepository;
    private readonly ILogger<HealthService> _logger;

    public HealthService(IHealthCheckRepository healthCheckRepository, ILogger<HealthService> logger)
    {
        _healthCheckRepository = healthCheckRepository;
        _logger = logger;
    }

    public async Task<(bool CanConnect, string? ErrorMessage)> CheckDatabaseAsync()
    {
        try
        {
            var canConnect = await _healthCheckRepository.CanConnectAsync();
            return (canConnect, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking database connectivity");
            return (false, ex.Message);
        }
    }
}
