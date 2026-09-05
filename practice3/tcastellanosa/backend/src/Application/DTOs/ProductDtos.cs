using System.ComponentModel.DataAnnotations;

namespace Application.DTOs;

public record ProductDto(Guid Id, string Name, string? Description, decimal Price, int Stock, bool IsActive, DateTime CreatedAt, Guid? CategoryId, string? CategoryName);
public record CreateProductRequest([param: Required, StringLength(150)] string Name, [param: StringLength(1000)] string? Description, [param: Range(typeof(decimal), "0.01", "999999999")] decimal Price, [param: Range(0, int.MaxValue)] int Stock, bool IsActive, Guid? CategoryId = null);
public record UpdateProductRequest([param: Required, StringLength(150)] string Name, [param: StringLength(1000)] string? Description, [param: Range(typeof(decimal), "0.01", "999999999")] decimal Price, [param: Range(0, int.MaxValue)] int Stock, bool IsActive, Guid? CategoryId = null);

public record ProductPagedResult(IEnumerable<ProductDto> Items, int TotalItems, int Page, int PageSize, int TotalPages);
