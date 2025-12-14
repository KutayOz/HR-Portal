using System.Globalization;
using Application.DTOs;
using Application.Exceptions;
using Application.Infrastructure;
using Application.Repositories;
using Common.Entity;
using Microsoft.Extensions.Logging;

namespace Application.Services;

public sealed class LeaveRequestService : ILeaveRequestService
{
    private static readonly string[] AllowedDateFormats = { "yyyy-MM-dd", "dd.MM.yyyy" };

    private readonly ILeaveRequestRepository _leaveRequestRepository;
    private readonly IEmployeeRepository _employeeRepository;
    private readonly IAccessRequestRepository _accessRequestRepository;
    private readonly ICurrentAdminProvider _currentAdminProvider;
    private readonly ILogger<LeaveRequestService> _logger;

    public LeaveRequestService(
        ILeaveRequestRepository leaveRequestRepository,
        IEmployeeRepository employeeRepository,
        IAccessRequestRepository accessRequestRepository,
        ICurrentAdminProvider currentAdminProvider,
        ILogger<LeaveRequestService> logger)
    {
        _leaveRequestRepository = leaveRequestRepository;
        _employeeRepository = employeeRepository;
        _accessRequestRepository = accessRequestRepository;
        _currentAdminProvider = currentAdminProvider;
        _logger = logger;
    }

    public async Task<List<LeaveRequestDto>> GetLeaveRequestsAsync(OwnershipScope scope)
    {
        var leaveRequests = scope == OwnershipScope.Yours
            ? await GetOwnedLeaveRequestsAsync()
            : await _leaveRequestRepository.GetAllWithEmployeeAsync();
        return leaveRequests.Select(MapLeaveRequest).ToList();
    }

    public async Task<LeaveRequestDto?> GetLeaveRequestAsync(string id)
    {
        var leaveRequestId = ParseLeaveRequestId(id);
        if (leaveRequestId == null)
        {
            return null;
        }

        var leaveRequest = await _leaveRequestRepository.GetByIdWithEmployeeAsync(leaveRequestId.Value);
        return leaveRequest == null ? null : MapLeaveRequest(leaveRequest);
    }

    public async Task<(LeaveRequestDto? Result, string? ErrorMessage)> CreateLeaveRequestAsync(CreateLeaveRequestDto dto)
    {
        if (dto == null)
        {
            return (null, "Request body is required");
        }

        if (dto.EmployeeId <= 0)
        {
            return (null, "EmployeeId must be a positive number");
        }

        var employee = await _employeeRepository.FindByIdAsync(dto.EmployeeId);
        if (employee == null)
        {
            return (null, "Employee not found");
        }

        if (!DateTime.TryParseExact(dto.StartDate, AllowedDateFormats, CultureInfo.InvariantCulture, DateTimeStyles.None, out var startParsed))
        {
            return (null, "Invalid startDate format. Use 'yyyy-MM-dd' (e.g. 2025-11-01)." );
        }

        if (!DateTime.TryParseExact(dto.EndDate, AllowedDateFormats, CultureInfo.InvariantCulture, DateTimeStyles.None, out var endParsed))
        {
            return (null, "Invalid endDate format. Use 'yyyy-MM-dd' (e.g. 2025-11-10)." );
        }

        var startDate = DateTime.SpecifyKind(startParsed.Date, DateTimeKind.Utc);
        var endDate = DateTime.SpecifyKind(endParsed.Date, DateTimeKind.Utc);

        if (endDate < startDate)
        {
            return (null, "End date cannot be before start date");
        }

        var numberOfDays = (int)(endDate - startDate).TotalDays + 1;

        var leaveRequest = new LeaveRequest
        {
            EmployeeId = dto.EmployeeId,
            LeaveType = dto.LeaveType,
            StartDate = startDate,
            EndDate = endDate,
            NumberOfDays = numberOfDays,
            Reason = dto.Reason ?? string.Empty,
            Status = "Pending",
            ApprovedBy = null,
            ApprovedDate = null,
            ApproverComments = string.Empty,
            OwnerAdminId = _currentAdminProvider.AdminId,
            CreatedAt = DateTime.UtcNow
        };

        await _leaveRequestRepository.AddAsync(leaveRequest);
        await _leaveRequestRepository.SaveChangesAsync();

        var result = new LeaveRequestDto
        {
            Id = "L-" + leaveRequest.LeaveRequestId,
            EmployeeId = "E-" + leaveRequest.EmployeeId,
            EmployeeName = employee.FirstName + " " + employee.LastName,
            Type = leaveRequest.LeaveType,
            StartDate = leaveRequest.StartDate.ToString("yyyy-MM-dd"),
            EndDate = leaveRequest.EndDate.ToString("yyyy-MM-dd"),
            Status = leaveRequest.Status
        };

        return (result, null);
    }

