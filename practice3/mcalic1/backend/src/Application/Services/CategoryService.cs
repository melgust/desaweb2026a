using Application.DTOs;
using Domain.Entities;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Application.Services;

public interface ICategoryService
{
    Task<CategoryPagedResult> GetCategoriesAsync(
        string? search,
        string? sortBy,
        string? sortDirection,
        int page,
        int pageSize,
        CancellationToken ct
    );

    Task<IEnumerable<CategoryDto>> GetAllAsync(CancellationToken ct);

    Task<CategoryDto> GetByIdAsync(Guid id, CancellationToken ct);

    Task<CategoryDto> CreateAsync(
        CreateCategoryRequest request,
        CancellationToken ct
    );

    Task<CategoryDto> UpdateAsync(
        Guid id,
        UpdateCategoryRequest request,
        CancellationToken ct
    );

    Task DeleteAsync(Guid id, CancellationToken ct);
}

public class CategoryService : ICategoryService
{
    private readonly AppDbContext _db;

    public CategoryService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<CategoryPagedResult> GetCategoriesAsync(
        string? search,
        string? sortBy,
        string? sortDirection,
        int page,
        int pageSize,
        CancellationToken ct)
    {
        var query = _db.Categories
            .AsNoTracking()
            .Include(c => c.Supplier)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var lower = search.ToLower();

            query = query.Where(c =>
                c.Name.ToLower().Contains(lower) ||
                (c.Description != null &&
                 c.Description.ToLower().Contains(lower)) ||
                (c.Supplier != null &&
                 c.Supplier.Name.ToLower().Contains(lower))
            );
        }

        bool isDesc = sortDirection?.ToLower() == "desc";

        query = sortBy?.ToLower() switch
        {
            "createdat" => isDesc
                ? query.OrderByDescending(c => c.CreatedAt)
                : query.OrderBy(c => c.CreatedAt),

            "supplier" => isDesc
                ? query.OrderByDescending(c => c.Supplier!.Name)
                : query.OrderBy(c => c.Supplier!.Name),

            _ => isDesc
                ? query.OrderByDescending(c => c.Name)
                : query.OrderBy(c => c.Name)
        };

        int totalItems = await query.CountAsync(ct);

        int totalPages = (int)Math.Ceiling(
            totalItems / (double)pageSize
        );

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new CategoryDto(
                c.Id,
                c.Name,
                c.Description,
                c.IsActive,
                c.SupplierId,
                c.Supplier != null ? c.Supplier.Name : null,
                c.CreatedAt
            ))
            .ToListAsync(ct);

        return new CategoryPagedResult(
            items,
            totalItems,
            page,
            pageSize,
            totalPages
        );
    }

    public async Task<IEnumerable<CategoryDto>> GetAllAsync(
        CancellationToken ct)
    {
        return await _db.Categories
            .AsNoTracking()
            .Include(c => c.Supplier)
            .Where(c => c.IsActive)
            .OrderBy(c => c.Name)
            .Select(c => new CategoryDto(
                c.Id,
                c.Name,
                c.Description,
                c.IsActive,
                c.SupplierId,
                c.Supplier != null ? c.Supplier.Name : null,
                c.CreatedAt
            ))
            .ToListAsync(ct);
    }

    public async Task<CategoryDto> GetByIdAsync(
        Guid id,
        CancellationToken ct)
    {
        var category = await _db.Categories
            .AsNoTracking()
            .Include(c => c.Supplier)
            .FirstOrDefaultAsync(c => c.Id == id, ct)
            ?? throw new KeyNotFoundException(
                "Category not found."
            );

        return new CategoryDto(
            category.Id,
            category.Name,
            category.Description,
            category.IsActive,
            category.SupplierId,
            category.Supplier?.Name,
            category.CreatedAt
        );
    }

    public async Task<CategoryDto> CreateAsync(
        CreateCategoryRequest request,
        CancellationToken ct)
    {
        if (request.SupplierId.HasValue)
        {
            var supplierExists = await _db.Suppliers
                .AnyAsync(
                    s => s.Id == request.SupplierId.Value,
                    ct
                );

            if (!supplierExists)
            {
                throw new KeyNotFoundException(
                    "Supplier not found."
                );
            }
        }

        var category = new Category
        {
            Name = request.Name,
            Description = request.Description,
            IsActive = request.IsActive,
            SupplierId = request.SupplierId
        };

        _db.Categories.Add(category);

        await _db.SaveChangesAsync(ct);

        string? supplierName = null;

        if (category.SupplierId.HasValue)
        {
            supplierName = await _db.Suppliers
                .Where(s => s.Id == category.SupplierId.Value)
                .Select(s => s.Name)
                .FirstOrDefaultAsync(ct);
        }

        return new CategoryDto(
            category.Id,
            category.Name,
            category.Description,
            category.IsActive,
            category.SupplierId,
            supplierName,
            category.CreatedAt
        );
    }

    public async Task<CategoryDto> UpdateAsync(
        Guid id,
        UpdateCategoryRequest request,
        CancellationToken ct)
    {
        var category = await _db.Categories
            .FindAsync(new object[] { id }, ct)
            ?? throw new KeyNotFoundException(
                "Category not found."
            );

        if (request.SupplierId.HasValue)
        {
            var supplierExists = await _db.Suppliers
                .AnyAsync(
                    s => s.Id == request.SupplierId.Value,
                    ct
                );

            if (!supplierExists)
            {
                throw new KeyNotFoundException(
                    "Supplier not found."
                );
            }
        }

        category.Name = request.Name;
        category.Description = request.Description;
        category.IsActive = request.IsActive;
        category.SupplierId = request.SupplierId;
        category.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        string? supplierName = null;

        if (category.SupplierId.HasValue)
        {
            supplierName = await _db.Suppliers
                .Where(s => s.Id == category.SupplierId.Value)
                .Select(s => s.Name)
                .FirstOrDefaultAsync(ct);
        }

        return new CategoryDto(
            category.Id,
            category.Name,
            category.Description,
            category.IsActive,
            category.SupplierId,
            supplierName,
            category.CreatedAt
        );
    }

    public async Task DeleteAsync(
        Guid id,
        CancellationToken ct)
    {
        var category = await _db.Categories
            .FindAsync(new object[] { id }, ct)
            ?? throw new KeyNotFoundException(
                "Category not found."
            );

        _db.Categories.Remove(category);

        await _db.SaveChangesAsync(ct);
    }
}