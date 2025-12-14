using Application.Repositories;
using Common.Entity;
using Data.Context;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.Repository;

public sealed class JobApplicationRepository : IJobApplicationRepository
{
    private readonly HRPortalDbContext _context;

    public JobApplicationRepository(HRPortalDbContext context)
    {
        _context = context;
    }

    public Task<List<JobApplication>> GetAllWithDetailsAsync(CancellationToken cancellationToken = default)
    {
        return _context.JobApplications
            .Include(ja => ja.Candidate)
            .Include(ja => ja.Job)
            .ThenInclude(j => j.Department)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public Task<List<JobApplication>> GetAllWithDetailsForOwnerAsync(string ownerAdminId, CancellationToken cancellationToken = default)
    {
        return _context.JobApplications
            .Where(ja => ja.OwnerAdminId == ownerAdminId)
            .Include(ja => ja.Candidate)
            .Include(ja => ja.Job)
            .ThenInclude(j => j.Department)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public Task<JobApplication?> GetByIdWithDetailsAsync(int applicationId, CancellationToken cancellationToken = default)
    {
        return _context.JobApplications
            .Include(ja => ja.Candidate)
            .Include(ja => ja.Job)
            .ThenInclude(j => j.Department)
            .AsNoTracking()
            .FirstOrDefaultAsync(ja => ja.ApplicationId == applicationId, cancellationToken);
    }

    public Task<List<JobApplication>> GetByCandidateIdAsync(int candidateId, CancellationToken cancellationToken = default)
    {
        return _context.JobApplications
            .Where(ja => ja.CandidateId == candidateId)
            .ToListAsync(cancellationToken);
    }

    public Task<JobApplication?> FindByIdAsync(int applicationId, CancellationToken cancellationToken = default)
    {
        return _context.JobApplications.FirstOrDefaultAsync(ja => ja.ApplicationId == applicationId, cancellationToken);
    }

    public Task AddAsync(JobApplication application, CancellationToken cancellationToken = default)
    {
        return _context.JobApplications.AddAsync(application, cancellationToken).AsTask();
    }

    public void Remove(JobApplication application)
    {
        _context.JobApplications.Remove(application);
    }

    public void RemoveRange(IEnumerable<JobApplication> applications)
    {
        _context.JobApplications.RemoveRange(applications);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return _context.SaveChangesAsync(cancellationToken);
    }
}
