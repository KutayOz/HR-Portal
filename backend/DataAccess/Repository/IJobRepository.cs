using Common.Entity;

namespace DataAccess.Repository;

public interface IJobRepository
{
    Task<List<Job>> GetAllWithDepartmentAsync(CancellationToken cancellationToken = default);
    Task<List<Job>> GetByDepartmentIdAsync(int departmentId, CancellationToken cancellationToken = default);
    Task<Job?> GetByIdWithDepartmentAsync(int jobId, CancellationToken cancellationToken = default);
    Task<Job?> FindByIdAsync(int jobId, CancellationToken cancellationToken = default);

    Task<bool> IsJobInUseAsync(int jobId, CancellationToken cancellationToken = default);

    Task AddAsync(Job job, CancellationToken cancellationToken = default);
    void Remove(Job job);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
