using System.ComponentModel.DataAnnotations;

namespace Application.DTOs;

public record SupplierDto(Guid Id, string Name, string? ContactEmail, string? Phone, bool IsActive, DateTime CreatedAt);
public record CreateSupplierRequest(
    [Required, StringLength(150)] string Name,
    [EmailAddress, StringLength(150)] string? ContactEmail,
    [StringLength(50)] string? Phone, bool IsActive);
public record UpdateSupplierRequest(
    [Required, StringLength(150)] string Name,
    [EmailAddress, StringLength(150)] string? ContactEmail,
    [StringLength(50)] string? Phone, bool IsActive);

public record SupplierPagedResult(IEnumerable<SupplierDto> Items, int TotalItems, int Page, int PageSize, int TotalPages);
