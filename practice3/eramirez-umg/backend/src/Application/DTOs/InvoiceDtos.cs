namespace Application.DTOs;

public record InvoiceDetailDto(Guid Id, string ProductId, string ProductName, int Quantity, decimal UnitPrice, decimal Subtotal);
public record InvoiceItemRequest(string ProductId, int Quantity);
public record InvoiceDto(Guid Id, Guid SupplierId, string SupplierName, string Number, DateTime IssueDate, DateTime? DueDate, decimal Subtotal, decimal Tax, decimal Total, string Status, string? Notes, DateTime CreatedAt, IReadOnlyList<InvoiceDetailDto> Details);
public record CreateInvoiceRequest(Guid SupplierId, string Number, DateTime IssueDate, DateTime? DueDate, decimal Tax, string Status, string? Notes, IReadOnlyList<InvoiceItemRequest>? Items);
public record UpdateInvoiceRequest(Guid SupplierId, string Number, DateTime IssueDate, DateTime? DueDate, decimal Subtotal, decimal Tax, string Status, string? Notes);
public record InvoicePagedResult(IEnumerable<InvoiceDto> Items, int TotalItems, int Page, int PageSize, int TotalPages);
