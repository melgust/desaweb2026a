namespace Application.DTOs;

public record InvoiceDto(Guid Id, string Number, string SupplierId, string SupplierName, string ProductId, string ProductName, DateTime InvoiceDate, DateTime? DueDate, int Quantity, decimal UnitPrice, decimal Total, string Status, string? Notes, DateTime CreatedAt);
public record SaveInvoiceRequest(string Number, string SupplierId, string ProductId, DateTime InvoiceDate, DateTime? DueDate, int Quantity, decimal UnitPrice, string Status, string? Notes);
