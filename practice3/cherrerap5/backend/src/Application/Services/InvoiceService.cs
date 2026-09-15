using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
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
    Task<InvoiceDto> CreateFromOrderAsync(string userId, ConfirmOrderRequest request, CancellationToken ct);
    Task<InvoiceDto> UpdateAsync(Guid id, SaveInvoiceRequest request, CancellationToken ct);
    Task DeleteAsync(Guid id, CancellationToken ct);
}

public class InvoiceService(AppDbContext db, ICatalogClient catalog) : IInvoiceService
{
    private static readonly string[] ValidStatuses = ["Pending", "Paid", "Cancelled"];

    public async Task<IReadOnlyList<InvoiceDto>> GetAllAsync(CancellationToken ct) =>
        (await db.Invoices.AsNoTracking().Include(i => i.Items).Where(i => !i.IsDeleted)
            .OrderByDescending(i => i.InvoiceDate).ThenBy(i => i.Number).ToListAsync(ct)).Select(ToDto).ToList();

    public async Task<InvoiceDto> GetByIdAsync(Guid id, CancellationToken ct) =>
        ToDto(await db.Invoices.AsNoTracking().Include(i => i.Items)
            .FirstOrDefaultAsync(i => i.Id == id && !i.IsDeleted, ct) ?? throw new KeyNotFoundException("Invoice not found."));

    public async Task<InvoiceDto> CreateAsync(SaveInvoiceRequest request, CancellationToken ct)
    {
        await ValidateHeaderAsync(request, null, ct);
        var items = await BuildItemsAsync(request.Items, false, ct);
        var invoice = new Invoice();
        Apply(invoice, request, items);
        db.Invoices.Add(invoice);
        // EF commits the header and all lines in one transaction.
        await db.SaveChangesAsync(ct);
        return ToDto(invoice);
    }

    public async Task<InvoiceDto> UpdateAsync(Guid id, SaveInvoiceRequest request, CancellationToken ct)
    {
        var invoice = await db.Invoices.Include(i => i.Items).FirstOrDefaultAsync(i => i.Id == id && !i.IsDeleted, ct)
            ?? throw new KeyNotFoundException("Invoice not found.");
        await ValidateHeaderAsync(request, id, ct);
        var items = await BuildItemsAsync(request.Items, false, ct);
        db.InvoiceItems.RemoveRange(invoice.Items);
        foreach (var item in items) item.InvoiceId = invoice.Id;
        db.InvoiceItems.AddRange(items);
        Apply(invoice, request, items);
        invoice.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return ToDto(invoice);
    }

    public async Task<InvoiceDto> CreateFromOrderAsync(string userId, ConfirmOrderRequest request, CancellationToken ct)
    {
        if (request.OrderId == Guid.Empty || request.Items is null || request.Items.Count is < 1 or > 100)
            throw new ArgumentException("An order must contain between 1 and 100 items.");
        if (request.Items.Any(i => i is null)) throw new ArgumentException("Invalid order line.");
        var key = Hash($"{userId}:{request.OrderId}");
        var fingerprint = Hash(JsonSerializer.Serialize(request.Items.OrderBy(i => i.ProductId).ThenBy(i => i.SupplierId)));
        var existing = await FindSourceAsync(key, ct);
        if (existing is not null) return Replay(existing, fingerprint);

        var lines = request.Items.Select(i => new SaveInvoiceItemRequest(i.ProductId, i.SupplierId, i.Quantity, 0)).ToList();
        // The public endpoint derives prices from Catalog; a client cannot forge a checkout price.
        var items = await BuildItemsAsync(lines, true, ct);
        var invoice = new Invoice { SourceOrderKey = key, SourceOrderFingerprint = fingerprint };
        Apply(invoice, new SaveInvoiceRequest($"ORD-{request.OrderId:N}", DateTime.UtcNow, null, lines, "Pending", null), items);
        // Include the user in the number as well as in the idempotency key.
        invoice.Number = $"ORD-{key}";
        db.Invoices.Add(invoice);
        try { await db.SaveChangesAsync(ct); }
        catch (DbUpdateException)
        {
            db.ChangeTracker.Clear();
            existing = await FindSourceAsync(key, ct);
            if (existing is not null) return Replay(existing, fingerprint);
            throw;
        }
        return ToDto(invoice);
    }

    private Task<Invoice?> FindSourceAsync(string key, CancellationToken ct) =>
        db.Invoices.AsNoTracking().Include(i => i.Items).FirstOrDefaultAsync(i => i.SourceOrderKey == key, ct);

