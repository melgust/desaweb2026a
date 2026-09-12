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
    Task<InvoiceDto> UpdateAsync(Guid id, UpdateInvoiceRequest request, CancellationToken ct);
    Task DeleteAsync(Guid id, CancellationToken ct);
}

public class InvoiceService : IInvoiceService
{
    // Exercise policy: no tax rule has been configured. Exposed to Angular by /settings.
    public const decimal TaxRate = 0m;
    private const decimal MaxMoney = 9999999999999999.99m;
    private readonly AppDbContext _db;
    public InvoiceService(AppDbContext db) => _db = db;

    private IQueryable<Invoice> Query() => _db.Invoices.Include(i => i.Supplier)
        .Include(i => i.Items).ThenInclude(i => i.Product);

    public async Task<IEnumerable<InvoiceDto>> GetAllAsync(CancellationToken ct) =>
        (await Query().AsNoTracking().OrderByDescending(i => i.InvoiceDate)
            .ThenBy(i => i.InvoiceNumber).ToListAsync(ct)).Select(Map);

    public async Task<InvoiceDto> GetByIdAsync(Guid id, CancellationToken ct) =>
        Map(await Query().AsNoTracking().FirstOrDefaultAsync(i => i.Id == id, ct)
            ?? throw new KeyNotFoundException("Factura no encontrada."));

    public async Task<InvoiceDto> CreateAsync(CreateInvoiceRequest request, CancellationToken ct)
    {
        var invoice = new Invoice();
        await PopulateAsync(invoice, request, ct);
        _db.Invoices.Add(invoice);
        // EF saves the header and all details in one transaction.
        await _db.SaveChangesAsync(ct);
        return await GetByIdAsync(invoice.Id, ct);
    }

    public async Task<InvoiceDto> UpdateAsync(Guid id, UpdateInvoiceRequest request, CancellationToken ct)
    {
        var invoice = await _db.Invoices.Include(i => i.Items).FirstOrDefaultAsync(i => i.Id == id, ct)
            ?? throw new KeyNotFoundException("Factura no encontrada.");
        await PopulateAsync(invoice, request, ct);
        // These details have application-assigned GUIDs but are new database rows.
        _db.InvoiceDetails.AddRange(invoice.Items);
        await _db.SaveChangesAsync(ct);
        return await GetByIdAsync(id, ct);
    }

    private async Task PopulateAsync(Invoice invoice, CreateInvoiceRequest request, CancellationToken ct)
    {
        var number = request.InvoiceNumber?.Trim();
        if (string.IsNullOrWhiteSpace(number) || number.Length > 50)
            throw new ArgumentException("El número de factura es obligatorio (máximo 50 caracteres).");
        if (request.InvoiceDate < new DateOnly(1000, 1, 1))
            throw new ArgumentException("La fecha de factura no es válida.");
        if (request.Notes?.Length > 2000)
            throw new ArgumentException("Las notas admiten hasta 2000 caracteres.");
        if (request.Items == null || request.Items.Count is < 1 or > 500)
            throw new ArgumentException("La factura debe contener entre 1 y 500 detalles.");
        if (await _db.Invoices.AnyAsync(i => i.Id != invoice.Id && i.InvoiceNumber == number, ct))
            throw new ArgumentException("El número de factura ya existe.");
        if (!await _db.Suppliers.AnyAsync(s => s.Id == request.SupplierId, ct))
            throw new ArgumentException("El proveedor no existe.");
        if (request.Items.Any(i => i == null || i.Quantity <= 0 || i.UnitPrice < 0 ||
            i.UnitPrice > MaxMoney || decimal.Round(i.UnitPrice, 2) != i.UnitPrice))
            throw new ArgumentException("Cantidad positiva y precio no negativo con hasta dos decimales son obligatorios.");
        var ids = request.Items.Select(i => i.ProductId).Distinct().ToList();
        if (await _db.Products.CountAsync(p => ids.Contains(p.Id), ct) != ids.Count)
            throw new ArgumentException("Uno o más productos no existen.");
        var items = request.Items.Select(i => new InvoiceDetail
        {
            InvoiceId = invoice.Id,
            ProductId = i.ProductId, Quantity = i.Quantity, UnitPrice = i.UnitPrice,
            Subtotal = decimal.Round(i.Quantity * i.UnitPrice, 2, MidpointRounding.AwayFromZero)
        }).ToList();
        var subtotal = items.Sum(i => i.Subtotal);
        var tax = decimal.Round(subtotal * TaxRate, 2, MidpointRounding.AwayFromZero);
        if (subtotal + tax > MaxMoney)
            throw new ArgumentException("El total excede el importe máximo permitido.");
        invoice.InvoiceNumber = number;
        invoice.InvoiceDate = request.InvoiceDate;
        invoice.SupplierId = request.SupplierId;
        invoice.Notes = request.Notes?.Trim();
        invoice.Subtotal = subtotal;
        invoice.Tax = tax;
        invoice.Total = subtotal + tax;
        _db.InvoiceDetails.RemoveRange(invoice.Items);
        invoice.Items = items;
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct)
    {
        var invoice = await _db.Invoices.FindAsync(new object[] { id }, ct)
            ?? throw new KeyNotFoundException("Factura no encontrada.");
        _db.Invoices.Remove(invoice);
        await _db.SaveChangesAsync(ct);
    }

    private static InvoiceDto Map(Invoice i) => new(i.Id, i.InvoiceNumber, i.InvoiceDate,
        i.SupplierId, i.Supplier.Name, i.Subtotal, i.Tax, i.Total, i.Notes, i.CreatedAt,
        i.Items.OrderBy(d => d.Id).Select(d => new InvoiceDetailDto(d.Id, d.ProductId,
            d.Product.Name, d.Quantity, d.UnitPrice, d.Subtotal)).ToList());
}
