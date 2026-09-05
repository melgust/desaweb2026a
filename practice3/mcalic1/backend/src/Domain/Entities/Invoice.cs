namespace Domain.Entities;

public class Invoice
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string InvoiceNumber { get; set; } = string.Empty;

    public DateTime Date { get; set; } = DateTime.UtcNow;

    public Guid CustomerId { get; set; }

    public Customer Customer { get; set; } = null!;

    public decimal Total { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<InvoiceDetail> Details { get; set; } = new List<InvoiceDetail>();
}