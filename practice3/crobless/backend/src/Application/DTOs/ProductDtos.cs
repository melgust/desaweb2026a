namespace Application.DTOs;

public record ProductDto(Guid Id, string Name, string? Description, decimal Price, int Stock, bool IsActive, DateTime CreatedAt, Guid? SupplierId, string? SupplierName);

public record CreateProductRequest(string Name, string? Description, decimal Price, int Stock, bool IsActive, Guid? SupplierId);

public record UpdateProductRequest(string Name, string? Description, decimal Price, int Stock, bool IsActive, Guid? SupplierId);

// SE AGREGA: HasMore para que Angular sepa si debe seguir pidiendo datos
public record ProductPagedResult(
    IEnumerable<ProductDto> Items, 
    int TotalItems, 
    int Page, 
    int PageSize, 
    int TotalPages,
    bool HasMore
);