    private static InvoiceDto Replay(Invoice invoice, string fingerprint)
    {
        if (invoice.IsDeleted) throw new InvalidOperationException("This order was confirmed and its invoice was deleted.");
        if (invoice.SourceOrderFingerprint != fingerprint) throw new InvalidOperationException("Order already confirmed with different items.");
        return ToDto(invoice);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct)
    {
        var invoice = await db.Invoices.FirstOrDefaultAsync(i => i.Id == id && !i.IsDeleted, ct)
            ?? throw new KeyNotFoundException("Invoice not found.");
        // Retain the durable idempotency marker even after a user deletes a confirmed invoice.
        if (invoice.SourceOrderKey is not null) invoice.IsDeleted = true;
        else db.Invoices.Remove(invoice);
        await db.SaveChangesAsync(ct);
    }

    private async Task ValidateHeaderAsync(SaveInvoiceRequest request, Guid? currentId, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Number) || request.Number.Trim().Length > 255)
            throw new ArgumentException("Invoice number is required (max 255 characters).");
        if (!ValidStatuses.Contains(request.Status)) throw new ArgumentException("Invalid invoice status.");
        if (request.InvoiceDate == default || request.DueDate < request.InvoiceDate)
            throw new ArgumentException("Invalid invoice dates.");
        if (await db.Invoices.AnyAsync(i => i.Number == request.Number.Trim() && i.Id != currentId, ct))
            throw new ArgumentException("Invoice number already exists.");
    }

    private async Task<List<InvoiceItem>> BuildItemsAsync(IReadOnlyList<SaveInvoiceItemRequest> lines, bool catalogPrices, CancellationToken ct)
    {
        if (lines is null || lines.Count is < 1 or > 100) throw new ArgumentException("Invoice requires 1 to 100 lines.");
        if (lines.Any(i => i is null)) throw new ArgumentException("Invalid invoice line.");
        if (lines.Select(i => i.ProductId).Distinct().Count() != lines.Count) throw new ArgumentException("Combine duplicate products in one line.");
        var result = new List<InvoiceItem>();
        foreach (var line in lines)
        {
            if (line.Quantity is < 1 or > 100000 || line.UnitPrice < 0 || line.UnitPrice > 100000000)
                throw new ArgumentException("Invalid quantity or price.");
            if (!IsCatalogId(line.ProductId) || !IsCatalogId(line.SupplierId))
                throw new ArgumentException("Invalid catalog identifier.");
            var product = await catalog.GetActiveProductAsync(line.ProductId!, ct);
            var supplier = await catalog.GetActiveSupplierAsync(line.SupplierId!, ct);
            var price = catalogPrices ? product.Price ?? throw new HttpRequestException("Catalog product price missing.") : line.UnitPrice;
            if (price < 0 || price > 100000000) throw new ArgumentException("Invalid catalog price.");
            price = decimal.Round(price, 2, MidpointRounding.AwayFromZero);
            result.Add(new InvoiceItem { Position = result.Count, ProductId = product.Id, ProductName = product.Name,
                SupplierId = supplier.Id, SupplierName = supplier.Name, Quantity = line.Quantity,
                UnitPrice = price, Subtotal = price * line.Quantity });
        }
        if (result.Sum(i => i.Subtotal) > 90071992547409m) throw new ArgumentException("Invoice total exceeds the supported limit.");
        return result;
    }

    private static void Apply(Invoice invoice, SaveInvoiceRequest request, List<InvoiceItem> items)
    {
        invoice.Number = request.Number.Trim(); invoice.InvoiceDate = request.InvoiceDate; invoice.DueDate = request.DueDate;
        invoice.Status = request.Status; invoice.Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim();
        invoice.Items = items; invoice.Total = items.Sum(i => i.Subtotal);
    }
    private static string Hash(string text) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(text)));
    private static bool IsCatalogId(string? id) => Guid.TryParseExact(id, "D", out _) ||
        System.Text.RegularExpressions.Regex.IsMatch(id ?? "", "^[a-fA-F0-9]{24}$");
    private static InvoiceDto ToDto(Invoice invoice) => new(invoice.Id, invoice.Number, invoice.InvoiceDate, invoice.DueDate,
        invoice.Items.OrderBy(i => i.Position).Select(i => new InvoiceItemDto(i.Id, i.ProductId, i.ProductName, i.SupplierId, i.SupplierName, i.Quantity, i.UnitPrice, i.Subtotal)).ToList(),
        invoice.Total, invoice.Total, invoice.Status, invoice.Notes, invoice.CreatedAt);
}
