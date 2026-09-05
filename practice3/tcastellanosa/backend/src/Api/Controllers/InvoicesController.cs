using Application.DTOs;
using Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController, Route("api/[controller]"), Authorize]
public class InvoicesController(IInvoiceService invoiceService) : ControllerBase
{
    [HttpGet] public async Task<ActionResult<IEnumerable<InvoiceDto>>> GetAll(CancellationToken ct) => Ok(await invoiceService.GetAllAsync(ct));
    [HttpGet("{id:guid}")] public async Task<ActionResult<InvoiceDto>> GetById(Guid id, CancellationToken ct) => Ok(await invoiceService.GetByIdAsync(id, ct));
    [HttpPost, Authorize(Roles = "Admin,Manager")] public async Task<ActionResult<InvoiceDto>> Create(CreateInvoiceRequest request, CancellationToken ct) { var result = await invoiceService.CreateAsync(request, ct); return CreatedAtAction(nameof(GetById), new { result.Id }, result); }
}
