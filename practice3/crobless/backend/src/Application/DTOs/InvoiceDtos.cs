using System.ComponentModel.DataAnnotations;

namespace Application.DTOs;

public record InvoiceDetailRequest(Guid ProductId, int Quantity, decimal UnitPrice);
public record CreateInvoiceRequest(
    [Required, StringLength(50)] string InvoiceNumber,
    DateOnly InvoiceDate, Guid SupplierId,
    [StringLength(2000)] string? Notes,
    [Required, MinLength(1), MaxLength(500)] List<InvoiceDetailRequest> Items);
public record UpdateInvoiceRequest(
    string InvoiceNumber, DateOnly InvoiceDate, Guid SupplierId, string? Notes,
    List<InvoiceDetailRequest> Items)
    : CreateInvoiceRequest(InvoiceNumber, InvoiceDate, SupplierId, Notes, Items);
public record InvoiceDetailDto(Guid Id, Guid ProductId, string ProductName, int Quantity, decimal UnitPrice, decimal Subtotal);
public record InvoiceDto(Guid Id, string InvoiceNumber, DateOnly InvoiceDate, Guid SupplierId,
    string SupplierName, decimal Subtotal, decimal Tax, decimal Total, string? Notes,
    DateTime CreatedAt, IEnumerable<InvoiceDetailDto> Items);
