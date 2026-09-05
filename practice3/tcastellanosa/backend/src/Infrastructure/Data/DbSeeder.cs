using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Data;

/// <summary>
/// Seeds initial roles and users (admin + standard user) if they don't exist yet.
/// Idempotent: safe to run on every startup.
/// </summary>
public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db, CancellationToken ct = default)
    {
        // --- Roles ---
        var adminRole = await db.Roles.FirstOrDefaultAsync(r => r.Name == "Admin", ct);
        if (adminRole == null)
        {
            adminRole = new Role { Name = "Admin", Description = "Full system access" };
            db.Roles.Add(adminRole);
        }

        var managerRole = await db.Roles.FirstOrDefaultAsync(r => r.Name == "Manager", ct);
        if (managerRole == null)
        {
            managerRole = new Role { Name = "Manager", Description = "Can manage products" };
            db.Roles.Add(managerRole);
        }

        var userRole = await db.Roles.FirstOrDefaultAsync(r => r.Name == "User", ct);
        if (userRole == null)
        {
            userRole = new Role { Name = "User", Description = "Read-only access" };
            db.Roles.Add(userRole);
        }

        await db.SaveChangesAsync(ct);

        var categories = new[]
        {
            new { Name = "Hardware", Description = "Computers and physical equipment" },
            new { Name = "Software", Description = "Applications and licenses" },
            new { Name = "Office", Description = "Office furniture and supplies" },
            new { Name = "Networking", Description = "Network and connectivity equipment" }
        };

        foreach (var category in categories)
        {
            if (!await db.Categories.AnyAsync(c => c.Name == category.Name, ct))
            {
                db.Categories.Add(new Category { Name = category.Name, Description = category.Description });
            }
        }

        await db.SaveChangesAsync(ct);

        // --- Sample products ---
        // These are inserted by name, so existing products are never overwritten.
        var hardwareCategory = await db.Categories.FirstAsync(c => c.Name == "Hardware", ct);
        var officeCategory = await db.Categories.FirstAsync(c => c.Name == "Office", ct);
        var sampleProducts = new[]
        {
            new { Name = "Laptop Pro 14", Description = "Business laptop", Price = 950.00m, Stock = 0, CategoryId = hardwareCategory.Id },
            new { Name = "Wireless Mouse", Description = "Ergonomic wireless mouse", Price = 18.50m, Stock = 0, CategoryId = hardwareCategory.Id },
            new { Name = "Office Chair", Description = "Adjustable office chair", Price = 135.00m, Stock = 0, CategoryId = officeCategory.Id }
        };

        foreach (var product in sampleProducts)
        {
            if (!await db.Products.AnyAsync(p => p.Name == product.Name, ct))
            {
                db.Products.Add(new Product
                {
                    Name = product.Name,
                    Description = product.Description,
                    Price = product.Price,
                    Stock = product.Stock,
                    CategoryId = product.CategoryId,
                    IsActive = true
                });
            }
        }

        await db.SaveChangesAsync(ct);

        // --- Sample suppliers ---
        var sampleSuppliers = new[]
        {
            new { Name = "Tech Supplies Guatemala", TaxId = "GT-987654-1", Email = "sales@techsupplies.example", Phone = "+502 2200-1000" },
            new { Name = "Office Solutions", TaxId = "GT-123456-7", Email = "contact@officesolutions.example", Phone = "+502 2200-2000" }
        };

        foreach (var supplier in sampleSuppliers)
        {
            if (!await db.Suppliers.AnyAsync(s => s.Name == supplier.Name, ct))
            {
                db.Suppliers.Add(new Supplier { Name = supplier.Name, TaxId = supplier.TaxId, Email = supplier.Email, Phone = supplier.Phone, IsActive = true });
            }
        }

        await db.SaveChangesAsync(ct);

        // --- Sample purchase invoice ---
        // It is created once and includes its detail rows; stock is initialized from it.
        const string sampleInvoiceNumber = "FAC-COMPRA-001";
        if (!await db.Invoices.AnyAsync(i => i.InvoiceNumber == sampleInvoiceNumber, ct))
        {
            var supplier = await db.Suppliers.FirstAsync(s => s.Name == "Tech Supplies Guatemala", ct);
            var laptop = await db.Products.FirstAsync(p => p.Name == "Laptop Pro 14", ct);
            var mouse = await db.Products.FirstAsync(p => p.Name == "Wireless Mouse", ct);
            var invoice = new Invoice
            {
                InvoiceNumber = sampleInvoiceNumber,
                SupplierId = supplier.Id,
                InvoiceDate = DateTime.UtcNow.Date,
                Total = 5 * 900.00m + 20 * 14.50m
            };
            invoice.Details.Add(new InvoiceDetail { ProductId = laptop.Id, Quantity = 5, UnitPrice = 900.00m, Subtotal = 4500.00m });
            invoice.Details.Add(new InvoiceDetail { ProductId = mouse.Id, Quantity = 20, UnitPrice = 14.50m, Subtotal = 290.00m });
            laptop.Stock += 5;
            mouse.Stock += 20;
            db.Invoices.Add(invoice);
        }

        await db.SaveChangesAsync(ct);

        // --- Users ---
        if (!await db.Users.AnyAsync(u => u.Email == "admin@enterprise.com", ct))
        {
            db.Users.Add(new User
            {
                Name = "System Administrator",
                Email = "admin@enterprise.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
                RoleId = adminRole.Id
            });
        }

        if (!await db.Users.AnyAsync(u => u.Email == "user@enterprise.com", ct))
        {
            db.Users.Add(new User
            {
                Name = "Standard User",
                Email = "user@enterprise.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("User123!"),
                RoleId = userRole.Id
            });
        }

        await db.SaveChangesAsync(ct);
    }
}
