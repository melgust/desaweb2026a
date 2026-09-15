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
    private readonly CatalogClient _catalog;

    public InvoiceService(AppDbContext db, CatalogClient catalog) { _db = db; _catalog = catalog; }

    public async Task<InvoicePagedResult> GetInvoicesAsync(string? search, string? status, int page, int pageSize, CancellationToken ct)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);
        var query = _db.Invoices.AsNoTracking().Include(i => i.Supplier).Include(i => i.Details).AsQueryable();
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
            .ToListAsync(ct);
        return new InvoicePagedResult(items.Select(ToDto), totalItems, page, pageSize, totalPages);
    }

    public async Task<InvoiceDto> GetByIdAsync(Guid id, CancellationToken ct)
    {
        var invoice = await _db.Invoices.AsNoTracking().Include(i => i.Supplier).Include(i => i.Details).FirstOrDefaultAsync(i => i.Id == id, ct)
            ?? throw new KeyNotFoundException("Invoice not found.");
        return ToDto(invoice);
    }

    public async Task<InvoiceDto> CreateAsync(CreateInvoiceRequest request, CancellationToken ct)
    {
        await ValidateRequestAsync(request.SupplierId, request.Number, null, 0, request.Tax, ct);
        ValidateDatesAndStatus(request.IssueDate, request.DueDate, request.Status);
        var details = await BuildDetailsAsync(request.Items, ct);
        var subtotal = details.Sum(d => d.Subtotal);
        var tax = Money(request.Tax);
        var invoice = new Invoice { SupplierId = request.SupplierId, Number = request.Number.Trim(), IssueDate = request.IssueDate, DueDate = request.DueDate, Subtotal = subtotal, Tax = tax, Total = subtotal + tax, Status = request.Status, Notes = request.Notes, Details = details };
        _db.Invoices.Add(invoice);
        // EF saves the header and every detail in one database transaction.
        await _db.SaveChangesAsync(ct);
        return await GetByIdAsync(invoice.Id, ct);
    }

    public async Task<InvoiceDto> UpdateAsync(Guid id, UpdateInvoiceRequest request, CancellationToken ct)
    {
        var invoice = await _db.Invoices.Include(i => i.Details).FirstOrDefaultAsync(i => i.Id == id, ct)
            ?? throw new KeyNotFoundException("Invoice not found.");
        // Editing the header preserves historical product snapshots and prices.
        var subtotal = invoice.Details.Count > 0 ? invoice.Details.Sum(d => d.Subtotal) : request.Subtotal;
        await ValidateRequestAsync(request.SupplierId, request.Number, id, subtotal, request.Tax, ct);
        ValidateDatesAndStatus(request.IssueDate, request.DueDate, request.Status);
        invoice.SupplierId = request.SupplierId;
        invoice.Number = request.Number.Trim();
        invoice.IssueDate = request.IssueDate;
        invoice.DueDate = request.DueDate;
        invoice.Subtotal = subtotal;
        invoice.Tax = Money(request.Tax);
        invoice.Total = subtotal + invoice.Tax;
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
        if (string.IsNullOrWhiteSpace(number) || number.Trim().Length > 255)
            throw new ArgumentException("Invoice number is required and cannot exceed 255 characters.");
        number = number.Trim();
        await EnsureSupplierAsync(supplierId, ct);
        if (await _db.Invoices.AnyAsync(i => i.Number == number && (!currentId.HasValue || i.Id != currentId.Value), ct))
            throw new InvalidOperationException("Invoice number is already registered.");
        if (subtotal < 0 || tax < 0 || tax > 9999999999999999.99m)
            throw new ArgumentException("Invoice amounts are invalid.");
    }

    private async Task<List<InvoiceDetail>> BuildDetailsAsync(IReadOnlyList<InvoiceItemRequest>? items, CancellationToken ct)
    {
        if (items is null || items.Count == 0) throw new ArgumentException("At least one product is required.");
        if (items.Any(i => i is null || string.IsNullOrWhiteSpace(i.ProductId) || i.ProductId.Length > 128 || i.Quantity <= 0))
            throw new ArgumentException("Each item must have a valid product ID and a positive integer quantity.");
        var details = new List<InvoiceDetail>();
        foreach (var group in items.GroupBy(i => i.ProductId.Trim()))
        {
            var quantity = group.Sum(i => (long)i.Quantity);
            if (quantity > int.MaxValue) throw new ArgumentException($"Quantity is too large for product '{group.Key}'.");
            var product = await _catalog.GetProductAsync(group.Key, ct);
            if (product.IsActive != true) throw new ArgumentException($"Product '{group.Key}' is inactive.");
            if (string.IsNullOrWhiteSpace(product.Name) || product.Name.Length > 500 || product.Price is null || product.Price < 0 || product.Price > 9999999999999999.99m)
                throw new ArgumentException($"Product '{group.Key}' has invalid catalog data.");
            if (product.Stock is null || quantity > product.Stock)
                throw new ArgumentException($"Insufficient stock for '{product.Name}'.");
            var unitPrice = Money(product.Price.Value);
            var subtotal = unitPrice * quantity;
            if (subtotal > 9999999999999999.99m) throw new ArgumentException($"Amount is too large for '{product.Name}'.");
            details.Add(new InvoiceDetail { ProductId = group.Key, ProductName = product.Name, Quantity = (int)quantity, UnitPrice = unitPrice, Subtotal = subtotal });
        }
        return details;
    }

    private async Task EnsureSupplierAsync(Guid id, CancellationToken ct)
    {
        var existing = await _db.Suppliers.FindAsync(new object[] { id }, ct);
        var catalogSupplier = await _catalog.GetSupplierAsync(id, ct);
        if (catalogSupplier is null)
        {
            // Suppliers created through the original .NET API remain supported.
            if (existing?.IsActive == true) return;
            throw new KeyNotFoundException("Active supplier not found.");
        }
        if (!catalogSupplier.IsActive) throw new ArgumentException("Supplier is inactive.");
        if (existing is not null)
        {
            if (!existing.IsActive) throw new ArgumentException("Supplier is inactive in the invoice database.");
            return;
        }
        if (await _db.Suppliers.AnyAsync(s => s.TaxId == catalogSupplier.TaxId, ct))
            throw new InvalidOperationException("Supplier tax ID is linked to a different invoice supplier.");
        // Persist the supplier reference together with the invoice, never in a separate commit.
        _db.Suppliers.Add(new Supplier { Id = id, Name = catalogSupplier.Name, TaxId = catalogSupplier.TaxId,
            Email = catalogSupplier.Email, Phone = catalogSupplier.Phone, Address = catalogSupplier.Address, IsActive = true });
    }

    private static decimal Money(decimal value) => decimal.Round(value, 2, MidpointRounding.AwayFromZero);

    private static void ValidateDatesAndStatus(DateTime issueDate, DateTime? dueDate, string status)
    {
        if (issueDate == default || dueDate < issueDate) throw new ArgumentException("Invoice dates are invalid.");
        if (status is not ("Pending" or "Paid" or "Cancelled")) throw new ArgumentException("Invoice status is invalid.");
    }

    private static InvoiceDto ToDto(Invoice invoice) => new(invoice.Id, invoice.SupplierId, invoice.Supplier.Name, invoice.Number, invoice.IssueDate, invoice.DueDate, invoice.Subtotal, invoice.Tax, invoice.Total, invoice.Status, invoice.Notes, invoice.CreatedAt,
        invoice.Details.OrderBy(d => d.ProductName).Select(d => new InvoiceDetailDto(d.Id, d.ProductId, d.ProductName, d.Quantity, d.UnitPrice, d.Subtotal)).ToList());
}
