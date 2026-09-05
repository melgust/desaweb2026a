using System.ComponentModel.DataAnnotations;

namespace Application.DTOs;

public record InvoiceDetailDto(Guid Id, Guid ProductId, string ProductName, int Quantity, decimal UnitPrice, decimal Subtotal);
public record InvoiceDto(Guid Id, string InvoiceNumber, Guid SupplierId, string SupplierName, DateTime InvoiceDate, decimal Total, IEnumerable<InvoiceDetailDto> Details);
public record CreateInvoiceDetailRequest([param: Required] Guid ProductId, [param: Range(1, int.MaxValue)] int Quantity, [param: Range(typeof(decimal), "0.01", "999999999")] decimal UnitPrice);
public record CreateInvoiceRequest(
    [param: Required, StringLength(50)] string InvoiceNumber,
    [param: Required] Guid SupplierId,
    DateTime InvoiceDate,
    [param: Required, MinLength(1)] IEnumerable<CreateInvoiceDetailRequest> Details);
