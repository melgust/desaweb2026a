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
    }
}
