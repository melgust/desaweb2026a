using Application.DTOs;
using Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InvoicesController : ControllerBase
{
    private readonly IInvoiceService _service;
    public InvoicesController(IInvoiceService service) => _service = service;

    [HttpGet, Authorize(Roles = "Admin,Manager,User")]
    public async Task<ActionResult<IReadOnlyList<InvoiceDto>>> GetAll(CancellationToken ct) => Ok(await _service.GetAllAsync(ct));

    [HttpGet("{id:guid}"), Authorize(Roles = "Admin,Manager,User")]
    public async Task<ActionResult<InvoiceDto>> GetById(Guid id, CancellationToken ct) => Ok(await _service.GetByIdAsync(id, ct));

    [HttpPost, Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<InvoiceDto>> Create(SaveInvoiceRequest request, CancellationToken ct)
    {
        var result = await _service.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}"), Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<InvoiceDto>> Update(Guid id, SaveInvoiceRequest request, CancellationToken ct) => Ok(await _service.UpdateAsync(id, request, ct));

    [HttpPost("from-order"), Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<InvoiceDto>> CreateFromOrder(ConfirmOrderRequest request, CancellationToken ct)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        try { return Ok(await _service.CreateFromOrderAsync(userId, request, ct)); }
        catch (ArgumentException error) { return BadRequest(new { message = error.Message }); }
        catch (HttpRequestException) { return StatusCode(503, new { message = "Catalog unavailable; retry confirmation." }); }
    }

    [HttpDelete("{id:guid}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct) { await _service.DeleteAsync(id, ct); return NoContent(); }
}
