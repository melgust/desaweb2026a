using System.ComponentModel.DataAnnotations;

namespace Application.DTOs;

public record SupplierDto(Guid Id, string Name, string? TaxId, string? Email, string? Phone, bool IsActive, DateTime CreatedAt);
public record CreateSupplierRequest(
    [param: Required, StringLength(150)] string Name,
    [param: StringLength(30)] string? TaxId,
    [param: EmailAddress, StringLength(150)] string? Email,
    [param: StringLength(30)] string? Phone,
    bool IsActive = true);
public record UpdateSupplierRequest(
    [param: Required, StringLength(150)] string Name,
    [param: StringLength(30)] string? TaxId,
    [param: EmailAddress, StringLength(150)] string? Email,
    [param: StringLength(30)] string? Phone,
    bool IsActive = true);
