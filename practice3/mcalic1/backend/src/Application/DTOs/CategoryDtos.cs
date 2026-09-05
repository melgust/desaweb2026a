namespace Application.DTOs;

public record CategoryDto(
    Guid Id,
    string Name,
    string? Description,
    bool IsActive,
    Guid? SupplierId,
    string? SupplierName,
    DateTime CreatedAt
);

public record CreateCategoryRequest(
    string Name,
    string? Description,
    bool IsActive,
    Guid? SupplierId
);

public record UpdateCategoryRequest(
    string Name,
    string? Description,
    bool IsActive,
    Guid? SupplierId
);

public record CategoryPagedResult(
    IEnumerable<CategoryDto> Items,
    int TotalItems,
    int Page,
    int PageSize,
    int TotalPages
);