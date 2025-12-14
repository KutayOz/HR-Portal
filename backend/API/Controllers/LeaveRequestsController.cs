using Microsoft.AspNetCore.Mvc;
using Application.DTOs;
using Application.Services;
using Application.Infrastructure;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LeaveRequestsController : ControllerBase
    {
        private readonly ILeaveRequestService _leaveRequestService;

        public LeaveRequestsController(ILeaveRequestService leaveRequestService)
        {
            _leaveRequestService = leaveRequestService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<LeaveRequestDto>>> GetLeaveRequests([FromQuery] string? scope = null)
        {
            var parsedScope = OwnershipScopeParser.Parse(scope);
            var leaveRequests = await _leaveRequestService.GetLeaveRequestsAsync(parsedScope);
            return Ok(leaveRequests);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<LeaveRequestDto>> GetLeaveRequest(string id)
        {
            var leaveRequest = await _leaveRequestService.GetLeaveRequestAsync(id);

            if (leaveRequest == null)
            {
                return NotFound();
            }

            return Ok(leaveRequest);
        }

        [HttpPost]
        public async Task<ActionResult<LeaveRequestDto>> CreateLeaveRequest([FromBody] CreateLeaveRequestDto dto)
        {
            var (result, error) = await _leaveRequestService.CreateLeaveRequestAsync(dto);

            if (result == null)
            {
                return BadRequest(new { message = error ?? "Invalid request" });
            }

            return CreatedAtAction(nameof(GetLeaveRequest), new { id = result.Id }, result);
        }

        [HttpPut("{id}/status")]
        public async Task<ActionResult<LeaveRequestDto>> UpdateLeaveStatus(string id, [FromBody] UpdateLeaveStatusDto dto)
        {
            var (result, error, notFound) = await _leaveRequestService.UpdateLeaveStatusAsync(id, dto);

            if (notFound)
            {
                return NotFound(new { message = "Leave request not found" });
            }

            if (result == null)
            {
                return BadRequest(new { message = error ?? "Invalid request" });
            }

            return Ok(result);
        }
    }
}
