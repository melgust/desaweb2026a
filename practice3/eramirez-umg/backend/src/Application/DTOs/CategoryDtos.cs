namespace Application.DTOs;

public record CategoryDto(Guid Id, string Name, string? Description, DateTime CreatedAt);
public record CreateCategoryRequest(string Name, string? Description);
public record UpdateCategoryRequest(string Name, string? Description);
