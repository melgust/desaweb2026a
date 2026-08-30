namespace Application.DTOs;

public record SupplierDto(Guid Id, string Name, string? ContactEmail, string? Phone, bool IsActive, DateTime CreatedAt);
public record CreateSupplierRequest(string Name, string? ContactEmail, string? Phone, bool IsActive);
public record UpdateSupplierRequest(string Name, string? ContactEmail, string? Phone, bool IsActive);

public record SupplierPagedResult(IEnumerable<SupplierDto> Items, int TotalItems, int Page, int PageSize, int TotalPages);
