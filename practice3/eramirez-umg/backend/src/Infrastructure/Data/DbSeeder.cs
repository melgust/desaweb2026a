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

        // Keep enough deterministic products available to exercise pagination modes.
        var seedCount = GetProductSeedCount();
        var productCount = await db.Products.CountAsync(ct);
        if (productCount < seedCount)
        {
            var productsToAdd = Enumerable.Range(productCount + 1, seedCount - productCount)
                .Select(index => new Product
                {
                    Name = $"Inventory Product {index:000}",
                    Description = $"Demo inventory item {index:000} for pagination testing.",
                    Price = 9.99m + (index % 40) * 2.5m,
                    Stock = 5 + (index * 13 % 196),
                    IsActive = index % 17 != 0,
                    CreatedAt = DateTime.UtcNow.AddDays(-index)
                });

            db.Products.AddRange(productsToAdd);
            await db.SaveChangesAsync(ct);
        }
    }

    private static int GetProductSeedCount()
    {
        var configuredCount = Environment.GetEnvironmentVariable("PRODUCT_SEED_COUNT");
        return int.TryParse(configuredCount, out var count) && count > 0 ? count : 120;
    }
}
