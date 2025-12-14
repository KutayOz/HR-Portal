using Microsoft.AspNetCore.Mvc;
using Application.DTOs;
using Application.Services;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EmploymentContractsController : ControllerBase
    {
        private readonly IEmploymentContractService _employmentContractService;

        public EmploymentContractsController(IEmploymentContractService employmentContractService)
        {
            _employmentContractService = employmentContractService;
        }

        [HttpGet("employee/{employeeId}")]
        public async Task<ActionResult<IEnumerable<EmploymentContractDto>>> GetContractsByEmployee(int employeeId)
        {
            var contracts = await _employmentContractService.GetContractsByEmployeeAsync(employeeId);
            return Ok(contracts);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<EmploymentContractDto>> GetContract(int id)
        {
            var contract = await _employmentContractService.GetContractAsync(id);

            if (contract == null)
            {
                return NotFound();
            }

            return Ok(contract);
        }

        [HttpPost]
        public async Task<ActionResult<EmploymentContractDto>> CreateContract([FromBody] CreateEmploymentContractDto dto)
        {
            var (result, error) = await _employmentContractService.CreateContractAsync(dto);

            if (result == null)
            {
                return BadRequest(new { message = error ?? "Invalid request" });
            }

            return CreatedAtAction(nameof(GetContract), new { id = result.Id }, result);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<EmploymentContractDto>> UpdateContract(int id, [FromBody] UpdateEmploymentContractDto dto)
        {
            var (result, error, notFound) = await _employmentContractService.UpdateContractAsync(id, dto);

            if (notFound)
            {
                return NotFound(new { message = "Contract not found" });
            }

            if (result == null)
            {
                return BadRequest(new { message = error ?? "Invalid request" });
            }

            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteContract(int id)
        {
            var (success, error, notFound) = await _employmentContractService.DeleteContractAsync(id);

            if (notFound)
            {
                return NotFound(new { message = "Contract not found" });
            }

            if (!success)
            {
                return BadRequest(new { message = error ?? "Unable to delete contract" });
            }

            return Ok(new { message = "Contract deleted successfully" });
        }
    }
}
