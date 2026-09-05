using Application.DTOs;
using Domain.Entities;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Application.Services;

public interface IInvoiceService
{
    Task<InvoicePagedResult> GetInvoicesAsync(string? search, string? status, int page, int pageSize, CancellationToken ct);
    Task<InvoiceDto> GetByIdAsync(Guid id, CancellationToken ct);
    Task<InvoiceDto> CreateAsync(CreateInvoiceRequest request, CancellationToken ct);
    Task<InvoiceDto> UpdateAsync(Guid id, UpdateInvoiceRequest request, CancellationToken ct);
    Task DeleteAsync(Guid id, CancellationToken ct);
}

public class InvoiceService : IInvoiceService
{
    private readonly AppDbContext _db;

    public InvoiceService(AppDbContext db) => _db = db;

    public async Task<InvoicePagedResult> GetInvoicesAsync(string? search, string? status, int page, int pageSize, CancellationToken ct)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);
        var query = _db.Invoices.AsNoTracking().Include(i => i.Supplier).AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var lower = search.ToLower();
            query = query.Where(i => i.Number.ToLower().Contains(lower) || i.Supplier.Name.ToLower().Contains(lower));
        }
        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(i => i.Status == status);
        query = query.OrderByDescending(i => i.IssueDate).ThenByDescending(i => i.Number);
        var totalItems = await query.CountAsync(ct);
        var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize)
            .Select(i => new InvoiceDto(i.Id, i.SupplierId, i.Supplier.Name, i.Number, i.IssueDate, i.DueDate, i.Subtotal, i.Tax, i.Total, i.Status, i.Notes, i.CreatedAt))
            .ToListAsync(ct);
        return new InvoicePagedResult(items, totalItems, page, pageSize, totalPages);
    }

    public async Task<InvoiceDto> GetByIdAsync(Guid id, CancellationToken ct)
    {
        var invoice = await _db.Invoices.AsNoTracking().Include(i => i.Supplier).FirstOrDefaultAsync(i => i.Id == id, ct)
            ?? throw new KeyNotFoundException("Invoice not found.");
        return ToDto(invoice);
    }

    public async Task<InvoiceDto> CreateAsync(CreateInvoiceRequest request, CancellationToken ct)
    {
        await ValidateRequestAsync(request.SupplierId, request.Number, null, request.Subtotal, request.Tax, ct);
        var invoice = new Invoice { SupplierId = request.SupplierId, Number = request.Number, IssueDate = request.IssueDate, DueDate = request.DueDate, Subtotal = request.Subtotal, Tax = request.Tax, Total = request.Subtotal + request.Tax, Status = request.Status, Notes = request.Notes };
        _db.Invoices.Add(invoice);
        await _db.SaveChangesAsync(ct);
        return await GetByIdAsync(invoice.Id, ct);
    }

    public async Task<InvoiceDto> UpdateAsync(Guid id, UpdateInvoiceRequest request, CancellationToken ct)
    {
        var invoice = await _db.Invoices.FirstOrDefaultAsync(i => i.Id == id, ct)
            ?? throw new KeyNotFoundException("Invoice not found.");
        await ValidateRequestAsync(request.SupplierId, request.Number, id, request.Subtotal, request.Tax, ct);
        invoice.SupplierId = request.SupplierId;
        invoice.Number = request.Number;
        invoice.IssueDate = request.IssueDate;
        invoice.DueDate = request.DueDate;
        invoice.Subtotal = request.Subtotal;
        invoice.Tax = request.Tax;
        invoice.Total = request.Subtotal + request.Tax;
        invoice.Status = request.Status;
        invoice.Notes = request.Notes;
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

    private async Task ValidateRequestAsync(Guid supplierId, string number, Guid? currentId, decimal subtotal, decimal tax, CancellationToken ct)
    {
        if (!await _db.Suppliers.AnyAsync(s => s.Id == supplierId && s.IsActive, ct))
            throw new KeyNotFoundException("Active supplier not found.");
        if (await _db.Invoices.AnyAsync(i => i.Number == number && (!currentId.HasValue || i.Id != currentId.Value), ct))
            throw new InvalidOperationException("Invoice number is already registered.");
        if (subtotal < 0 || tax < 0) throw new ArgumentException("Invoice amounts cannot be negative.");
    }

    private static InvoiceDto ToDto(Invoice invoice) => new(invoice.Id, invoice.SupplierId, invoice.Supplier.Name, invoice.Number, invoice.IssueDate, invoice.DueDate, invoice.Subtotal, invoice.Tax, invoice.Total, invoice.Status, invoice.Notes, invoice.CreatedAt);
}
