namespace Application.DTOs;

public record InvoiceItemDto(Guid Id, string ProductId, string ProductName, string SupplierId, string SupplierName, int Quantity, decimal UnitPrice, decimal Subtotal);
public record InvoiceDto(Guid Id, string Number, DateTime InvoiceDate, DateTime? DueDate, IReadOnlyList<InvoiceItemDto> Items, decimal Subtotal, decimal Total, string Status, string? Notes, DateTime CreatedAt);
public record SaveInvoiceItemRequest(string ProductId, string SupplierId, int Quantity, decimal UnitPrice);
public record SaveInvoiceRequest(string Number, DateTime InvoiceDate, DateTime? DueDate, IReadOnlyList<SaveInvoiceItemRequest> Items, string Status, string? Notes);
[System.Text.Json.Serialization.JsonUnmappedMemberHandling(System.Text.Json.Serialization.JsonUnmappedMemberHandling.Disallow)]
public record OrderItemRequest(string ProductId, string SupplierId, int Quantity);
[System.Text.Json.Serialization.JsonUnmappedMemberHandling(System.Text.Json.Serialization.JsonUnmappedMemberHandling.Disallow)]
public record ConfirmOrderRequest(Guid OrderId, IReadOnlyList<OrderItemRequest> Items);
