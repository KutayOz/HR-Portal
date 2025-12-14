using Common.Entity;

namespace Application.Repositories;

public interface IAdminDelegationRepository
{
    Task<List<AdminDelegation>> GetByFromAdminAsync(string fromAdminId, CancellationToken cancellationToken = default);
    Task<List<AdminDelegation>> GetByToAdminAsync(string toAdminId, CancellationToken cancellationToken = default);
    Task<List<AdminDelegation>> GetActiveByToAdminAsync(string toAdminId, CancellationToken cancellationToken = default);
    Task<AdminDelegation?> FindByIdAsync(int delegationId, CancellationToken cancellationToken = default);
    Task AddAsync(AdminDelegation delegation, CancellationToken cancellationToken = default);
    void Remove(AdminDelegation delegation);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
