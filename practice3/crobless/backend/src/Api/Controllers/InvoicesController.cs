using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/invoices")]
[Authorize]
[Obsolete("Moved to the Spring Boot purchasing-service. This endpoint returns 410 Gone.")]
public class InvoicesController(IConfiguration configuration) : ControllerBase
{
    [Route("")]
    [Route("{**path}")]
    [AcceptVerbs("GET", "POST", "PUT", "DELETE", "PATCH")]
    public IActionResult Deprecated(string? path = null)
    {
        var url = configuration["Purchasing:PublicUrl"] ?? "http://localhost:8081/api";
        Response.Headers["Deprecation"] = "@1789171200";
        Response.Headers["Link"] = $"<{url}/invoices>; rel=\"successor-version\"";
        return StatusCode(410, new { message = "Este módulo se migró a Spring Boot.", serviceUrl = $"{url}/invoices" });
    }
}
