using Application.DTOs;
using Domain.Entities;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Application.Services;

public interface IInvoiceService
{
    Task<IEnumerable<InvoiceDto>> GetAllAsync(CancellationToken ct);
    Task<InvoiceDto> GetByIdAsync(Guid id, CancellationToken ct);
    Task<InvoiceDto> CreateAsync(CreateInvoiceRequest request, CancellationToken ct);
}

public class InvoiceService(AppDbContext db) : IInvoiceService
{
    public async Task<IEnumerable<InvoiceDto>> GetAllAsync(CancellationToken ct) => await InvoiceQuery().OrderByDescending(i => i.InvoiceDate).Select(ToDtoExpression()).ToListAsync(ct);
    public async Task<InvoiceDto> GetByIdAsync(Guid id, CancellationToken ct) => await InvoiceQuery().Where(i => i.Id == id).Select(ToDtoExpression()).SingleOrDefaultAsync(ct) ?? throw new KeyNotFoundException("Invoice not found.");

    public async Task<InvoiceDto> CreateAsync(CreateInvoiceRequest request, CancellationToken ct)
    {
        var details = request.Details.ToList();
        if (details.Select(d => d.ProductId).Distinct().Count() != details.Count) throw new InvalidOperationException("A product can appear only once per invoice.");
        if (!await db.Suppliers.AnyAsync(s => s.Id == request.SupplierId && s.IsActive, ct)) throw new InvalidOperationException("The supplier does not exist or is inactive.");
        if (await db.Invoices.AnyAsync(i => i.InvoiceNumber == request.InvoiceNumber.Trim(), ct)) throw new InvalidOperationException("That invoice number already exists.");
        var products = await db.Products.Where(p => details.Select(d => d.ProductId).Contains(p.Id) && p.IsActive).ToDictionaryAsync(p => p.Id, ct);
        if (products.Count != details.Count) throw new InvalidOperationException("Every invoice detail must reference an active product.");

        var invoice = new Invoice { InvoiceNumber = request.InvoiceNumber.Trim(), SupplierId = request.SupplierId, InvoiceDate = request.InvoiceDate == default ? DateTime.UtcNow : request.InvoiceDate };
        foreach (var item in details)
        {
            var product = products[item.ProductId];
            invoice.Details.Add(new InvoiceDetail { ProductId = item.ProductId, Quantity = item.Quantity, UnitPrice = item.UnitPrice, Subtotal = item.Quantity * item.UnitPrice });
            product.Stock += item.Quantity;
        }
        invoice.Total = invoice.Details.Sum(d => d.Subtotal);
        db.Invoices.Add(invoice);
        await db.SaveChangesAsync(ct);
        return await GetByIdAsync(invoice.Id, ct);
    }

    private IQueryable<Invoice> InvoiceQuery() => db.Invoices.AsNoTracking().Include(i => i.Supplier).Include(i => i.Details).ThenInclude(d => d.Product);
    private static System.Linq.Expressions.Expression<Func<Invoice, InvoiceDto>> ToDtoExpression() => i => new InvoiceDto(i.Id, i.InvoiceNumber, i.SupplierId, i.Supplier.Name, i.InvoiceDate, i.Total, i.Details.Select(d => new InvoiceDetailDto(d.Id, d.ProductId, d.Product.Name, d.Quantity, d.UnitPrice, d.Subtotal)));
}
