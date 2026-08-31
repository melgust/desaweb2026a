using Application.DTOs;
using Domain.Entities;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Application.Services;

public interface IProductService
{
    Task<ProductPagedResult> GetProductsAsync(string? search, string? sortBy, string? sortDirection, int page, int pageSize, CancellationToken ct);
    Task<ProductDto> GetByIdAsync(Guid id, CancellationToken ct);
    Task<ProductDto> CreateAsync(CreateProductRequest request, CancellationToken ct);
    Task<ProductDto> UpdateAsync(Guid id, UpdateProductRequest request, CancellationToken ct);
    Task DeleteAsync(Guid id, CancellationToken ct);
}

public class ProductService : IProductService
{
    private readonly AppDbContext _db;

    public ProductService(AppDbContext db) => _db = db;

    public async Task<ProductPagedResult> GetProductsAsync(string? search, string? sortBy, string? sortDirection, int page, int pageSize, CancellationToken ct)
    {
        var query = _db.Products.AsNoTracking().Include(p => p.Category);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var lower = search.ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(lower) || (p.Description != null && p.Description.ToLower().Contains(lower)) || (p.Category != null && p.Category.Name.ToLower().Contains(lower)));
        }

        bool isDesc = sortDirection?.ToLower() == "desc";
        query = sortBy?.ToLower() switch
        {
            "price" => isDesc ? query.OrderByDescending(p => p.Price) : query.OrderBy(p => p.Price),
            "stock" => isDesc ? query.OrderByDescending(p => p.Stock) : query.OrderBy(p => p.Stock),
            "category" => isDesc ? query.OrderByDescending(p => p.Category != null ? p.Category.Name : "") : query.OrderBy(p => p.Category != null ? p.Category.Name : ""),
            "createdat" => isDesc ? query.OrderByDescending(p => p.CreatedAt) : query.OrderBy(p => p.CreatedAt),
            _ => isDesc ? query.OrderByDescending(p => p.Name) : query.OrderBy(p => p.Name),
        };

        int totalItems = await query.CountAsync(ct);
        int totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);

        var items = await query.Skip((page - 1) * pageSize).Take(pageSize)
            .Select(p => new ProductDto(p.Id, p.Name, p.Description, p.Price, p.Stock, p.IsActive, p.CreatedAt, p.Category != null ? p.Category.Name : null))
            .ToListAsync(ct);

        return new ProductPagedResult(items, totalItems, page, pageSize, totalPages);
    }

    public async Task<ProductDto> GetByIdAsync(Guid id, CancellationToken ct)
    {
        var p = await _db.Products.AsNoTracking().Include(p => p.Category).FirstOrDefaultAsync(x => x.Id == id, ct) ?? throw new KeyNotFoundException("Product not found.");
        return new ProductDto(p.Id, p.Name, p.Description, p.Price, p.Stock, p.IsActive, p.CreatedAt, p.Category != null ? p.Category.Name : null);
    }

    public async Task<ProductDto> CreateAsync(CreateProductRequest request, CancellationToken ct)
    {
        if (request.CategoryId.HasValue)
        {
            var categoryExists = await _db.Categories.AnyAsync(c => c.Id == request.CategoryId.Value, ct);
            if (!categoryExists)
            {
                throw new KeyNotFoundException("Category not found.");
            }
        }

        var p = new Product { Name = request.Name, Description = request.Description, Price = request.Price, Stock = request.Stock, IsActive = request.IsActive, CategoryId = request.CategoryId };
        _db.Products.Add(p);
        await _db.SaveChangesAsync(ct);
        var created = await _db.Products.Include(x => x.Category).FirstAsync(x => x.Id == p.Id, ct);
        return new ProductDto(created.Id, created.Name, created.Description, created.Price, created.Stock, created.IsActive, created.CreatedAt, created.Category != null ? created.Category.Name : null);
    }

    public async Task<ProductDto> UpdateAsync(Guid id, UpdateProductRequest request, CancellationToken ct)
    {
        var p = await _db.Products.FirstOrDefaultAsync(x => x.Id == id, ct) ?? throw new KeyNotFoundException("Product not found.");

        if (request.CategoryId.HasValue)
        {
            var categoryExists = await _db.Categories.AnyAsync(c => c.Id == request.CategoryId.Value, ct);
            if (!categoryExists)
            {
                throw new KeyNotFoundException("Category not found.");
            }
        }

        p.Name = request.Name;
        p.Description = request.Description;
        p.Price = request.Price;
        p.Stock = request.Stock;
        p.IsActive = request.IsActive;
        p.CategoryId = request.CategoryId;
        p.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        var updated = await _db.Products.Include(x => x.Category).FirstAsync(x => x.Id == id, ct);
        return new ProductDto(updated.Id, updated.Name, updated.Description, updated.Price, updated.Stock, updated.IsActive, updated.CreatedAt, updated.Category != null ? updated.Category.Name : null);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct)
    {
        var p = await _db.Products.FindAsync(new object[] { id }, ct) ?? throw new KeyNotFoundException("Product not found.");
        _db.Products.Remove(p);
        await _db.SaveChangesAsync(ct);
    }
}