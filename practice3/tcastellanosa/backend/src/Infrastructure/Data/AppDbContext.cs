using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Category> Categories => Set<Category>();
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

        modelBuilder.Entity<Product>()
            .HasOne(p => p.Category)
            .WithMany(c => c.Products)
            .HasForeignKey(p => p.CategoryId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Category>().HasIndex(c => c.Name).IsUnique();

        modelBuilder.Entity<Supplier>(entity =>
        {
            entity.Property(s => s.Name).HasMaxLength(150);
            entity.Property(s => s.TaxId).HasMaxLength(30);
            entity.Property(s => s.Email).HasMaxLength(150);
            entity.Property(s => s.Phone).HasMaxLength(30);
            entity.HasIndex(s => s.Name).IsUnique();
        });
        modelBuilder.Entity<Invoice>(entity =>
        {
            entity.Property(i => i.InvoiceNumber).HasMaxLength(50);
            entity.Property(i => i.Total).HasPrecision(18, 2);
            entity.HasIndex(i => i.InvoiceNumber).IsUnique();
        });
        modelBuilder.Entity<Invoice>()
            .HasOne(i => i.Supplier).WithMany(s => s.Invoices).HasForeignKey(i => i.SupplierId)
            .OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<InvoiceDetail>()
            .HasOne(d => d.Invoice).WithMany(i => i.Details).HasForeignKey(d => d.InvoiceId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<InvoiceDetail>()
            .HasOne(d => d.Product).WithMany().HasForeignKey(d => d.ProductId)
            .OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<InvoiceDetail>().HasIndex(d => new { d.InvoiceId, d.ProductId }).IsUnique();
        modelBuilder.Entity<InvoiceDetail>().Property(d => d.UnitPrice).HasPrecision(18, 2);
        modelBuilder.Entity<InvoiceDetail>().Property(d => d.Subtotal).HasPrecision(18, 2);
    }
}
