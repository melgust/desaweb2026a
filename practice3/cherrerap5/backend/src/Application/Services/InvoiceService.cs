using Application.DTOs;
using Domain.Entities;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Application.Services;

public interface IInvoiceService
{
    Task<IReadOnlyList<InvoiceDto>> GetAllAsync(CancellationToken ct);
    Task<InvoiceDto> GetByIdAsync(Guid id, CancellationToken ct);
    Task<InvoiceDto> CreateAsync(SaveInvoiceRequest request, CancellationToken ct);
    Task<InvoiceDto> UpdateAsync(Guid id, SaveInvoiceRequest request, CancellationToken ct);
    Task DeleteAsync(Guid id, CancellationToken ct);
}

public class InvoiceService : IInvoiceService
{
    private static readonly string[] ValidStatuses = ["Pending", "Paid", "Cancelled"];
    private readonly AppDbContext _db;
    public InvoiceService(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<InvoiceDto>> GetAllAsync(CancellationToken ct) =>
        await _db.Invoices.AsNoTracking().OrderByDescending(i => i.InvoiceDate).ThenBy(i => i.Number)
            .Select(i => new InvoiceDto(i.Id, i.Number, i.SupplierId, i.Supplier.Name, i.ProductId, i.Product.Name, i.InvoiceDate, i.DueDate, i.Quantity, i.UnitPrice, i.Total, i.Status, i.Notes, i.CreatedAt))
            .ToListAsync(ct);

    public async Task<InvoiceDto> GetByIdAsync(Guid id, CancellationToken ct) =>
        ToDto(await _db.Invoices.AsNoTracking().Include(i => i.Supplier).Include(i => i.Product)
            .FirstOrDefaultAsync(i => i.Id == id, ct) ?? throw new KeyNotFoundException("Invoice not found."));

    public async Task<InvoiceDto> CreateAsync(SaveInvoiceRequest request, CancellationToken ct)
    {
        await ValidateAsync(request, null, ct);
        var invoice = new Invoice();
        Apply(invoice, request);
        _db.Invoices.Add(invoice);
        await _db.SaveChangesAsync(ct);
        return await GetByIdAsync(invoice.Id, ct);
    }

    public async Task<InvoiceDto> UpdateAsync(Guid id, SaveInvoiceRequest request, CancellationToken ct)
    {
        await ValidateAsync(request, id, ct);
        var invoice = await _db.Invoices.FindAsync(new object[] { id }, ct)
            ?? throw new KeyNotFoundException("Invoice not found.");
        Apply(invoice, request);
        invoice.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return await GetByIdAsync(id, ct);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct)
    {
        var invoice = await _db.Invoices.FindAsync(new object[] { id }, ct)
            ?? throw new KeyNotFoundException("Invoice not found.");
        _db.Invoices.Remove(invoice);
        await _db.SaveChangesAsync(ct);
    }

    private async Task ValidateAsync(SaveInvoiceRequest r, Guid? currentId, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(r.Number)) throw new ArgumentException("Invoice number is required.");
        if (r.Quantity <= 0 || r.UnitPrice < 0) throw new ArgumentException("Quantity and unit price are invalid.");
        if (!ValidStatuses.Contains(r.Status)) throw new ArgumentException("Invalid invoice status.");
        if (!await _db.Suppliers.AnyAsync(s => s.Id == r.SupplierId && s.IsActive, ct)) throw new ArgumentException("Supplier not found or inactive.");
        if (!await _db.Products.AnyAsync(p => p.Id == r.ProductId && p.IsActive, ct)) throw new ArgumentException("Product not found or inactive.");
        if (await _db.Invoices.AnyAsync(i => i.Number == r.Number.Trim() && i.Id != currentId, ct)) throw new ArgumentException("Invoice number already exists.");
    }

    private static void Apply(Invoice i, SaveInvoiceRequest r)
    {
        i.Number = r.Number.Trim(); i.SupplierId = r.SupplierId; i.ProductId = r.ProductId;
        i.InvoiceDate = r.InvoiceDate; i.DueDate = r.DueDate; i.Quantity = r.Quantity;
        i.UnitPrice = r.UnitPrice; i.Total = r.Quantity * r.UnitPrice; i.Status = r.Status;
        i.Notes = string.IsNullOrWhiteSpace(r.Notes) ? null : r.Notes.Trim();
    }

    private static InvoiceDto ToDto(Invoice i) => new(i.Id, i.Number, i.SupplierId, i.Supplier.Name, i.ProductId, i.Product.Name, i.InvoiceDate, i.DueDate, i.Quantity, i.UnitPrice, i.Total, i.Status, i.Notes, i.CreatedAt);
}
