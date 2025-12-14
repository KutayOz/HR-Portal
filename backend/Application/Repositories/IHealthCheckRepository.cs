namespace Application.Repositories;

public interface IHealthCheckRepository
{
    Task<bool> CanConnectAsync(CancellationToken cancellationToken = default);
}
