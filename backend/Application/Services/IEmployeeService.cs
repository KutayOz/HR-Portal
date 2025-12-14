using Application.DTOs;
using Application.Infrastructure;

namespace Application.Services;

public interface IEmployeeService
{
    Task<List<EmployeeDto>> GetEmployeesAsync(OwnershipScope scope);
    Task<EmployeeDto?> GetEmployeeAsync(string id);

    Task<(EmployeeDto? Result, string? ErrorMessage)> CreateEmployeeAsync(CreateEmployeeDto dto);
    Task<(EmployeeDto? Result, string? ErrorMessage, bool NotFound)> UpdateEmployeeAsync(string id, UpdateEmployeeDto dto);
    Task<(bool Success, string? ErrorMessage, bool NotFound)> TerminateEmployeeAsync(string id);
}
