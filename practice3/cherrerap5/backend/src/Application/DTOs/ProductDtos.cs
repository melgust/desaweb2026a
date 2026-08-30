namespace Application.DTOs;

public record ProductDto(Guid Id, string Name, string? Description, decimal Price, int Stock, bool IsActive, DateTime CreatedAt, Guid? CategoryId, string? CategoryName);
public record CreateProductRequest(string Name, string? Description, decimal Price, int Stock, bool IsActive, Guid CategoryId);
public record UpdateProductRequest(string Name, string? Description, decimal Price, int Stock, bool IsActive, Guid CategoryId);

public record ProductPagedResult(IEnumerable<ProductDto> Items, int TotalItems, int Page, int PageSize, int TotalPages);
