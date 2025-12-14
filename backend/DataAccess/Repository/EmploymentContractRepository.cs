using Application.Repositories;
using Common.Entity;
using Data.Context;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.Repository;

public sealed class EmploymentContractRepository : IEmploymentContractRepository
{
    private readonly HRPortalDbContext _context;

    public EmploymentContractRepository(HRPortalDbContext context)
    {
        _context = context;
    }

    public Task<List<EmploymentContract>> GetByEmployeeIdWithEmployeeAsync(int employeeId, CancellationToken cancellationToken = default)
    {
        return _context.EmploymentContracts
            .Include(c => c.Employee)
            .Where(c => c.EmployeeId == employeeId)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public Task<EmploymentContract?> GetByIdWithEmployeeAsync(int contractId, CancellationToken cancellationToken = default)
    {
        return _context.EmploymentContracts
            .Include(c => c.Employee)
            .FirstOrDefaultAsync(c => c.ContractId == contractId, cancellationToken);
    }

    public Task<EmploymentContract?> FindByIdAsync(int contractId, CancellationToken cancellationToken = default)
    {
        return _context.EmploymentContracts.FirstOrDefaultAsync(c => c.ContractId == contractId, cancellationToken);
    }

    public Task AddAsync(EmploymentContract contract, CancellationToken cancellationToken = default)
    {
        return _context.EmploymentContracts.AddAsync(contract, cancellationToken).AsTask();
    }

    public void Remove(EmploymentContract contract)
    {
        _context.EmploymentContracts.Remove(contract);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return _context.SaveChangesAsync(cancellationToken);
    }
}
