using Common.Entity;

namespace DataAccess.Repository;

public interface IDepartmentRepository
{
    Task<List<Department>> GetAllWithJobsAsync(CancellationToken cancellationToken = default);
    Task<Department?> GetByIdWithJobsAsync(int departmentId, CancellationToken cancellationToken = default);
    Task<Department?> GetByIdWithEmployeesAsync(int departmentId, CancellationToken cancellationToken = default);
    Task<Department?> FindByIdAsync(int departmentId, CancellationToken cancellationToken = default);
    Task<Department?> FindByNameAsync(string departmentName, CancellationToken cancellationToken = default);
    Task<bool> DepartmentNameExistsAsync(string departmentName, int? excludingDepartmentId = null, CancellationToken cancellationToken = default);

    Task AddAsync(Department department, CancellationToken cancellationToken = default);
    Task AddJobsAsync(IEnumerable<Job> jobs, CancellationToken cancellationToken = default);
    Task<List<Job>> GetJobsByIdsAsync(int departmentId, IEnumerable<int> jobIds, CancellationToken cancellationToken = default);

    void Remove(Department department);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
