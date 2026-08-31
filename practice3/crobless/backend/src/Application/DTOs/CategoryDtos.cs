namespace Application.DTOs;

public record CategoryDto(Guid Id, string Name, bool IsActive, DateTime CreatedAt);
public record CreateCategoryRequest(string Name, bool IsActive);
public record UpdateCategoryRequest(string Name, bool IsActive);
public record CategoryPagedResult(IEnumerable<CategoryDto> Items, int TotalItems, int Page, int PageSize, int TotalPages);