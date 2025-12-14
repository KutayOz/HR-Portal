using Common.Entity;

namespace Application.Repositories;

public interface ICandidateRepository
{
    Task<List<Candidate>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<List<Candidate>> GetAllForOwnerAsync(string ownerAdminId, CancellationToken cancellationToken = default);
    Task<Candidate?> FindByIdAsync(int candidateId, CancellationToken cancellationToken = default);
    Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken = default);

    Task AddAsync(Candidate candidate, CancellationToken cancellationToken = default);
    void Remove(Candidate candidate);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
