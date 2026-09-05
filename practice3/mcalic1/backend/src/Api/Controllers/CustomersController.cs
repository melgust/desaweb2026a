using Application.DTOs;
using Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CustomersController : ControllerBase
{
    private readonly ICustomerService _customerService;

    public CustomersController(ICustomerService customerService)
    {
        _customerService = customerService;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Manager,User")]
    public async Task<ActionResult<CustomerPagedResult>> GetCustomers(
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken ct = default
    )
    {
        return Ok(
            await _customerService.GetCustomersAsync(
                search,
                page,
                pageSize,
                ct
            )
        );
    }

    [HttpGet("{id:guid}")]
    [Authorize(Roles = "Admin,Manager,User")]
    public async Task<ActionResult<CustomerDto>> GetById(
        Guid id,
        CancellationToken ct
    )
    {
        return Ok(
            await _customerService.GetByIdAsync(id, ct)
        );
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<CustomerDto>> Create(
        [FromBody] CreateCustomerRequest request,
        CancellationToken ct
    )
    {
        var created = await _customerService.CreateAsync(
            request,
            ct
        );

        return CreatedAtAction(
            nameof(GetById),
            new { id = created.Id },
            created
        );
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<CustomerDto>> Update(
        Guid id,
        [FromBody] UpdateCustomerRequest request,
        CancellationToken ct
    )
    {
        return Ok(
            await _customerService.UpdateAsync(
                id,
                request,
                ct
            )
        );
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(
        Guid id,
        CancellationToken ct
    )
    {
        await _customerService.DeleteAsync(id, ct);

        return NoContent();
    }
}