using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Data.Context;
using API.DTOs;
using Common.Entity;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EmploymentContractsController : ControllerBase
    {
        private readonly HRPortalDbContext _context;
        private readonly ILogger<EmploymentContractsController> _logger;

        public EmploymentContractsController(HRPortalDbContext context, ILogger<EmploymentContractsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet("employee/{employeeId}")]
        public async Task<ActionResult<IEnumerable<EmploymentContractDto>>> GetContractsByEmployee(int employeeId)
        {
            try
            {
                var contracts = await _context.EmploymentContracts
                    .Include(c => c.Employee)
                    .Where(c => c.EmployeeId == employeeId)
                    .Select(c => new EmploymentContractDto
                    {
                        Id = c.ContractId,
                        EmployeeId = c.EmployeeId,
                        EmployeeName = c.Employee.FirstName + " " + c.Employee.LastName,
                        ContractType = c.ContractType,
                        StartDate = c.StartDate,
                        EndDate = c.EndDate,
                        Salary = c.Salary,
                        Currency = c.Currency,
                        PaymentFrequency = c.PaymentFrequency,
                        WorkingHoursPerWeek = c.WorkingHoursPerWeek,
                        Terms = c.Terms,
                        IsActive = c.IsActive,
                        DocumentPath = c.DocumentPath
                    })
                    .ToListAsync();

                return Ok(contracts);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching contracts");
                return StatusCode(500, new { message = "Error fetching contracts", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<EmploymentContractDto>> GetContract(int id)
        {
            try
            {
                var contract = await _context.EmploymentContracts
                    .Include(c => c.Employee)
                    .Where(c => c.ContractId == id)
                    .Select(c => new EmploymentContractDto
                    {
                        Id = c.ContractId,
                        EmployeeId = c.EmployeeId,
                        EmployeeName = c.Employee.FirstName + " " + c.Employee.LastName,
                        ContractType = c.ContractType,
                        StartDate = c.StartDate,
                        EndDate = c.EndDate,
                        Salary = c.Salary,
                        Currency = c.Currency,
                        PaymentFrequency = c.PaymentFrequency,
                        WorkingHoursPerWeek = c.WorkingHoursPerWeek,
                        Terms = c.Terms,
                        IsActive = c.IsActive,
                        DocumentPath = c.DocumentPath
                    })
                    .FirstOrDefaultAsync();

                if (contract == null)
                    return NotFound();

                return Ok(contract);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching contract");
                return StatusCode(500, new { message = "Error fetching contract", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<EmploymentContractDto>> CreateContract([FromBody] CreateEmploymentContractDto dto)
        {
            try
            {
                var employee = await _context.Employees.FindAsync(dto.EmployeeId);
                if (employee == null)
                    return BadRequest(new { message = "Employee not found" });

                var contract = new EmploymentContract
                {
                    EmployeeId = dto.EmployeeId,
                    ContractType = dto.ContractType,
                    StartDate = dto.StartDate,
                    EndDate = dto.EndDate,
                    Salary = dto.Salary,
                    Currency = dto.Currency ?? "USD",
                    PaymentFrequency = dto.PaymentFrequency ?? "Monthly",
                    WorkingHoursPerWeek = dto.WorkingHoursPerWeek,
                    Terms = dto.Terms,
                    DocumentPath = dto.DocumentPath,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                _context.EmploymentContracts.Add(contract);
                await _context.SaveChangesAsync();

                var result = new EmploymentContractDto
                {
                    Id = contract.ContractId,
                    EmployeeId = contract.EmployeeId,
                    EmployeeName = employee.FirstName + " " + employee.LastName,
                    ContractType = contract.ContractType,
                    StartDate = contract.StartDate,
                    EndDate = contract.EndDate,
                    Salary = contract.Salary,
                    Currency = contract.Currency,
                    PaymentFrequency = contract.PaymentFrequency,
                    WorkingHoursPerWeek = contract.WorkingHoursPerWeek,
                    Terms = contract.Terms,
                    IsActive = contract.IsActive,
                    DocumentPath = contract.DocumentPath
                };

                return CreatedAtAction(nameof(GetContract), new { id = result.Id }, result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating contract");
                return StatusCode(500, new { message = "Error creating contract", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<EmploymentContractDto>> UpdateContract(int id, [FromBody] UpdateEmploymentContractDto dto)
        {
            try
            {
                var contract = await _context.EmploymentContracts
                    .Include(c => c.Employee)
                    .FirstOrDefaultAsync(c => c.ContractId == id);

                if (contract == null)
                    return NotFound(new { message = "Contract not found" });

                contract.ContractType = dto.ContractType;
                contract.StartDate = dto.StartDate;
                contract.EndDate = dto.EndDate;
                contract.Salary = dto.Salary;
                contract.Currency = dto.Currency;
                contract.PaymentFrequency = dto.PaymentFrequency;
                contract.WorkingHoursPerWeek = dto.WorkingHoursPerWeek;
                contract.Terms = dto.Terms;
                contract.IsActive = dto.IsActive;
                contract.DocumentPath = dto.DocumentPath;
                contract.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                var result = new EmploymentContractDto
                {
                    Id = contract.ContractId,
                    EmployeeId = contract.EmployeeId,
                    EmployeeName = contract.Employee.FirstName + " " + contract.Employee.LastName,
                    ContractType = contract.ContractType,
                    StartDate = contract.StartDate,
                    EndDate = contract.EndDate,
                    Salary = contract.Salary,
                    Currency = contract.Currency,
                    PaymentFrequency = contract.PaymentFrequency,
                    WorkingHoursPerWeek = contract.WorkingHoursPerWeek,
                    Terms = contract.Terms,
                    IsActive = contract.IsActive,
                    DocumentPath = contract.DocumentPath
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating contract");
                return StatusCode(500, new { message = "Error updating contract", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteContract(int id)
        {
            try
            {
                var contract = await _context.EmploymentContracts.FindAsync(id);
                if (contract == null)
                    return NotFound(new { message = "Contract not found" });

                _context.EmploymentContracts.Remove(contract);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Contract deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting contract");
                return StatusCode(500, new { message = "Error deleting contract", error = ex.Message });
            }
        }
    }
}
