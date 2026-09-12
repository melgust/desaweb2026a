namespace Application.DTOs;

public record LoginRequestDto(string Email, string Password);

public record AuthResponseDto
{
    public string Token { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string Role { get; init; } = string.Empty;
}