using Application.Repositories;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Application.Services;

public sealed class EmployeeStatusSyncService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<EmployeeStatusSyncService> _logger;
    private readonly TimeSpan _interval = TimeSpan.FromMinutes(15);

    public EmployeeStatusSyncService(
        IServiceProvider serviceProvider,
        ILogger<EmployeeStatusSyncService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("EmployeeStatusSyncService started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await SyncEmployeeStatusesAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error syncing employee statuses");
            }

            await Task.Delay(_interval, stoppingToken);
        }
    }

    private async Task SyncEmployeeStatusesAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var employeeRepository = scope.ServiceProvider.GetRequiredService<IEmployeeRepository>();
        var leaveRequestRepository = scope.ServiceProvider.GetRequiredService<ILeaveRequestRepository>();

        var today = DateTime.UtcNow.Date;

        // Get all employees currently on leave
        var employees = await employeeRepository.GetAllWithHierarchyAsync(cancellationToken);
        var onLeaveEmployees = employees.Where(e => e.EmploymentStatus == "OnLeave").ToList();

        foreach (var employee in onLeaveEmployees)
        {
            // Check if there's an active approved leave for today
            var activeLeave = await leaveRequestRepository.FindActiveApprovedLeaveAsync(
                employee.EmployeeId, today, cancellationToken);

            if (activeLeave == null)
            {
                // No active leave, reset to Active
                var emp = await employeeRepository.FindByIdAsync(employee.EmployeeId, cancellationToken);
                if (emp != null && emp.EmploymentStatus == "OnLeave")
                {
                    emp.EmploymentStatus = "Active";
                    emp.UpdatedAt = DateTime.UtcNow;
                    await employeeRepository.SaveChangesAsync(cancellationToken);
                    _logger.LogInformation("Employee {EmployeeId} status reset to Active (leave period ended)", emp.EmployeeId);
                }
            }
        }

        // Also check for employees who should be OnLeave but aren't
        var activeEmployees = employees.Where(e => e.EmploymentStatus == "Active").ToList();
        foreach (var employee in activeEmployees)
        {
            var activeLeave = await leaveRequestRepository.FindActiveApprovedLeaveAsync(
                employee.EmployeeId, today, cancellationToken);

            if (activeLeave != null)
            {
                var emp = await employeeRepository.FindByIdAsync(employee.EmployeeId, cancellationToken);
                if (emp != null && emp.EmploymentStatus == "Active")
                {
                    emp.EmploymentStatus = "OnLeave";
                    emp.UpdatedAt = DateTime.UtcNow;
                    await employeeRepository.SaveChangesAsync(cancellationToken);
                    _logger.LogInformation("Employee {EmployeeId} status changed to OnLeave (active leave found)", emp.EmployeeId);
                }
            }
        }

        _logger.LogDebug("Employee status sync completed");
    }
}
