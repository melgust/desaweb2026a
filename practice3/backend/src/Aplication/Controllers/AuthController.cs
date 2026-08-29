using Backend.src.Aplication.Contracts.Auth;
using Backend.src.Aplication.Services;
using Microsoft.AspNetCore.Mvc;

namespace Backend.src.Aplication.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class AuthController(IAuthService authService) : ControllerBase
{
	[HttpPost("login")]
	[ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status401Unauthorized)]
	public ActionResult<LoginResponse> Login([FromBody] LoginRequest request)
	{
		var response = authService.Login(request);
		return response is null ? Unauthorized() : Ok(response);
	}
}
