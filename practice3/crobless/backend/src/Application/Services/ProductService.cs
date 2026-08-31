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

        // 1. Filtro de búsqueda
        if (!string.IsNullOrWhiteSpace(search))
        {
            var lower = search.ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(lower) || (p.Description != null && p.Description.ToLower().Contains(lower)));
        }

        // 2. Ordenamiento
        bool isDesc = sortDirection?.ToLower() == "desc";

        query = sortBy?.ToLower() switch
        {
            "price" => isDesc ? query.OrderByDescending(p => p.Price) : query.OrderBy(p => p.Price),
            "stock" => isDesc ? query.OrderByDescending(p => p.Stock) : query.OrderBy(p => p.Stock),
            "createdat" => isDesc ? query.OrderByDescending(p => p.CreatedAt) : query.OrderBy(p => p.CreatedAt),
            "supplier" => isDesc ? query.OrderByDescending(p => p.Supplier!.Name) : query.OrderBy(p => p.Supplier!.Name),
            "category" => isDesc ? query.OrderByDescending(p => p.Category!.Name) : query.OrderBy(p => p.Category!.Name), // <-- AGREGADO: Ordenar por categoría
            _ => isDesc ? query.OrderByDescending(p => p.Name) : query.OrderBy(p => p.Name),
        };

        // 3. Cálculos de paginación
        int totalItems = await query.CountAsync(ct);
        int totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);
        bool hasMore = page < totalPages; // <-- AGREGADO: Para el Scroll Infinito

        // 4. Proyección a DTO (EF Core traduce esto a un LEFT JOIN automático en MySQL)
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize)
            .Select(p => new ProductDto(
                p.Id, 
                p.Name, 
                p.Description, 
                p.Price, 
                p.Stock, 
                p.IsActive, 
                p.CreatedAt, 
                p.SupplierId, 
                p.Supplier != null ? p.Supplier.Name : null,
                p.CategoryId,          // <-- AGREGADO
                p.Category != null ? p.Category.Name : null // <-- AGREGADO
            ))
            .ToListAsync(ct);

        return new ProductPagedResult(items, totalItems, page, pageSize, totalPages, hasMore);
    }

    public async Task<ProductDto> GetByIdAsync(Guid id, CancellationToken ct)
    {
        var product = await _db.Products
            .Include(p => p.Supplier)
            .Include(p => p.Category) // <-- AGREGADO
            .FirstOrDefaultAsync(p => p.Id == id, ct);

        if (product == null)
            throw new KeyNotFoundException("Producto no encontrado");

        return new ProductDto(
            product.Id, product.Name, product.Description, product.Price, product.Stock, product.IsActive, product.CreatedAt,
            product.SupplierId, product.Supplier?.Name,
            product.CategoryId, product.Category?.Name // <-- AGREGADO
        );
    }

    public async Task<ProductDto> CreateAsync(CreateProductRequest request, CancellationToken ct)
    {
        var product = new Product
        {
            Name = request.Name,
            Description = request.Description,
            Price = request.Price,
            Stock = request.Stock,
            IsActive = request.IsActive,
            SupplierId = request.SupplierId,
            CategoryId = request.CategoryId // <-- AGREGADO
        };

        _db.Products.Add(product);
        await _db.SaveChangesAsync(ct);

        // Recargar con relaciones para devolver el DTO completo
        var created = await _db.Products
            .Include(p => p.Supplier)
            .Include(p => p.Category) // <-- AGREGADO
            .FirstOrDefaultAsync(p => p.Id == product.Id, ct);

        return new ProductDto(
            created!.Id, created.Name, created.Description, created.Price, created.Stock, created.IsActive, created.CreatedAt,
            created.SupplierId, created.Supplier?.Name,
            created.CategoryId, created.Category?.Name // <-- AGREGADO
        );
    }

    public async Task<ProductDto> UpdateAsync(Guid id, UpdateProductRequest request, CancellationToken ct)
    {
        var product = await _db.Products.FindAsync(new object[] { id }, ct);
        if (product == null)
            throw new KeyNotFoundException("Producto no encontrado");

        product.Name = request.Name;
        product.Description = request.Description;
        product.Price = request.Price;
        product.Stock = request.Stock;
        product.IsActive = request.IsActive;
        product.SupplierId = request.SupplierId;
        product.CategoryId = request.CategoryId; // <-- AGREGADO
        product.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        // Recargar con relaciones para devolver el DTO actualizado
        var updated = await _db.Products
            .Include(p => p.Supplier)
            .Include(p => p.Category) // <-- AGREGADO
            .FirstOrDefaultAsync(p => p.Id == id, ct);

        return new ProductDto(
            updated!.Id, updated.Name, updated.Description, updated.Price, updated.Stock, updated.IsActive, updated.CreatedAt,
            updated.SupplierId, updated.Supplier?.Name,
            updated.CategoryId, updated.Category?.Name // <-- AGREGADO
        );
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct)
    {
        var product = await _db.Products.FindAsync(new object[] { id }, ct);
        if (product == null)
            throw new KeyNotFoundException("Producto no encontrado");

        _db.Products.Remove(product);
        await _db.SaveChangesAsync(ct);
    }
}