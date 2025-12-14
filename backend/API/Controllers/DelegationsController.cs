using Application.DTOs;
using Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DelegationsController : ControllerBase
{
    private readonly IAdminDelegationService _delegationService;

    public DelegationsController(IAdminDelegationService delegationService)
    {
        _delegationService = delegationService;
    }

    [HttpGet("outgoing")]
    public async Task<ActionResult<List<AdminDelegationDto>>> GetMyDelegations()
    {
        var delegations = await _delegationService.GetMyDelegationsAsync();
        return Ok(delegations);
    }

    [HttpGet("incoming")]
    public async Task<ActionResult<List<AdminDelegationDto>>> GetDelegationsToMe()
    {
        var delegations = await _delegationService.GetDelegationsToMeAsync();
        return Ok(delegations);
    }

    [HttpGet("delegated-admins")]
    public async Task<ActionResult<List<string>>> GetDelegatedAdminIds()
    {
        var adminIds = await _delegationService.GetDelegatedAdminIdsAsync();
        return Ok(adminIds);
    }

    [HttpPost]
    public async Task<ActionResult<AdminDelegationDto>> CreateDelegation([FromBody] CreateDelegationDto dto)
    {
        var (result, error) = await _delegationService.CreateDelegationAsync(dto);
        if (error != null)
        {
            return BadRequest(new { error });
        }
        return Ok(result);
    }

    [HttpPost("{id}/revoke")]
    public async Task<IActionResult> RevokeDelegation(int id)
    {
        var (success, error) = await _delegationService.RevokeDelegationAsync(id);
        if (!success)
        {
            return BadRequest(new { error });
        }
        return Ok(new { message = "Delegation revoked" });
    }
}
