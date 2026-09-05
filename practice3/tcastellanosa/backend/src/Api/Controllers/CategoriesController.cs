using Application.DTOs;
using Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CategoriesController : ControllerBase
{
    private readonly ICategoryService _categoryService;

    public CategoriesController(ICategoryService categoryService) => _categoryService = categoryService;

    [HttpGet]
    [Authorize(Roles = "Admin,Manager,User")]
    public async Task<ActionResult<IEnumerable<CategoryDto>>> GetAll(CancellationToken ct)
    {
        return Ok(await _categoryService.GetAllAsync(ct));
    }
}
