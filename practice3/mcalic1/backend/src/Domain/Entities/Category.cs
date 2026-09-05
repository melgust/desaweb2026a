namespace Domain.Entities;

public class Category
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Productor al que pertenece la categoría
    public Guid? SupplierId { get; set; }

    public Supplier? Supplier { get; set; }

    // Una categoría puede tener varios productos
    public ICollection<Product> Products { get; set; } = new List<Product>();
}