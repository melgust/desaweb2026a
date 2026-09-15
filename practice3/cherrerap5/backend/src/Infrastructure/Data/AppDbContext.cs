using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<InvoiceItem> InvoiceItems => Set<InvoiceItem>();

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
        modelBuilder.Entity<Invoice>().HasIndex(i => i.Number).IsUnique();

        modelBuilder.Entity<Invoice>().Property(i => i.Total).HasPrecision(18, 2);
        modelBuilder.Entity<Invoice>().Property(i => i.SourceOrderKey).HasMaxLength(64);
        modelBuilder.Entity<Invoice>().Property(i => i.SourceOrderFingerprint).HasMaxLength(64);
        modelBuilder.Entity<Invoice>().HasIndex(i => i.SourceOrderKey).IsUnique();
        modelBuilder.Entity<InvoiceItem>().HasOne(i => i.Invoice).WithMany(i => i.Items)
            .HasForeignKey(i => i.InvoiceId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<InvoiceItem>().Property(i => i.UnitPrice).HasPrecision(18, 2);
        modelBuilder.Entity<InvoiceItem>().Property(i => i.Subtotal).HasPrecision(18, 2);
        modelBuilder.Entity<InvoiceItem>().Property(i => i.SupplierId).HasMaxLength(64);
        modelBuilder.Entity<InvoiceItem>().Property(i => i.ProductId).HasMaxLength(64);
        modelBuilder.Entity<InvoiceItem>().Property(i => i.SupplierName).HasMaxLength(255);
        modelBuilder.Entity<InvoiceItem>().Property(i => i.ProductName).HasMaxLength(255);
    }
}
