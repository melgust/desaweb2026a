using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Data;

/// <summary>
/// Seeds initial roles and users (admin + standard user) if they don't exist yet.
/// Idempotent: safe to run on every startup.
/// </summary>
public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db, int productCount = 75, CancellationToken ct = default)
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

        // Demo inventory. Stable names make this seed idempotent; increasing the
        // configured count only inserts the records that are still missing.
        productCount = Math.Clamp(productCount, 0, 10_000);
        var existingSeedNames = await db.Products
            .Where(p => p.Name.StartsWith("INV-"))
            .Select(p => p.Name)
            .ToHashSetAsync(ct);

        var categories = new[] { "Laptop", "Monitor", "Teclado", "Mouse", "Audifonos", "Webcam", "Impresora", "Router", "Disco SSD", "Memoria RAM" };
        var brands = new[] { "Nova", "Atlas", "Orion", "Vertex", "Nimbus", "Quantum" };
        var demoProducts = new List<Product>();

        for (var i = 1; i <= productCount; i++)
        {
            var category = categories[(i - 1) % categories.Length];
            var brand = brands[((i - 1) / categories.Length) % brands.Length];
            var name = $"INV-{i:D4} | {category} {brand}";
            if (existingSeedNames.Contains(name)) continue;

            demoProducts.Add(new Product
            {
                Name = name,
                Description = $"Producto de demostracion para inventario: {category} marca {brand}.",
                Price = decimal.Round(149.90m + (i * 37.45m) % 18_500m, 2),
                Stock = (i * 17) % 151,
                IsActive = i % 13 != 0,
                CreatedAt = DateTime.UtcNow.AddMinutes(-i),
                UpdatedAt = DateTime.UtcNow.AddMinutes(-i)
            });
        }

        if (demoProducts.Count > 0)
        {
            db.Products.AddRange(demoProducts);
            await db.SaveChangesAsync(ct);
        }
    }
}
