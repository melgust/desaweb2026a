namespace Application.DTOs;

public record SupplierDto(Guid Id, string Name, string? TaxId, string? ContactName, string? Email, string? Phone, string? Address, bool IsActive, DateTime CreatedAt);
public record SaveSupplierRequest(string Name, string? TaxId, string? ContactName, string? Email, string? Phone, string? Address, bool IsActive);
