using Application.DTOs;
using Application.Infrastructure;

namespace Application.Services;

public interface ILeaveRequestService
{
    Task<List<LeaveRequestDto>> GetLeaveRequestsAsync(OwnershipScope scope);
    Task<LeaveRequestDto?> GetLeaveRequestAsync(string id);

    Task<(LeaveRequestDto? Result, string? ErrorMessage)> CreateLeaveRequestAsync(CreateLeaveRequestDto dto);
    Task<(LeaveRequestDto? Result, string? ErrorMessage, bool NotFound)> UpdateLeaveStatusAsync(string id, UpdateLeaveStatusDto dto);
}
