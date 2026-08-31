using Application.DTOs;
using Domain.Entities;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Application.Services;

public interface ICategoryService
{
    Task<List<CategoryDto>> GetAllAsync(CancellationToken ct);
    Task<CategoryDto> GetByIdAsync(Guid id, CancellationToken ct);
    Task<CategoryDto> CreateAsync(CreateCategoryRequest request, CancellationToken ct);
    Task<CategoryDto> UpdateAsync(Guid id, UpdateCategoryRequest request, CancellationToken ct);
    Task DeleteAsync(Guid id, CancellationToken ct);
}

public class CategoryService : ICategoryService
{
    private readonly AppDbContext _db;

    public CategoryService(AppDbContext db) => _db = db;

    public async Task<List<CategoryDto>> GetAllAsync(CancellationToken ct)
    {
        return await _db.Categories.AsNoTracking()
            .OrderBy(c => c.Name)
            .Select(c => new CategoryDto(c.Id, c.Name, c.Description, c.Products.Count, c.CreatedAt))
            .ToListAsync(ct);
    }

    public async Task<CategoryDto> GetByIdAsync(Guid id, CancellationToken ct)
    {
        var c = await _db.Categories.AsNoTracking()
            .Where(c => c.Id == id)
            .Select(c => new CategoryDto(c.Id, c.Name, c.Description, c.Products.Count, c.CreatedAt))
            .FirstOrDefaultAsync(ct)
            ?? throw new KeyNotFoundException("Category not found.");

        return c;
    }

    public async Task<CategoryDto> CreateAsync(CreateCategoryRequest request, CancellationToken ct)
    {
        if (await _db.Categories.AnyAsync(c => c.Name.ToLower() == request.Name.ToLower(), ct))
            throw new InvalidOperationException("A category with that name already exists.");

        var c = new Category { Name = request.Name, Description = request.Description };
        _db.Categories.Add(c);
        await _db.SaveChangesAsync(ct);
        return new CategoryDto(c.Id, c.Name, c.Description, 0, c.CreatedAt);
    }

    public async Task<CategoryDto> UpdateAsync(Guid id, UpdateCategoryRequest request, CancellationToken ct)
    {
        var c = await _db.Categories.FindAsync(new object[] { id }, ct) ?? throw new KeyNotFoundException("Category not found.");

        if (await _db.Categories.AnyAsync(x => x.Id != id && x.Name.ToLower() == request.Name.ToLower(), ct))
            throw new InvalidOperationException("A category with that name already exists.");

        c.Name = request.Name;
        c.Description = request.Description;
        c.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        var productCount = await _db.Products.CountAsync(p => p.CategoryId == id, ct);
        return new CategoryDto(c.Id, c.Name, c.Description, productCount, c.CreatedAt);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct)
    {
        var c = await _db.Categories.FindAsync(new object[] { id }, ct) ?? throw new KeyNotFoundException("Category not found.");

        var inUse = await _db.Products.AnyAsync(p => p.CategoryId == id, ct);
        if (inUse)
            throw new InvalidOperationException("Cannot delete a category that still has products assigned to it.");

        _db.Categories.Remove(c);
        await _db.SaveChangesAsync(ct);
    }
}
