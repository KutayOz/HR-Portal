using Common.Entity;

namespace Application.Repositories;

public interface IEmployeeRepository
{
    Task<List<Employee>> GetNonTerminatedWithDetailsAsync(CancellationToken cancellationToken = default);
    Task<List<Employee>> GetNonTerminatedWithDetailsForOwnerAsync(string ownerAdminId, CancellationToken cancellationToken = default);
    Task<Employee?> GetByIdWithDetailsAsync(int employeeId, CancellationToken cancellationToken = default);

    Task<Employee?> FindByIdAsync(int employeeId, CancellationToken cancellationToken = default);
    Task<bool> EmailExistsAsync(string email, int? excludingEmployeeId = null, CancellationToken cancellationToken = default);

    Task AddAsync(Employee employee, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
