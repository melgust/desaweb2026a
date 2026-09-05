using Application.DTOs;
using Domain.Entities;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Application.Services;

public interface ISupplierService
{
    Task<SupplierPagedResult> GetSuppliersAsync(string? search, string? sortBy, string? sortDirection, int page, int pageSize, CancellationToken ct);
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

    public async Task<SupplierPagedResult> GetSuppliersAsync(string? search, string? sortBy, string? sortDirection, int page, int pageSize, CancellationToken ct)
    {
        var query = _db.Suppliers.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var lower = search.ToLower();
            query = query.Where(s => s.Name.ToLower().Contains(lower)
                || (s.ContactEmail != null && s.ContactEmail.ToLower().Contains(lower)));
        }

        bool isDesc = sortDirection?.ToLower() == "desc";
        query = sortBy?.ToLower() switch
        {
            "contactemail" => isDesc ? query.OrderByDescending(s => s.ContactEmail) : query.OrderBy(s => s.ContactEmail),
            "createdat" => isDesc ? query.OrderByDescending(s => s.CreatedAt) : query.OrderBy(s => s.CreatedAt),
            _ => isDesc ? query.OrderByDescending(s => s.Name) : query.OrderBy(s => s.Name),
        };

        int totalItems = await query.CountAsync(ct);
        int totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);

        var items = await query.Skip((page - 1) * pageSize).Take(pageSize)
            .Select(s => new SupplierDto(s.Id, s.Name, s.ContactEmail, s.Phone, s.IsActive, s.CreatedAt))
            .ToListAsync(ct);

        return new SupplierPagedResult(items, totalItems, page, pageSize, totalPages);
    }

    public async Task<IEnumerable<SupplierDto>> GetAllAsync(CancellationToken ct)
    {
        return await _db.Suppliers.AsNoTracking()
            .Where(s => s.IsActive)
            .OrderBy(s => s.Name)
            .Select(s => new SupplierDto(s.Id, s.Name, s.ContactEmail, s.Phone, s.IsActive, s.CreatedAt))
            .ToListAsync(ct);
    }

    public async Task<SupplierDto> GetByIdAsync(Guid id, CancellationToken ct)
    {
        var s = await _db.Suppliers.FindAsync(new object[] { id }, ct) ?? throw new KeyNotFoundException("Supplier not found.");
        return new SupplierDto(s.Id, s.Name, s.ContactEmail, s.Phone, s.IsActive, s.CreatedAt);
    }

    public async Task<SupplierDto> CreateAsync(CreateSupplierRequest request, CancellationToken ct)
    {
        var s = new Supplier
        {
            Name = request.Name,
            ContactEmail = request.ContactEmail,
            Phone = request.Phone,
            IsActive = request.IsActive
        };
        _db.Suppliers.Add(s);
        await _db.SaveChangesAsync(ct);
        return new SupplierDto(s.Id, s.Name, s.ContactEmail, s.Phone, s.IsActive, s.CreatedAt);
    }

    public async Task<SupplierDto> UpdateAsync(Guid id, UpdateSupplierRequest request, CancellationToken ct)
    {
        var s = await _db.Suppliers.FindAsync(new object[] { id }, ct) ?? throw new KeyNotFoundException("Supplier not found.");
        s.Name = request.Name;
        s.ContactEmail = request.ContactEmail;
        s.Phone = request.Phone;
        s.IsActive = request.IsActive;
        s.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return new SupplierDto(s.Id, s.Name, s.ContactEmail, s.Phone, s.IsActive, s.CreatedAt);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct)
    {
        var s = await _db.Suppliers.FindAsync(new object[] { id }, ct) ?? throw new KeyNotFoundException("Supplier not found.");
        _db.Suppliers.Remove(s);
        await _db.SaveChangesAsync(ct);
    }
}
