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
    private readonly ISupplierService _supplierService;

    public SuppliersController(ISupplierService supplierService) => _supplierService = supplierService;

    [HttpGet]
    [Authorize(Roles = "Admin,Manager,User")]
    public async Task<ActionResult<SupplierPagedResult>> GetSuppliers([FromQuery] string? search, [FromQuery] string? sortBy, [FromQuery] string? sortDirection, [FromQuery] int page = 1, [FromQuery] int pageSize = 10, CancellationToken ct = default)
    {
        return Ok(await _supplierService.GetSuppliersAsync(search, sortBy, sortDirection, page, pageSize, ct));
    }

    [HttpGet("all")]
    [Authorize(Roles = "Admin,Manager,User")]
    public async Task<ActionResult<IEnumerable<SupplierDto>>> GetAll(CancellationToken ct)
    {
        return Ok(await _supplierService.GetAllAsync(ct));
    }

    [HttpGet("{id:guid}")]
    [Authorize(Roles = "Admin,Manager,User")]
    public async Task<ActionResult<SupplierDto>> GetById(Guid id, CancellationToken ct)
    {
        return Ok(await _supplierService.GetByIdAsync(id, ct));
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<SupplierDto>> Create([FromBody] CreateSupplierRequest request, CancellationToken ct)
    {
        var created = await _supplierService.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<SupplierDto>> Update(Guid id, [FromBody] UpdateSupplierRequest request, CancellationToken ct)
    {
        return Ok(await _supplierService.UpdateAsync(id, request, ct));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _supplierService.DeleteAsync(id, ct);
        return NoContent();
    }
}
