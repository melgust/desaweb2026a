using Backend.src.Aplication.Services;
using Backend.src.Domain.Entities;
using Microsoft.AspNetCore.Mvc;

namespace Backend.src.Aplication.Controllers;

[ApiController]
[Route("api/products")]
public sealed class ProductsController(IProductoService productoService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<Producto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<Producto>>> GetAll(CancellationToken cancellationToken)
    {
        var products = await productoService.GetAllAsync(cancellationToken);
        return Ok(products);
    }
}