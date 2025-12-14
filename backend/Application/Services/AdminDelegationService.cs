using Application.DTOs;
using Application.Infrastructure;
using Application.Repositories;
using Common.Entity;
using Microsoft.Extensions.Logging;

namespace Application.Services;

public interface IAdminDelegationService
{
    Task<List<AdminDelegationDto>> GetMyDelegationsAsync();
    Task<List<AdminDelegationDto>> GetDelegationsToMeAsync();
    Task<List<string>> GetDelegatedAdminIdsAsync();
    Task<(AdminDelegationDto? Result, string? ErrorMessage)> CreateDelegationAsync(CreateDelegationDto dto);
    Task<(bool Success, string? ErrorMessage)> RevokeDelegationAsync(int delegationId);
}

public sealed class AdminDelegationService : IAdminDelegationService
{
    private readonly IAdminDelegationRepository _delegationRepository;
    private readonly ICurrentAdminProvider _currentAdminProvider;
    private readonly ILogger<AdminDelegationService> _logger;

    public AdminDelegationService(
        IAdminDelegationRepository delegationRepository,
        ICurrentAdminProvider currentAdminProvider,
        ILogger<AdminDelegationService> logger)
    {
        _delegationRepository = delegationRepository;
        _currentAdminProvider = currentAdminProvider;
        _logger = logger;
    }

    public async Task<List<AdminDelegationDto>> GetMyDelegationsAsync()
    {
        var adminId = _currentAdminProvider.AdminId;
        if (string.IsNullOrWhiteSpace(adminId))
        {
            return new List<AdminDelegationDto>();
        }

        var delegations = await _delegationRepository.GetByFromAdminAsync(adminId);
        return delegations.Select(MapDelegation).ToList();
    }

    public async Task<List<AdminDelegationDto>> GetDelegationsToMeAsync()
    {
        var adminId = _currentAdminProvider.AdminId;
        if (string.IsNullOrWhiteSpace(adminId))
        {
            return new List<AdminDelegationDto>();
        }

        var delegations = await _delegationRepository.GetByToAdminAsync(adminId);
        return delegations.Select(MapDelegation).ToList();
    }

    public async Task<List<string>> GetDelegatedAdminIdsAsync()
    {
        var adminId = _currentAdminProvider.AdminId;
        if (string.IsNullOrWhiteSpace(adminId))
        {
            return new List<string>();
        }

        var activeDelegations = await _delegationRepository.GetActiveByToAdminAsync(adminId);
        return activeDelegations.Select(d => d.FromAdminId).Distinct().ToList();
    }

    public async Task<(AdminDelegationDto? Result, string? ErrorMessage)> CreateDelegationAsync(CreateDelegationDto dto)
    {
        var adminId = _currentAdminProvider.AdminId;
        if (string.IsNullOrWhiteSpace(adminId))
        {
            return (null, "Admin ID is required");
        }

        if (string.IsNullOrWhiteSpace(dto.ToAdminId))
        {
            return (null, "Target admin ID is required");
        }

        if (dto.ToAdminId == adminId)
        {
            return (null, "Cannot delegate to yourself");
        }

        if (dto.EndDate <= dto.StartDate)
        {
            return (null, "End date must be after start date");
        }

        var delegation = new AdminDelegation
        {
            FromAdminId = adminId,
            ToAdminId = dto.ToAdminId,
            StartDate = DateTime.SpecifyKind(dto.StartDate, DateTimeKind.Utc),
            EndDate = DateTime.SpecifyKind(dto.EndDate, DateTimeKind.Utc),
            Status = "Active",
            Reason = dto.Reason,
            CreatedAt = DateTime.UtcNow
        };

        await _delegationRepository.AddAsync(delegation);
        await _delegationRepository.SaveChangesAsync();

        _logger.LogInformation("Admin {FromAdmin} delegated authority to {ToAdmin} until {EndDate}",
            adminId, dto.ToAdminId, dto.EndDate);

        return (MapDelegation(delegation), null);
    }

    public async Task<(bool Success, string? ErrorMessage)> RevokeDelegationAsync(int delegationId)
    {
        var adminId = _currentAdminProvider.AdminId;
        if (string.IsNullOrWhiteSpace(adminId))
        {
            return (false, "Admin ID is required");
        }

        var delegation = await _delegationRepository.FindByIdAsync(delegationId);
        if (delegation == null)
        {
            return (false, "Delegation not found");
        }

        if (delegation.FromAdminId != adminId)
        {
            return (false, "You can only revoke your own delegations");
        }

        delegation.Status = "Revoked";
        delegation.RevokedAt = DateTime.UtcNow;

        await _delegationRepository.SaveChangesAsync();

        _logger.LogInformation("Admin {FromAdmin} revoked delegation {DelegationId}", adminId, delegationId);

        return (true, null);
    }

    private static AdminDelegationDto MapDelegation(AdminDelegation d)
    {
        return new AdminDelegationDto
        {
            Id = d.DelegationId,
            FromAdminId = d.FromAdminId,
            ToAdminId = d.ToAdminId,
            StartDate = d.StartDate,
            EndDate = d.EndDate,
            Status = d.Status,
            Reason = d.Reason,
            CreatedAt = d.CreatedAt
        };
    }
}
