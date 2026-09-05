using Application.DTOs;
using Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController, Route("api/[controller]"), Authorize]
public class SuppliersController(ISupplierService supplierService) : ControllerBase
{
    [HttpGet] public async Task<ActionResult<IEnumerable<SupplierDto>>> GetAll(CancellationToken ct) => Ok(await supplierService.GetAllAsync(ct));
    [HttpGet("{id:guid}")] public async Task<ActionResult<SupplierDto>> GetById(Guid id, CancellationToken ct) => Ok(await supplierService.GetByIdAsync(id, ct));
    [HttpPost, Authorize(Roles = "Admin,Manager")] public async Task<ActionResult<SupplierDto>> Create(CreateSupplierRequest request, CancellationToken ct) { var result = await supplierService.CreateAsync(request, ct); return CreatedAtAction(nameof(GetById), new { result.Id }, result); }
    [HttpPut("{id:guid}"), Authorize(Roles = "Admin,Manager")] public async Task<ActionResult<SupplierDto>> Update(Guid id, UpdateSupplierRequest request, CancellationToken ct) => Ok(await supplierService.UpdateAsync(id, request, ct));
    [HttpDelete("{id:guid}"), Authorize(Roles = "Admin")] public async Task<IActionResult> Delete(Guid id, CancellationToken ct) { await supplierService.DeleteAsync(id, ct); return NoContent(); }
}
