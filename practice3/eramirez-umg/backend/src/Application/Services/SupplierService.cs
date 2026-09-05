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

public class SupplierService : ISupplierService
{
    private readonly AppDbContext _db;

    public SupplierService(AppDbContext db) => _db = db;

    public async Task<IEnumerable<SupplierDto>> GetAllAsync(CancellationToken ct) =>
        await _db.Suppliers.AsNoTracking().OrderBy(s => s.Name)
            .Select(s => new SupplierDto(s.Id, s.Name, s.TaxId, s.Email, s.Phone, s.Address, s.IsActive, s.CreatedAt))
            .ToListAsync(ct);

    public async Task<SupplierDto> GetByIdAsync(Guid id, CancellationToken ct)
    {
        var supplier = await _db.Suppliers.AsNoTracking().FirstOrDefaultAsync(s => s.Id == id, ct)
            ?? throw new KeyNotFoundException("Supplier not found.");
        return ToDto(supplier);
    }

    public async Task<SupplierDto> CreateAsync(CreateSupplierRequest request, CancellationToken ct)
    {
        await EnsureTaxIdAvailableAsync(request.TaxId, null, ct);
        var supplier = new Supplier { Name = request.Name, TaxId = request.TaxId, Email = request.Email, Phone = request.Phone, Address = request.Address, IsActive = request.IsActive };
        _db.Suppliers.Add(supplier);
        await _db.SaveChangesAsync(ct);
        return ToDto(supplier);
    }

    public async Task<SupplierDto> UpdateAsync(Guid id, UpdateSupplierRequest request, CancellationToken ct)
    {
        var supplier = await _db.Suppliers.FirstOrDefaultAsync(s => s.Id == id, ct)
            ?? throw new KeyNotFoundException("Supplier not found.");
        await EnsureTaxIdAvailableAsync(request.TaxId, id, ct);
        supplier.Name = request.Name;
        supplier.TaxId = request.TaxId;
        supplier.Email = request.Email;
        supplier.Phone = request.Phone;
        supplier.Address = request.Address;
        supplier.IsActive = request.IsActive;
        supplier.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return ToDto(supplier);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct)
    {
        var supplier = await _db.Suppliers.FindAsync(new object[] { id }, ct)
            ?? throw new KeyNotFoundException("Supplier not found.");
        if (await _db.Invoices.AnyAsync(i => i.SupplierId == id, ct))
            throw new InvalidOperationException("Supplier has invoices and cannot be deleted.");
        _db.Suppliers.Remove(supplier);
        await _db.SaveChangesAsync(ct);
    }

    private async Task EnsureTaxIdAvailableAsync(string taxId, Guid? currentId, CancellationToken ct)
    {
        if (await _db.Suppliers.AnyAsync(s => s.TaxId == taxId && (!currentId.HasValue || s.Id != currentId.Value), ct))
            throw new InvalidOperationException("Tax ID is already registered.");
    }

    private static SupplierDto ToDto(Supplier supplier) => new(supplier.Id, supplier.Name, supplier.TaxId, supplier.Email, supplier.Phone, supplier.Address, supplier.IsActive, supplier.CreatedAt);
}
