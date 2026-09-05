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
        var query = _db.Products.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var lower = search.ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(lower) || (p.Description != null && p.Description.ToLower().Contains(lower)));
        }

        bool isDesc = sortDirection?.ToLower() == "desc";
        query = sortBy?.ToLower() switch
        {
            "price" => isDesc ? query.OrderByDescending(p => p.Price) : query.OrderBy(p => p.Price),
            "stock" => isDesc ? query.OrderByDescending(p => p.Stock) : query.OrderBy(p => p.Stock),
            "createdat" => isDesc ? query.OrderByDescending(p => p.CreatedAt) : query.OrderBy(p => p.CreatedAt),
            _ => isDesc ? query.OrderByDescending(p => p.Name) : query.OrderBy(p => p.Name),
        };

        int totalItems = await query.CountAsync(ct);
        int totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);

        var items = await query.Skip((page - 1) * pageSize).Take(pageSize)
            .Select(p => new ProductDto(p.Id, p.Name, p.Description, p.Price, p.Stock, p.IsActive, p.CreatedAt, p.CategoryId, p.Category != null ? p.Category.Name : null))
            .ToListAsync(ct);

        return new ProductPagedResult(items, totalItems, page, pageSize, totalPages);
    }

    public async Task<ProductDto> GetByIdAsync(Guid id, CancellationToken ct)
    {
        var p = await _db.Products.FindAsync(new object[] { id }, ct) ?? throw new KeyNotFoundException("Product not found.");
        return new ProductDto(p.Id, p.Name, p.Description, p.Price, p.Stock, p.IsActive, p.CreatedAt, p.CategoryId, p.Category != null ? p.Category.Name : null);
    }

    public async Task<ProductDto> CreateAsync(CreateProductRequest request, CancellationToken ct)
    {
        await ValidateCategoryAsync(request.CategoryId, ct);
        var p = new Product { Name = request.Name, Description = request.Description, Price = request.Price, Stock = request.Stock, IsActive = request.IsActive, CategoryId = request.CategoryId };
        _db.Products.Add(p);
        await _db.SaveChangesAsync(ct);
        return new ProductDto(p.Id, p.Name, p.Description, p.Price, p.Stock, p.IsActive, p.CreatedAt, p.CategoryId, p.Category != null ? p.Category.Name : null);
    }

    public async Task<ProductDto> UpdateAsync(Guid id, UpdateProductRequest request, CancellationToken ct)
    {
        var p = await _db.Products.FindAsync(new object[] { id }, ct) ?? throw new KeyNotFoundException("Product not found.");
        await ValidateCategoryAsync(request.CategoryId, ct);
        p.Name = request.Name;
        p.Description = request.Description;
        p.Price = request.Price;
        p.Stock = request.Stock;
        p.IsActive = request.IsActive;
        p.CategoryId = request.CategoryId;
        p.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return new ProductDto(p.Id, p.Name, p.Description, p.Price, p.Stock, p.IsActive, p.CreatedAt, p.CategoryId, p.Category != null ? p.Category.Name : null);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct)
    {
        var p = await _db.Products.FindAsync(new object[] { id }, ct) ?? throw new KeyNotFoundException("Product not found.");
        if (await _db.InvoiceDetails.AnyAsync(detail => detail.ProductId == id, ct)) throw new InvalidOperationException("The product cannot be deleted because it belongs to an invoice.");
        _db.Products.Remove(p);
        await _db.SaveChangesAsync(ct);
    }

    private async Task ValidateCategoryAsync(Guid? categoryId, CancellationToken ct)
    {
        if (categoryId.HasValue && !await _db.Categories.AnyAsync(c => c.Id == categoryId && c.IsActive, ct))
            throw new InvalidOperationException("The category does not exist or is inactive.");
    }
}
