using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Data;

/// <summary>
/// Seeds initial roles, users, and dummy products if they don't exist yet.
/// Idempotent: safe to run on every startup.
/// </summary>
public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db, CancellationToken ct = default)
    {
        // --- 1. Roles ---
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

        // --- 2. Users ---
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

        // --- 3. NUEVO: Proveedores de prueba ---
        var supplier1 = await db.Suppliers.FirstOrDefaultAsync(s => s.Name == "Tech Supplies Co.", ct);
        if (supplier1 == null)
        {
            supplier1 = new Supplier { Name = "Tech Supplies Co.", ContactEmail = "contact@tech.com", IsActive = true };
            db.Suppliers.Add(supplier1);
        }

        var supplier2 = await db.Suppliers.FirstOrDefaultAsync(s => s.Name == "Global Hardware Ltd.", ct);
        if (supplier2 == null)
        {
            supplier2 = new Supplier { Name = "Global Hardware Ltd.", ContactEmail = "info@global.com", IsActive = true };
            db.Suppliers.Add(supplier2);
        }

        await db.SaveChangesAsync(ct);

        // --- 4. NUEVO: 30 Productos de prueba para el Scroll Infinito ---
        var productCount = await db.Products.CountAsync(ct);
        
        // Solo los crea si hay menos de 25 productos en la base de datos
        if (productCount < 25)
        {
            var random = new Random();
            var suppliers = new[] { supplier1, supplier2 };

            for (int i = 1; i <= 30; i++)
            {
                db.Products.Add(new Product
                {
                    Name = $"Producto de Prueba {i:D2}",
                    Description = $"Descripción detallada para el producto número {i}. Ideal para pruebas de paginación y scroll infinito.",
                    Price = Math.Round((decimal)(random.NextDouble() * 500 + 10), 2), // Precio entre 10 y 510
                    Stock = random.Next(5, 200), // Stock entre 5 y 200
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    SupplierId = suppliers[random.Next(0, suppliers.Length)].Id
                });
            }

            await db.SaveChangesAsync(ct);
        }
    }
}