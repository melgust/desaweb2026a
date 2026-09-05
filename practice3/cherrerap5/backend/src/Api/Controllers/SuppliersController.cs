using Application.DTOs;
using Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SuppliersController : ControllerBase
{
    private readonly ISupplierService _service;
    public SuppliersController(ISupplierService service) => _service = service;

    [HttpGet, Authorize(Roles = "Admin,Manager,User")]
    public async Task<ActionResult<IReadOnlyList<SupplierDto>>> GetAll(CancellationToken ct) => Ok(await _service.GetAllAsync(ct));

    [HttpGet("{id:guid}"), Authorize(Roles = "Admin,Manager,User")]
    public async Task<ActionResult<SupplierDto>> GetById(Guid id, CancellationToken ct) => Ok(await _service.GetByIdAsync(id, ct));

    [HttpPost, Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<SupplierDto>> Create(SaveSupplierRequest request, CancellationToken ct)
    {
        var result = await _service.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}"), Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<SupplierDto>> Update(Guid id, SaveSupplierRequest request, CancellationToken ct) => Ok(await _service.UpdateAsync(id, request, ct));

    [HttpDelete("{id:guid}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct) { await _service.DeleteAsync(id, ct); return NoContent(); }
}
