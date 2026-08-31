namespace Domain.Entities;

public class Product
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public int Stock { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Many products belong to one supplier (optional).
    public Guid? SupplierId { get; set; }
    public Supplier? Supplier { get; set; }
        // Relación N:1 (Nullable para no romper datos existentes)
    public Guid? CategoryId { get; set; }
    public Category? Category { get; set; }
}
