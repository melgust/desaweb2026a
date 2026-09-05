namespace Application.DTOs;

public record SupplierDto(Guid Id, string Name, string TaxId, string? Email, string? Phone, string? Address, bool IsActive, DateTime CreatedAt);
public record CreateSupplierRequest(string Name, string TaxId, string? Email, string? Phone, string? Address, bool IsActive);
public record UpdateSupplierRequest(string Name, string TaxId, string? Email, string? Phone, string? Address, bool IsActive);
