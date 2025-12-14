using Application.DTOs;
using Application.Repositories;
using Common.Entity;
using Microsoft.Extensions.Logging;

namespace Application.Services;

public sealed class CompensationChangeService : ICompensationChangeService
{
    private readonly ICompensationChangeRepository _compensationChangeRepository;
    private readonly IEmployeeRepository _employeeRepository;
    private readonly ILogger<CompensationChangeService> _logger;

    public CompensationChangeService(
        ICompensationChangeRepository compensationChangeRepository,
        IEmployeeRepository employeeRepository,
        ILogger<CompensationChangeService> logger)
    {
        _compensationChangeRepository = compensationChangeRepository;
        _employeeRepository = employeeRepository;
        _logger = logger;
    }

    public async Task<List<CompensationChangeDto>> GetChangesByEmployeeAsync(int employeeId)
    {
        var changes = await _compensationChangeRepository.GetByEmployeeIdWithEmployeeAsync(employeeId);
        return changes.Select(MapChange).ToList();
    }

    public async Task<(CompensationChangeDto? Result, string? ErrorMessage)> CreateChangeAsync(CreateCompensationChangeDto dto)
    {
        if (dto == null)
        {
            return (null, "Request body is required");
        }

        var employee = await _employeeRepository.FindByIdAsync(dto.EmployeeId);
        if (employee == null)
        {
            return (null, "Employee not found");
        }

        var changeAmount = dto.NewSalary - dto.OldSalary;
        var changePercentage = dto.OldSalary > 0 ? (changeAmount / dto.OldSalary) * 100 : 0;

        var change = new CompensationChange
        {
            EmployeeId = dto.EmployeeId,
            OldSalary = dto.OldSalary,
            NewSalary = dto.NewSalary,
            ChangeAmount = changeAmount,
            ChangePercentage = changePercentage,
            ChangeReason = dto.ChangeReason,
            EffectiveDate = dto.EffectiveDate,
            ApprovedBy = dto.ApprovedBy,
            ApprovedDate = dto.ApprovedBy.HasValue ? DateTime.UtcNow : null,
            Comments = dto.Comments ?? string.Empty,
            CreatedAt = DateTime.UtcNow
        };

        await _compensationChangeRepository.AddAsync(change);
        await _compensationChangeRepository.SaveChangesAsync();

        var result = new CompensationChangeDto
        {
            Id = change.CompensationChangeId,
            EmployeeId = change.EmployeeId,
            EmployeeName = employee.FirstName + " " + employee.LastName,
            OldSalary = change.OldSalary,
            NewSalary = change.NewSalary,
            ChangeAmount = change.ChangeAmount,
            ChangePercentage = change.ChangePercentage,
            ChangeReason = change.ChangeReason,
            EffectiveDate = change.EffectiveDate,
            ApprovedBy = change.ApprovedBy,
            ApprovedDate = change.ApprovedDate,
            Comments = change.Comments
        };

        return (result, null);
    }

    public async Task<(CompensationChangeDto? Result, string? ErrorMessage, bool NotFound)> UpdateChangeAsync(int id, UpdateCompensationChangeDto dto)
    {
        if (dto == null)
        {
            return (null, "Request body is required", false);
        }

        var change = await _compensationChangeRepository.GetByIdWithEmployeeAsync(id);
        if (change == null)
        {
            return (null, null, true);
        }

        var changeAmount = dto.NewSalary - dto.OldSalary;
        var changePercentage = dto.OldSalary > 0 ? (changeAmount / dto.OldSalary) * 100 : 0;

        change.OldSalary = dto.OldSalary;
        change.NewSalary = dto.NewSalary;
        change.ChangeAmount = changeAmount;
        change.ChangePercentage = changePercentage;
        change.ChangeReason = dto.ChangeReason;
        change.EffectiveDate = dto.EffectiveDate;
        change.ApprovedBy = dto.ApprovedBy;
        if (dto.ApprovedBy.HasValue && !change.ApprovedDate.HasValue)
        {
            change.ApprovedDate = DateTime.UtcNow;
        }
        change.Comments = dto.Comments ?? string.Empty;

        await _compensationChangeRepository.SaveChangesAsync();

        return (MapChange(change), null, false);
    }

    public async Task<(bool Success, string? ErrorMessage, bool NotFound)> DeleteChangeAsync(int id)
    {
        var change = await _compensationChangeRepository.FindByIdAsync(id);
        if (change == null)
        {
            return (false, null, true);
        }

        _compensationChangeRepository.Remove(change);
        await _compensationChangeRepository.SaveChangesAsync();

        return (true, null, false);
    }

    private static CompensationChangeDto MapChange(CompensationChange c)
    {
        return new CompensationChangeDto
        {
            Id = c.CompensationChangeId,
            EmployeeId = c.EmployeeId,
            EmployeeName = c.Employee.FirstName + " " + c.Employee.LastName,
            OldSalary = c.OldSalary,
            NewSalary = c.NewSalary,
            ChangeAmount = c.ChangeAmount,
            ChangePercentage = c.ChangePercentage,
            ChangeReason = c.ChangeReason,
            EffectiveDate = c.EffectiveDate,
            ApprovedBy = c.ApprovedBy,
            ApprovedDate = c.ApprovedDate,
            Comments = c.Comments
        };
    }
}
