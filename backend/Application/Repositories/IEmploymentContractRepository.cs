using Common.Entity;

namespace Application.Repositories;

public interface IEmploymentContractRepository
{
    Task<List<EmploymentContract>> GetByEmployeeIdWithEmployeeAsync(int employeeId, CancellationToken cancellationToken = default);
    Task<List<EmploymentContract>> GetByEmployeeIdForUpdateAsync(int employeeId, CancellationToken cancellationToken = default);
    Task<EmploymentContract?> GetByIdWithEmployeeAsync(int contractId, CancellationToken cancellationToken = default);

    Task<EmploymentContract?> FindByIdAsync(int contractId, CancellationToken cancellationToken = default);

    Task AddAsync(EmploymentContract contract, CancellationToken cancellationToken = default);
    void Remove(EmploymentContract contract);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
