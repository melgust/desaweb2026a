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
        await EnsureCategoryTableAsync(db, ct);

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

        var categories = await EnsureCategoriesAsync(db, ct);

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
                .Select((index, i) => new Product
                {
                    Name = $"Inventory Product {index:000}",
                    Description = $"Demo inventory item {index:000} for pagination testing.",
                    Price = 9.99m + (index % 40) * 2.5m,
                    Stock = 5 + (index * 13 % 196),
                    IsActive = index % 17 != 0,
                    CreatedAt = DateTime.UtcNow.AddDays(-index),
                    CategoryId = categories[i % categories.Count].Id
                });

            db.Products.AddRange(productsToAdd);
            await db.SaveChangesAsync(ct);
        }
        else
        {
            var categoryList = await db.Categories.OrderBy(c => c.Name).ToListAsync(ct);
            if (categoryList.Count > 0)
            {
                var productsWithoutCategory = await db.Products.Where(p => p.CategoryId == null).OrderBy(p => p.CreatedAt).ToListAsync(ct);
                foreach (var product in productsWithoutCategory)
                {
                    product.CategoryId = categoryList[(product.Stock + product.Name.Length) % categoryList.Count].Id;
                }

                await db.SaveChangesAsync(ct);
            }
        }
    }

    private static async Task<List<Category>> EnsureCategoriesAsync(AppDbContext db, CancellationToken ct)
    {
        var names = new[] { "Electronics", "Home", "Office", "Accessories", "Sport" };
        var categories = new List<Category>();

        foreach (var name in names)
        {
            var category = await db.Categories.FirstOrDefaultAsync(c => c.Name == name, ct);
            if (category == null)
            {
                category = new Category { Name = name, Description = $"{name} category" };
                db.Categories.Add(category);
            }

            categories.Add(category);
        }

        await db.SaveChangesAsync(ct);
        return categories;
    }

    private static async Task EnsureCategoryTableAsync(AppDbContext db, CancellationToken ct)
    {
        var exists = await db.Database.SqlQueryRaw<int>("SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'Categories' LIMIT 1").ToListAsync(ct);
        if (exists.Count == 0)
        {
            await db.Database.ExecuteSqlRawAsync(@"
                CREATE TABLE Categories (
                    Id CHAR(36) NOT NULL,
                    Name VARCHAR(255) NOT NULL,
                    Description LONGTEXT NULL,
                    CreatedAt DATETIME(6) NOT NULL,
                    PRIMARY KEY (Id),
                    UNIQUE INDEX IX_Categories_Name (Name)
                );
            ", ct);
        }

        var productsTable = await db.Database.SqlQueryRaw<string>("SELECT COLUMN_NAME FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'Products' AND column_name = 'CategoryId' LIMIT 1").ToListAsync(ct);
        if (productsTable.Count == 0)
        {
            await db.Database.ExecuteSqlRawAsync(@"
                ALTER TABLE Products
                    ADD COLUMN CategoryId CHAR(36) NULL;
            ", ct);

            await db.Database.ExecuteSqlRawAsync(@"
                ALTER TABLE Products
                    ADD CONSTRAINT FK_Products_Categories_CategoryId
                    FOREIGN KEY (CategoryId) REFERENCES Categories(Id)
                    ON DELETE SET NULL;
            ", ct);
        }
    }

    private static int GetProductSeedCount()
    {
        var configuredCount = Environment.GetEnvironmentVariable("PRODUCT_SEED_COUNT");
        return int.TryParse(configuredCount, out var count) && count > 0 ? count : 120;
    }
}