    public async Task<(LeaveRequestDto? Result, string? ErrorMessage, bool NotFound)> UpdateLeaveStatusAsync(string id, UpdateLeaveStatusDto dto)
    {
        var leaveRequestId = ParseLeaveRequestId(id);
        if (leaveRequestId == null)
        {
            return (null, "Invalid leave request id", false);
        }

        var leaveRequest = await _leaveRequestRepository.FindByIdAsync(leaveRequestId.Value);
        if (leaveRequest == null)
        {
            return (null, null, true);
        }

        await EnsureHasEditAccessAsync(leaveRequest.OwnerAdminId, leaveRequestId.Value);

        leaveRequest.Status = dto.Status;
        leaveRequest.ApproverComments = dto.ApproverComments;
        leaveRequest.ApprovedDate = DateTime.UtcNow;
        leaveRequest.UpdatedAt = DateTime.UtcNow;

        await _leaveRequestRepository.SaveChangesAsync();

        var updated = await _leaveRequestRepository.GetByIdWithEmployeeAsync(leaveRequestId.Value);
        if (updated == null)
        {
            _logger.LogWarning("Leave request updated but could not be reloaded: {Id}", leaveRequestId.Value);
            return (null, "Leave request updated but could not be reloaded", false);
        }

        return (MapLeaveRequest(updated), null, false);
    }

    private async Task<List<LeaveRequest>> GetOwnedLeaveRequestsAsync()
    {
        var adminId = _currentAdminProvider.AdminId;
        if (string.IsNullOrWhiteSpace(adminId))
        {
            return new List<LeaveRequest>();
        }

        return await _leaveRequestRepository.GetAllWithEmployeeForOwnerAsync(adminId);
    }

    private async Task EnsureHasEditAccessAsync(string? ownerAdminId, int leaveRequestId)
    {
        var adminId = _currentAdminProvider.AdminId;
        if (string.IsNullOrWhiteSpace(adminId))
        {
            throw new ForbiddenException("X-Admin-Id header is required");
        }

        if (string.IsNullOrWhiteSpace(ownerAdminId))
        {
            var leaveRequest = await _leaveRequestRepository.FindByIdAsync(leaveRequestId);
            if (leaveRequest != null && string.IsNullOrWhiteSpace(leaveRequest.OwnerAdminId))
            {
                leaveRequest.OwnerAdminId = adminId;
                await _leaveRequestRepository.SaveChangesAsync();
            }

            return;
        }

        if (string.Equals(ownerAdminId, adminId, StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        var approved = await _accessRequestRepository.FindActiveApprovalAsync(adminId, "LeaveRequest", leaveRequestId, DateTime.UtcNow);
        if (approved == null)
        {
            throw new ForbiddenException("You do not have access to modify this leave request");
        }
    }

    private static int? ParseLeaveRequestId(string id)
    {
        if (string.IsNullOrWhiteSpace(id))
        {
            return null;
        }

        if (id.StartsWith("L-", StringComparison.OrdinalIgnoreCase))
        {
            id = id.Replace("L-", "", StringComparison.OrdinalIgnoreCase);
        }

        return int.TryParse(id, out var parsed) ? parsed : null;
    }

    private static LeaveRequestDto MapLeaveRequest(LeaveRequest lr)
    {
        return new LeaveRequestDto
        {
            Id = "L-" + lr.LeaveRequestId,
            EmployeeId = "E-" + lr.EmployeeId,
            EmployeeName = lr.Employee.FirstName + " " + lr.Employee.LastName,
            Type = lr.LeaveType,
            StartDate = lr.StartDate.ToString("yyyy-MM-dd"),
            EndDate = lr.EndDate.ToString("yyyy-MM-dd"),
            Status = lr.Status,
            OwnerAdminId = lr.OwnerAdminId
        };
    }
}
