using Application.DTOs;
using Application.Services;
using API.Infrastructure;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AccessRequestsController : ControllerBase
    {
        private readonly IAccessRequestService _accessRequestService;

        public AccessRequestsController(IAccessRequestService accessRequestService)
        {
            _accessRequestService = accessRequestService;
        }

        [HttpGet("inbox")]
        public async Task<ActionResult<IEnumerable<AccessRequestDto>>> GetInbox()
        {
            var adminId = AdminContext.GetAdminId(HttpContext) ?? string.Empty;
            var result = await _accessRequestService.GetInboxAsync(adminId);
            return Ok(result);
        }

        [HttpGet("outbox")]
        public async Task<ActionResult<IEnumerable<AccessRequestDto>>> GetOutbox()
        {
            var adminId = AdminContext.GetAdminId(HttpContext) ?? string.Empty;
            var result = await _accessRequestService.GetOutboxAsync(adminId);
            return Ok(result);
        }

        [HttpPost]
        public async Task<ActionResult<AccessRequestDto>> Create([FromBody] CreateAccessRequestDto dto)
        {
            var adminId = AdminContext.GetAdminId(HttpContext);
            if (string.IsNullOrWhiteSpace(adminId))
            {
                return BadRequest(new { message = "X-Admin-Id header is required" });
            }

            var (result, error, notFound) = await _accessRequestService.CreateAsync(adminId, dto);

            if (notFound)
            {
                return NotFound(new { message = error ?? "Resource not found" });
            }

            if (result == null)
            {
                return BadRequest(new { message = error ?? "Invalid request" });
            }

            return Ok(result);
        }

        [HttpPost("{id}/approve")]
        public async Task<ActionResult<AccessRequestDto>> Approve(string id, [FromBody] DecideAccessRequestDto dto)
        {
            var adminId = AdminContext.GetAdminId(HttpContext);
            if (string.IsNullOrWhiteSpace(adminId))
            {
                return BadRequest(new { message = "X-Admin-Id header is required" });
            }

            var accessRequestId = ParseAccessRequestId(id);
            if (accessRequestId == null)
            {
                return BadRequest(new { message = "Invalid access request id" });
            }

            var (result, error, notFound) = await _accessRequestService.ApproveAsync(accessRequestId.Value, adminId, dto);

            if (notFound)
            {
                return NotFound(new { message = "Access request not found" });
            }

            if (result == null)
            {
                return BadRequest(new { message = error ?? "Invalid request" });
            }

            return Ok(result);
        }

        [HttpPost("{id}/deny")]
        public async Task<ActionResult<AccessRequestDto>> Deny(string id)
        {
            var adminId = AdminContext.GetAdminId(HttpContext);
            if (string.IsNullOrWhiteSpace(adminId))
            {
                return BadRequest(new { message = "X-Admin-Id header is required" });
            }

            var accessRequestId = ParseAccessRequestId(id);
            if (accessRequestId == null)
            {
                return BadRequest(new { message = "Invalid access request id" });
            }

            var (result, error, notFound) = await _accessRequestService.DenyAsync(accessRequestId.Value, adminId);

            if (notFound)
            {
                return NotFound(new { message = "Access request not found" });
            }

            if (result == null)
            {
                return BadRequest(new { message = error ?? "Invalid request" });
            }

            return Ok(result);
        }

        private static int? ParseAccessRequestId(string id)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                return null;
            }

            if (id.StartsWith("AR-", StringComparison.OrdinalIgnoreCase))
            {
                id = id.Replace("AR-", "", StringComparison.OrdinalIgnoreCase);
            }

            return int.TryParse(id, out var parsed) ? parsed : null;
        }
    }
}
