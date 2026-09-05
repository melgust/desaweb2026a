using Application.DTOs;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Application.Services;

public interface ICategoryService
{
    Task<IEnumerable<CategoryDto>> GetAllAsync(CancellationToken ct);
}

public class CategoryService : ICategoryService
{
    private readonly AppDbContext _db;

    public CategoryService(AppDbContext db) => _db = db;

    public async Task<IEnumerable<CategoryDto>> GetAllAsync(CancellationToken ct)
    {
        return await _db.Categories
            .AsNoTracking()
            .Where(category => category.IsActive)
            .OrderBy(category => category.Name)
            .Select(category => new CategoryDto(category.Id, category.Name, category.Description, category.IsActive))
            .ToListAsync(ct);
    }
}
