using Application.Repositories;
using Common.Entity;
using Data.Context;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.Repository;

public sealed class CandidateRepository : ICandidateRepository
{
    private readonly HRPortalDbContext _context;

    public CandidateRepository(HRPortalDbContext context)
    {
        _context = context;
    }

    public Task<List<Candidate>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return _context.Candidates.AsNoTracking().ToListAsync(cancellationToken);
    }

    public Task<List<Candidate>> GetAllForOwnerAsync(string ownerAdminId, CancellationToken cancellationToken = default)
    {
        return _context.Candidates
            .AsNoTracking()
            .Where(c => c.OwnerAdminId == ownerAdminId)
            .ToListAsync(cancellationToken);
    }

    public Task<Candidate?> FindByIdAsync(int candidateId, CancellationToken cancellationToken = default)
    {
        return _context.Candidates.FirstOrDefaultAsync(c => c.CandidateId == candidateId, cancellationToken);
    }

    public Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken = default)
    {
        return _context.Candidates.AnyAsync(c => c.Email == email, cancellationToken);
    }

    public Task AddAsync(Candidate candidate, CancellationToken cancellationToken = default)
    {
        return _context.Candidates.AddAsync(candidate, cancellationToken).AsTask();
    }

    public void Remove(Candidate candidate)
    {
        _context.Candidates.Remove(candidate);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return _context.SaveChangesAsync(cancellationToken);
    }
}
