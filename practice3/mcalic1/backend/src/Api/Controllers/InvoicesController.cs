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
    private readonly IInvoiceService _invoiceService;

    public InvoicesController(IInvoiceService invoiceService)
    {
        _invoiceService = invoiceService;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Manager,User")]
    public async Task<ActionResult<InvoicePagedResult>> GetInvoices(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken ct = default
    )
    {
        return Ok(
            await _invoiceService.GetInvoicesAsync(
                page,
                pageSize,
                ct
            )
        );
    }

    [HttpGet("{id:guid}")]
    [Authorize(Roles = "Admin,Manager,User")]
    public async Task<ActionResult<InvoiceDto>> GetById(
        Guid id,
        CancellationToken ct
    )
    {
        return Ok(
            await _invoiceService.GetByIdAsync(
                id,
                ct
            )
        );
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<InvoiceDto>> Create(
        [FromBody] CreateInvoiceRequest request,
        CancellationToken ct
    )
    {
        var created = await _invoiceService.CreateAsync(
            request,
            ct
        );

        return CreatedAtAction(
            nameof(GetById),
            new { id = created.Id },
            created
        );
    }
}