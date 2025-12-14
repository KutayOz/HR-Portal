using Application.DTOs;
using Application.Infrastructure;

namespace Application.Services;

public interface IDepartmentService
{
    Task<List<DepartmentDto>> GetDepartmentsAsync(OwnershipScope scope);
    Task<DepartmentDto?> GetDepartmentAsync(string id);
    Task<(DepartmentDto? Result, string? ErrorMessage)> CreateDepartmentAsync(CreateDepartmentDto dto);
    Task<(DepartmentDto? Result, string? ErrorMessage, bool NotFound)> UpdateDepartmentAsync(string id, UpdateDepartmentDto dto);
    Task<(bool Success, string? ErrorMessage, bool NotFound)> DeleteDepartmentAsync(string id);
}
