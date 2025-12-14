using Application.DTOs;

namespace Application.Services;

public interface ICompensationChangeService
{
    Task<List<CompensationChangeDto>> GetChangesByEmployeeAsync(int employeeId);
    Task<(CompensationChangeDto? Result, string? ErrorMessage)> CreateChangeAsync(CreateCompensationChangeDto dto);
    Task<(CompensationChangeDto? Result, string? ErrorMessage, bool NotFound)> UpdateChangeAsync(int id, UpdateCompensationChangeDto dto);
    Task<(bool Success, string? ErrorMessage, bool NotFound)> DeleteChangeAsync(int id);
}
