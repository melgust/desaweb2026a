namespace Application.DTOs;

public record InvoiceDetailDto(
    Guid Id,
    Guid ProductId,
    string ProductName,
    int Quantity,
    decimal UnitPrice,
    decimal Subtotal
);

public record InvoiceDto(
    Guid Id,
    string InvoiceNumber,
    DateTime Date,
    Guid CustomerId,
    string CustomerName,
    decimal Total,
    DateTime CreatedAt,
    IEnumerable<InvoiceDetailDto> Details
);

public record CreateInvoiceDetailRequest(
    Guid ProductId,
    int Quantity
);

public record CreateInvoiceRequest(
    string InvoiceNumber,
    Guid CustomerId,
    DateTime? Date,
    List<CreateInvoiceDetailRequest> Details
);

public record InvoicePagedResult(
    IEnumerable<InvoiceDto> Items,
    int TotalItems,
    int Page,
    int PageSize,
    int TotalPages
);