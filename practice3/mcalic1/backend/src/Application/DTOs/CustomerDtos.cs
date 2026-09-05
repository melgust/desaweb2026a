namespace Application.DTOs;

public record CustomerDto(
    Guid Id,
    string Name,
    string? Nit,
    string? Address,
    string? Phone,
    string? Email,
    bool IsActive,
    DateTime CreatedAt
);

public record CreateCustomerRequest(
    string Name,
    string? Nit,
    string? Address,
    string? Phone,
    string? Email,
    bool IsActive
);

public record UpdateCustomerRequest(
    string Name,
    string? Nit,
    string? Address,
    string? Phone,
    string? Email,
    bool IsActive
);

public record CustomerPagedResult(
    IEnumerable<CustomerDto> Items,
    int TotalItems,
    int Page,
    int PageSize,
    int TotalPages
);