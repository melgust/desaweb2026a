using Backend.src.Aplication.Contracts.Auth;

namespace Backend.src.Aplication.Services;

public interface IAuthService
{
    LoginResponse? Login(LoginRequest request);
}