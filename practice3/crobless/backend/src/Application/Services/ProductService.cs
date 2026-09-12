using Application.DTOs;
using Domain.Entities;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Application.Services;

public interface IProductService
{
    Task<IEnumerable<ProductDto>> GetAllAsync(CancellationToken ct);
    Task<ProductPagedResult> GetProductsAsync(string? search, string? sortBy, string? sortDirection, int page, int pageSize, CancellationToken ct);
    Task<ProductDto> GetByIdAsync(Guid id, CancellationToken ct);
    Task<ProductDto> CreateAsync(CreateProductRequest request, CancellationToken ct);
    Task<ProductDto> UpdateAsync(Guid id, UpdateProductRequest request, CancellationToken ct);
    Task DeleteAsync(Guid id, CancellationToken ct);
}

public class ProductService : IProductService
{
    private readonly AppDbContext _db;
    private readonly PurchasingClient _purchasing;
    public ProductService(AppDbContext db, PurchasingClient purchasing) { _db = db; _purchasing = purchasing; }

    private async Task<List<ProductDto>> ReadAsync(CancellationToken ct)
    {
        var suppliers = await _purchasing.SuppliersAsync(ct);
        var products = await _db.Products.AsNoTracking().Include(p => p.Category).ToListAsync(ct);
        return products.Select(p => new ProductDto(p.Id, p.Name, p.Description, p.Price, p.Stock,
            p.IsActive, p.CreatedAt,
            p.SupplierId.HasValue && suppliers.ContainsKey(p.SupplierId.Value) ? p.SupplierId : null,
            p.SupplierId.HasValue ? suppliers.GetValueOrDefault(p.SupplierId.Value)?.Name : null,
            p.CategoryId, p.Category?.Name)).ToList();
    }
    public async Task<IEnumerable<ProductDto>> GetAllAsync(CancellationToken ct) =>
        (await ReadAsync(ct)).OrderBy(p => p.Name);

    public async Task<ProductPagedResult> GetProductsAsync(string? search, string? sortBy, string? sortDirection,
        int page, int pageSize, CancellationToken ct)
    {
        if (page < 1 || pageSize < 1 || pageSize > 500) throw new ArgumentException("Paginación inválida.");
        IEnumerable<ProductDto> items = await ReadAsync(ct);
        if (!string.IsNullOrWhiteSpace(search))
            items = items.Where(p => p.Name.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                (p.Description?.Contains(search, StringComparison.OrdinalIgnoreCase) ?? false));
        Func<ProductDto, object?> key = sortBy?.ToLowerInvariant() switch
        {
            "price" => p => p.Price, "stock" => p => p.Stock, "createdat" => p => p.CreatedAt,
            "supplier" => p => p.SupplierName, "category" => p => p.CategoryName, _ => p => p.Name
        };
        items = string.Equals(sortDirection, "desc", StringComparison.OrdinalIgnoreCase)
            ? items.OrderByDescending(key) : items.OrderBy(key);
        var count = items.Count();
        var pages = (int)Math.Ceiling(count / (double)pageSize);
        return new ProductPagedResult(items.Skip((page - 1) * pageSize).Take(pageSize).ToList(), count, page, pageSize, pages, page < pages);
    }
    public async Task<ProductDto> GetByIdAsync(Guid id, CancellationToken ct) =>
        (await ReadAsync(ct)).FirstOrDefault(p => p.Id == id) ?? throw new KeyNotFoundException("Producto no encontrado.");

    private async Task ValidateReferences(Guid? supplierId, Guid? categoryId, CancellationToken ct)
    {
        if (supplierId.HasValue && !(await _purchasing.SuppliersAsync(ct)).ContainsKey(supplierId.Value))
            throw new ArgumentException("Proveedor no encontrado en el microservicio.");
        if (categoryId.HasValue && !await _db.Categories.AnyAsync(c => c.Id == categoryId, ct))
            throw new ArgumentException("Categoría no encontrada.");
    }
    public async Task<ProductDto> CreateAsync(CreateProductRequest request, CancellationToken ct)
    {
        await ValidateReferences(request.SupplierId, request.CategoryId, ct);
        var product = new Product { Name = request.Name, Description = request.Description, Price = request.Price,
            Stock = request.Stock, IsActive = request.IsActive, SupplierId = request.SupplierId, CategoryId = request.CategoryId };
        _db.Products.Add(product);
        await _db.SaveChangesAsync(ct);
        return await GetByIdAsync(product.Id, ct);
    }
    public async Task<ProductDto> UpdateAsync(Guid id, UpdateProductRequest request, CancellationToken ct)
    {
        var product = await _db.Products.FindAsync(new object[] { id }, ct) ?? throw new KeyNotFoundException("Producto no encontrado.");
        await ValidateReferences(request.SupplierId, request.CategoryId, ct);
        product.Name = request.Name; product.Description = request.Description; product.Price = request.Price;
        product.Stock = request.Stock; product.IsActive = request.IsActive; product.SupplierId = request.SupplierId;
        product.CategoryId = request.CategoryId; product.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return await GetByIdAsync(id, ct);
    }
    public async Task DeleteAsync(Guid id, CancellationToken ct)
    {
        var product = await _db.Products.FindAsync(new object[] { id }, ct) ?? throw new KeyNotFoundException("Producto no encontrado.");
        // Mongo reserves the ID first, atomically with invoice reference checks. If SQL fails,
        // keep the reservation (fail closed); retrying DELETE is safe and completes the removal.
        await _purchasing.ReserveProductDeletionAsync(id, ct);
        _db.Products.Remove(product);
        await _db.SaveChangesAsync(ct);
    }
}
