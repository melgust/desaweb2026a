using Application.DTOs;
using Domain.Entities;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Application.Services;

public interface ISupplierService
{
    Task<IReadOnlyList<SupplierDto>> GetAllAsync(CancellationToken ct);
    Task<SupplierDto> GetByIdAsync(Guid id, CancellationToken ct);
    Task<SupplierDto> CreateAsync(SaveSupplierRequest request, CancellationToken ct);
    Task<SupplierDto> UpdateAsync(Guid id, SaveSupplierRequest request, CancellationToken ct);
    Task DeleteAsync(Guid id, CancellationToken ct);
}

public class SupplierService : ISupplierService
{
    private readonly AppDbContext _db;
    public SupplierService(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<SupplierDto>> GetAllAsync(CancellationToken ct) =>
        await _db.Suppliers.AsNoTracking().OrderBy(s => s.Name)
            .Select(s => new SupplierDto(s.Id, s.Name, s.TaxId, s.ContactName, s.Email, s.Phone, s.Address, s.IsActive, s.CreatedAt))
            .ToListAsync(ct);

    public async Task<SupplierDto> GetByIdAsync(Guid id, CancellationToken ct) =>
        ToDto(await _db.Suppliers.AsNoTracking().FirstOrDefaultAsync(s => s.Id == id, ct)
            ?? throw new KeyNotFoundException("Supplier not found."));

    public async Task<SupplierDto> CreateAsync(SaveSupplierRequest request, CancellationToken ct)
    {
        Validate(request);
        var supplier = new Supplier();
        Apply(supplier, request);
        _db.Suppliers.Add(supplier);
        await _db.SaveChangesAsync(ct);
        return ToDto(supplier);
    }

    public async Task<SupplierDto> UpdateAsync(Guid id, SaveSupplierRequest request, CancellationToken ct)
    {
        Validate(request);
        var supplier = await _db.Suppliers.FindAsync(new object[] { id }, ct)
            ?? throw new KeyNotFoundException("Supplier not found.");
        Apply(supplier, request);
        supplier.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return ToDto(supplier);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct)
    {
        var supplier = await _db.Suppliers.FindAsync(new object[] { id }, ct)
            ?? throw new KeyNotFoundException("Supplier not found.");
        if (await _db.Invoices.AnyAsync(i => i.SupplierId == id, ct))
            throw new InvalidOperationException("A supplier with invoices cannot be deleted.");
        _db.Suppliers.Remove(supplier);
        await _db.SaveChangesAsync(ct);
    }

    private static void Validate(SaveSupplierRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name)) throw new ArgumentException("Name is required.");
    }

    private static void Apply(Supplier s, SaveSupplierRequest r)
    {
        s.Name = r.Name.Trim(); s.TaxId = Clean(r.TaxId); s.ContactName = Clean(r.ContactName);
        s.Email = Clean(r.Email); s.Phone = Clean(r.Phone); s.Address = Clean(r.Address); s.IsActive = r.IsActive;
    }

    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    private static SupplierDto ToDto(Supplier s) => new(s.Id, s.Name, s.TaxId, s.ContactName, s.Email, s.Phone, s.Address, s.IsActive, s.CreatedAt);
}
