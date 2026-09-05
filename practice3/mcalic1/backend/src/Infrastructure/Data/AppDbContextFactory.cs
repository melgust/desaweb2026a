using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Infrastructure.Data;

/// <summary>
/// Design-time factory so EF Core tools can create the DbContext
/// for migrations.
/// </summary>
public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var connectionString =
            Environment.GetEnvironmentVariable(
                "ConnectionStrings__DefaultConnection"
            )
            ?? "Server=localhost;Port=3307;Database=EnterpriseDb;User Id=root;Password=YourSecurePassword123!;";

        var options =
            new DbContextOptionsBuilder<AppDbContext>()
                .UseMySql(
                    connectionString,
                    new MySqlServerVersion(
                        new Version(8, 0, 0)
                    )
                )
                .Options;

        return new AppDbContext(options);
    }
}