using System.Security.Cryptography;
using System.Text;
using Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers;

[ApiController]
[Route("internal")]
[ApiExplorerSettings(IgnoreApi = true)]
public class PurchasingIntegrationController(AppDbContext db, IConfiguration config) : ControllerBase
{
    private bool Authorized()
    {
        var expected = config["Purchasing:InternalKey"];
        var actual = Request.Headers["X-Internal-Key"].ToString();
        return !string.IsNullOrEmpty(expected) && expected.Length >= 32 &&
            CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(expected), Encoding.UTF8.GetBytes(actual));
    }

    [HttpGet("products")]
    public async Task<IActionResult> Products(CancellationToken ct)
    {
        if (!Authorized()) return Unauthorized();
        return Ok(await db.Products.AsNoTracking().Select(p => new { p.Id, p.Name }).ToListAsync(ct));
    }

    [HttpDelete("suppliers/{id:guid}/product-links")]
    public async Task<IActionResult> Unlink(Guid id, CancellationToken ct)
    {
        if (!Authorized()) return Unauthorized();
        await db.Products.Where(p => p.SupplierId == id).ExecuteUpdateAsync(p => p.SetProperty(x => x.SupplierId, (Guid?)null), ct);
        return NoContent();
    }

    [HttpGet("purchasing-export")]
    public async Task<IActionResult> Export(CancellationToken ct)
    {
        if (!Authorized()) return Unauthorized();
        // Legacy tables are read-only after cutover; preserve identifiers and historical amounts.
        var suppliers = await db.Suppliers.AsNoTracking().ToListAsync(ct);
        var invoices = await db.Invoices.AsNoTracking().Include(i => i.Items).ToListAsync(ct);
        var products = await db.Products.AsNoTracking().ToDictionaryAsync(p => p.Id, p => p.Name, ct);
        var names = suppliers.ToDictionary(s => s.Id, s => s.Name);
        return Ok(new
        {
            suppliers = suppliers.Select(s => new { s.Id, s.Name, s.ContactEmail, s.Phone, s.IsActive,
                CreatedAt = DateTime.SpecifyKind(s.CreatedAt, DateTimeKind.Utc),
                UpdatedAt = DateTime.SpecifyKind(s.UpdatedAt, DateTimeKind.Utc) }),
            invoices = invoices.Select(i => new { i.Id, i.InvoiceNumber, i.InvoiceDate, i.SupplierId,
                SupplierName = names[i.SupplierId], i.Subtotal, i.Tax, i.Total, i.Notes,
                CreatedAt = DateTime.SpecifyKind(i.CreatedAt, DateTimeKind.Utc),
                Items = i.Items.Select(d => new { d.Id, d.ProductId, ProductName = products.GetValueOrDefault(d.ProductId, "Producto histórico"),
                    d.Quantity, d.UnitPrice, d.Subtotal }) })
        });
    }
}
