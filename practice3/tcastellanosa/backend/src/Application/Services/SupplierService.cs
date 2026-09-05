using Application.DTOs;
using Domain.Entities;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Application.Services;

public interface ISupplierService
{
    Task<IEnumerable<SupplierDto>> GetAllAsync(CancellationToken ct);
    Task<SupplierDto> GetByIdAsync(Guid id, CancellationToken ct);
    Task<SupplierDto> CreateAsync(CreateSupplierRequest request, CancellationToken ct);
    Task<SupplierDto> UpdateAsync(Guid id, UpdateSupplierRequest request, CancellationToken ct);
    Task DeleteAsync(Guid id, CancellationToken ct);
}

public class SupplierService(AppDbContext db) : ISupplierService
{
    public async Task<IEnumerable<SupplierDto>> GetAllAsync(CancellationToken ct) => await db.Suppliers.AsNoTracking().OrderBy(s => s.Name).Select(s => ToDto(s)).ToListAsync(ct);

    public async Task<SupplierDto> GetByIdAsync(Guid id, CancellationToken ct) => ToDto(await FindAsync(id, ct));

    public async Task<SupplierDto> CreateAsync(CreateSupplierRequest request, CancellationToken ct)
    {
        if (await db.Suppliers.AnyAsync(s => s.Name == request.Name.Trim(), ct)) throw new InvalidOperationException("A supplier with that name already exists.");
        var supplier = new Supplier { Name = request.Name.Trim(), TaxId = request.TaxId?.Trim(), Email = request.Email?.Trim(), Phone = request.Phone?.Trim(), IsActive = request.IsActive };
        db.Suppliers.Add(supplier);
        await db.SaveChangesAsync(ct);
        return ToDto(supplier);
    }

    public async Task<SupplierDto> UpdateAsync(Guid id, UpdateSupplierRequest request, CancellationToken ct)
    {
        var supplier = await FindAsync(id, ct);
        if (await db.Suppliers.AnyAsync(s => s.Id != id && s.Name == request.Name.Trim(), ct)) throw new InvalidOperationException("A supplier with that name already exists.");
        supplier.Name = request.Name.Trim(); supplier.TaxId = request.TaxId?.Trim(); supplier.Email = request.Email?.Trim(); supplier.Phone = request.Phone?.Trim(); supplier.IsActive = request.IsActive;
        await db.SaveChangesAsync(ct);
        return ToDto(supplier);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct)
    {
        var supplier = await FindAsync(id, ct);
        if (await db.Invoices.AnyAsync(i => i.SupplierId == id, ct)) throw new InvalidOperationException("The supplier cannot be deleted because it has invoices.");
        db.Suppliers.Remove(supplier);
        await db.SaveChangesAsync(ct);
    }

    private async Task<Supplier> FindAsync(Guid id, CancellationToken ct) => await db.Suppliers.FindAsync([id], ct) ?? throw new KeyNotFoundException("Supplier not found.");
    private static SupplierDto ToDto(Supplier s) => new(s.Id, s.Name, s.TaxId, s.Email, s.Phone, s.IsActive, s.CreatedAt);
}
