namespace Backend.src.Domain.Entities;

public sealed class Categoria
{
    public int Id { get; set; }
    public required string Descripcion { get; set; }
    public string? UserUI { get; set; }
    public DateTime FechaUI { get; set; }

    public ICollection<Producto> Productos { get; set; } = new List<Producto>();
}
