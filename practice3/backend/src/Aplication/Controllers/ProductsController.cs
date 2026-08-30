using Backend.src.Aplication.Services;
using Backend.src.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using MySqlConnector;

namespace Backend.src.Aplication.Controllers;

[ApiController]
[Route("api/products")]
public sealed class ProductsController(IProductoService productoService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<Producto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(object), StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<IReadOnlyList<Producto>>> GetAll(CancellationToken cancellationToken)
    {
        try
        {
            var products = await productoService.GetAllAsync(cancellationToken);
            return Ok(products);
        }
        catch (MySqlException ex)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new
            {
                message = "La base de datos no está disponible. Verifica que MySQL esté corriendo y que la cadena de conexión sea correcta.",
                detail = ex.Message
            });
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new
            {
                message = ex.Message
            });
        }
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(Producto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(object), StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<Producto>> GetById(int id, CancellationToken cancellationToken)
    {
        try
        {
            var product = await productoService.GetByIdAsync(id, cancellationToken);
            if (product is null)
            {
                return NotFound();
            }

            return Ok(product);
        }
        catch (MySqlException ex)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new
            {
                message = "La base de datos no está disponible. Verifica que MySQL esté corriendo y que la cadena de conexión sea correcta.",
                detail = ex.Message
            });
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new
            {
                message = ex.Message
            });
        }
    }
}