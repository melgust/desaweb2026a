namespace Backend.src.Domain.Entities;

public sealed class Producto
{
    public int IdProducto { get; set; }
    public required string Nombre { get; set; }
    public required string Descripcion { get; set; }
    public decimal Precio { get; set; }
    public int Stock { get; set; }
    public string? ImagenUrl { get; set; }
    public bool Estado { get; set; }
    public int? CategoriaId { get; set; }
    public Categoria? Categoria { get; set; }
}