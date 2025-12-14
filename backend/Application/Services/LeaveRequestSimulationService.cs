using Application.Repositories;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Application.Services;

/// <summary>
/// Background service that simulates manager approval/rejection of leave requests.
/// In a real system, this would be replaced by actual manager actions.
/// </summary>
public sealed class LeaveRequestSimulationService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<LeaveRequestSimulationService> _logger;
    private readonly Random _random = new();
    private readonly TimeSpan _interval = TimeSpan.FromSeconds(30); // Check every 30 seconds

    public LeaveRequestSimulationService(
        IServiceProvider serviceProvider,
        ILogger<LeaveRequestSimulationService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("LeaveRequestSimulationService started - simulating manager approvals");

        // Wait a bit before starting to allow the app to fully start
        await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await SimulateManagerDecisionsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in leave request simulation");
            }

            await Task.Delay(_interval, stoppingToken);
        }
    }

    private async Task SimulateManagerDecisionsAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var leaveRequestRepository = scope.ServiceProvider.GetRequiredService<ILeaveRequestRepository>();
        var employeeRepository = scope.ServiceProvider.GetRequiredService<IEmployeeRepository>();

        // Get all pending leave requests
        var allRequests = await leaveRequestRepository.GetAllWithEmployeeAsync(cancellationToken);
        var pendingRequests = allRequests.Where(r => r.Status == "Pending").ToList();

        foreach (var request in pendingRequests)
        {
            // Simulate decision delay - only process requests that are at least 5 seconds old
            if ((DateTime.UtcNow - request.CreatedAt).TotalSeconds < 5)
            {
                continue;
            }

            // 70% approval rate, 30% declined rate
            var decision = _random.Next(100) < 70 ? "Approved" : "Declined";
            
            // Refetch to get tracked entity
            var trackedRequest = await leaveRequestRepository.FindByIdAsync(request.LeaveRequestId, cancellationToken);
            if (trackedRequest == null || trackedRequest.Status != "Pending")
            {
                continue;
            }

            trackedRequest.Status = decision;
            trackedRequest.ApprovedDate = DateTime.UtcNow;
            trackedRequest.ApproverComments = decision == "Approved" 
                ? "Request approved by manager" 
                : "Request declined by manager - insufficient leave balance or scheduling conflict";
            trackedRequest.UpdatedAt = DateTime.UtcNow;

            // If approved and the leave covers today, update employee status
            if (decision == "Approved")
            {
                var today = DateTime.UtcNow.Date;
                if (trackedRequest.StartDate.Date <= today && trackedRequest.EndDate.Date >= today)
                {
                    var employee = await employeeRepository.FindByIdAsync(trackedRequest.EmployeeId, cancellationToken);
                    if (employee != null && employee.EmploymentStatus == "Active")
                    {
                        employee.EmploymentStatus = "OnLeave";
                        employee.UpdatedAt = DateTime.UtcNow;
                        _logger.LogInformation(
                            "Employee {EmployeeId} status changed to OnLeave (approved leave request {LeaveId})",
                            employee.EmployeeId, trackedRequest.LeaveRequestId);
                    }
                }
            }

            await leaveRequestRepository.SaveChangesAsync(cancellationToken);

            _logger.LogInformation(
                "Leave request {LeaveId} for employee {EmployeeId} has been {Decision} (simulated)",
                trackedRequest.LeaveRequestId, trackedRequest.EmployeeId, decision);
        }
    }
}
