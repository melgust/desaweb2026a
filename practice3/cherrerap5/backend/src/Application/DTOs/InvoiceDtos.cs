namespace Application.DTOs;

public record InvoiceDto(Guid Id, string Number, Guid SupplierId, string SupplierName, Guid ProductId, string ProductName, DateTime InvoiceDate, DateTime? DueDate, int Quantity, decimal UnitPrice, decimal Total, string Status, string? Notes, DateTime CreatedAt);
public record SaveInvoiceRequest(string Number, Guid SupplierId, Guid ProductId, DateTime InvoiceDate, DateTime? DueDate, int Quantity, decimal UnitPrice, string Status, string? Notes);
