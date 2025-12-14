namespace Application.Services;

public interface IHealthService
{
    Task<(bool CanConnect, string? ErrorMessage)> CheckDatabaseAsync();
}
