namespace Application.DTOs;

public record CategoryDto(Guid Id, string Name, string? Description, int ProductCount, DateTime CreatedAt);
public record CreateCategoryRequest(string Name, string? Description);
public record UpdateCategoryRequest(string Name, string? Description);
