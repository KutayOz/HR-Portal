using Common.Entity;

namespace Application.Repositories;

public interface ICompensationChangeRepository
{
    Task<List<CompensationChange>> GetByEmployeeIdWithEmployeeAsync(int employeeId, CancellationToken cancellationToken = default);
    Task<CompensationChange?> GetByIdWithEmployeeAsync(int compensationChangeId, CancellationToken cancellationToken = default);
    Task<CompensationChange?> FindByIdAsync(int compensationChangeId, CancellationToken cancellationToken = default);

    Task AddAsync(CompensationChange change, CancellationToken cancellationToken = default);
    void Remove(CompensationChange change);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
