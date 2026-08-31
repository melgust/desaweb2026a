using Application.DTOs;
using Domain.Entities;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Application.Services;

public interface ICategoryService
{
    Task<CategoryPagedResult> GetCategoriesAsync(string? search, int page, int pageSize, CancellationToken ct);
    Task<IEnumerable<CategoryDto>> GetAllAsync(CancellationToken ct);
    Task<CategoryDto> GetByIdAsync(Guid id, CancellationToken ct);
    Task<CategoryDto> CreateAsync(CreateCategoryRequest request, CancellationToken ct);
    Task<CategoryDto> UpdateAsync(Guid id, UpdateCategoryRequest request, CancellationToken ct);
    Task DeleteAsync(Guid id, CancellationToken ct);
}

public class CategoryService : ICategoryService
{
    private readonly AppDbContext _db;

    public CategoryService(AppDbContext db) => _db = db;

    public async Task<CategoryPagedResult> GetCategoriesAsync(string? search, int page, int pageSize, CancellationToken ct)
    {
        var query = _db.Categories.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var lower = search.ToLower();
            query = query.Where(c => c.Name.ToLower().Contains(lower));
        }

        int totalItems = await query.CountAsync(ct);
        int totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);

        var items = await query.OrderBy(c => c.Name)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(c => new CategoryDto(c.Id, c.Name, c.IsActive, c.CreatedAt))
            .ToListAsync(ct);

        return new CategoryPagedResult(items, totalItems, page, pageSize, totalPages);
    }

    public async Task<IEnumerable<CategoryDto>> GetAllAsync(CancellationToken ct)
    {
        return await _db.Categories.Where(c => c.IsActive)
            .OrderBy(c => c.Name)
            .Select(c => new CategoryDto(c.Id, c.Name, c.IsActive, c.CreatedAt))
            .ToListAsync(ct);
    }

    public async Task<CategoryDto> GetByIdAsync(Guid id, CancellationToken ct)
    {
        var category = await _db.Categories.FindAsync(new object[] { id }, ct);
        if (category == null) throw new KeyNotFoundException("Categoría no encontrada");
        return new CategoryDto(category.Id, category.Name, category.IsActive, category.CreatedAt);
    }

    public async Task<CategoryDto> CreateAsync(CreateCategoryRequest request, CancellationToken ct)
    {
        var category = new Category { Name = request.Name, IsActive = request.IsActive };
        _db.Categories.Add(category);
        await _db.SaveChangesAsync(ct);
        return new CategoryDto(category.Id, category.Name, category.IsActive, category.CreatedAt);
    }

    public async Task<CategoryDto> UpdateAsync(Guid id, UpdateCategoryRequest request, CancellationToken ct)
    {
        var category = await _db.Categories.FindAsync(new object[] { id }, ct);
        if (category == null) throw new KeyNotFoundException("Categoría no encontrada");

        category.Name = request.Name;
        category.IsActive = request.IsActive;
        category.UpdatedAt = DateTime.UtcNow; // Si existe en tu entidad, si no, omite esta línea
        
        await _db.SaveChangesAsync(ct);
        return new CategoryDto(category.Id, category.Name, category.IsActive, category.CreatedAt);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct)
    {
        var category = await _db.Categories.FindAsync(new object[] { id }, ct);
        if (category == null) throw new KeyNotFoundException("Categoría no encontrada");

        // Validación: No eliminar si tiene productos asociados
        bool hasProducts = await _db.Products.AnyAsync(p => p.CategoryId == id, ct);
        if (hasProducts)
        {
            throw new InvalidOperationException("No se puede eliminar la categoría porque tiene productos asociados.");
        }

        _db.Categories.Remove(category);
        await _db.SaveChangesAsync(ct);
    }
}