using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<InvoiceDetail> InvoiceDetails => Set<InvoiceDetail>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>()
            .HasOne(u => u.Role)
            .WithMany(r => r.Users)
            .HasForeignKey(u => u.RoleId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique();
        modelBuilder.Entity<Role>().HasIndex(r => r.Name).IsUnique();
        modelBuilder.Entity<Supplier>().HasIndex(s => s.TaxId).IsUnique();
        modelBuilder.Entity<Invoice>().HasIndex(i => i.Number).IsUnique();

        modelBuilder.Entity<Invoice>()
            .HasOne(i => i.Supplier)
            .WithMany(s => s.Invoices)
            .HasForeignKey(i => i.SupplierId)
            .OnDelete(DeleteBehavior.Restrict);

        // Keep the existing header precision to preserve historical amounts.
        modelBuilder.Entity<Invoice>().Property(i => i.Subtotal).HasPrecision(65, 30);
        modelBuilder.Entity<Invoice>().Property(i => i.Tax).HasPrecision(65, 30);
        modelBuilder.Entity<Invoice>().Property(i => i.Total).HasPrecision(65, 30);
        var detail = modelBuilder.Entity<InvoiceDetail>();
        detail.HasKey(d => d.Id);
        detail.Property(d => d.ProductId).HasMaxLength(128).IsRequired();
        detail.Property(d => d.ProductName).HasMaxLength(500).IsRequired();
        detail.Property(d => d.UnitPrice).HasPrecision(18, 2);
        detail.Property(d => d.Subtotal).HasPrecision(18, 2);
        detail.HasIndex(d => new { d.InvoiceId, d.ProductId }).IsUnique();
        detail.HasOne(d => d.Invoice).WithMany(i => i.Details)
            .HasForeignKey(d => d.InvoiceId).OnDelete(DeleteBehavior.Cascade);
        detail.ToTable("InvoiceDetails", table =>
        {
            table.HasCheckConstraint("CK_InvoiceDetails_Quantity", "`Quantity` > 0");
            table.HasCheckConstraint("CK_InvoiceDetails_UnitPrice", "`UnitPrice` >= 0");
            table.HasCheckConstraint("CK_InvoiceDetails_Subtotal", "`Subtotal` >= 0");
        });
    }
}
