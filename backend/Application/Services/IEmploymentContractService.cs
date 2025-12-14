using Application.DTOs;

namespace Application.Services;

public interface IEmploymentContractService
{
    Task<List<EmploymentContractDto>> GetContractsByEmployeeAsync(int employeeId);
    Task<EmploymentContractDto?> GetContractAsync(int id);

    Task<(EmploymentContractDto? Result, string? ErrorMessage)> CreateContractAsync(CreateEmploymentContractDto dto);
    Task<(EmploymentContractDto? Result, string? ErrorMessage, bool NotFound)> UpdateContractAsync(int id, UpdateEmploymentContractDto dto);
    Task<(bool Success, string? ErrorMessage, bool NotFound)> DeleteContractAsync(int id);
}
