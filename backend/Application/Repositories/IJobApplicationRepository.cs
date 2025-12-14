using Common.Entity;

namespace Application.Repositories;

public interface IJobApplicationRepository
{
    Task<List<JobApplication>> GetAllWithDetailsAsync(CancellationToken cancellationToken = default);
    Task<List<JobApplication>> GetAllWithDetailsForOwnerAsync(string ownerAdminId, CancellationToken cancellationToken = default);
    Task<JobApplication?> GetByIdWithDetailsAsync(int applicationId, CancellationToken cancellationToken = default);
    Task<List<JobApplication>> GetByCandidateIdAsync(int candidateId, CancellationToken cancellationToken = default);

    Task<JobApplication?> FindByIdAsync(int applicationId, CancellationToken cancellationToken = default);
    Task AddAsync(JobApplication application, CancellationToken cancellationToken = default);
    void Remove(JobApplication application);
    void RemoveRange(IEnumerable<JobApplication> applications);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
