using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using MySqlConnector;
using Xunit;

namespace InvoiceServiceTests;

public class MySqlFactAttribute : FactAttribute
{
    public MySqlFactAttribute()
    {
        if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable("TEST_MYSQL_ADMIN_CONNECTION")))
            Skip = "Set TEST_MYSQL_ADMIN_CONNECTION to test the real MySQL migration in an isolated database.";
    }
}

public class MigrationTests
{
    [MySqlFact]
    public async Task ExistingSingleProductInvoiceBecomesOneLineWithoutLosingData()
    {
        var settings = new MySqlConnectionStringBuilder(Environment.GetEnvironmentVariable("TEST_MYSQL_ADMIN_CONNECTION")!);
        var databaseName = $"invtest_{Guid.NewGuid():N}";
        settings.Database = "";
        await using var admin = new MySqlConnection(settings.ConnectionString);
        await admin.OpenAsync();
        await new MySqlCommand($"CREATE DATABASE `{databaseName}`", admin).ExecuteNonQueryAsync();
        try
        {
            settings.Database = databaseName;
            await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
                .UseMySql(settings.ConnectionString, new MySqlServerVersion(new Version(8, 0, 0))).Options);
            var migrator = db.GetService<IMigrator>();
            await migrator.MigrateAsync("20260906012338_RemoveLegacyCatalogTables");
            var id = Guid.NewGuid();
            await db.Database.ExecuteSqlInterpolatedAsync($"""
                INSERT INTO Invoices (Id, Number, SupplierId, SupplierName, ProductId, ProductName, InvoiceDate, Quantity, UnitPrice, Total, Status, CreatedAt, UpdatedAt)
                VALUES ({id}, {"LEGACY-TEST"}, {"cccccccccccccccccccccccc"}, {"Historical supplier"}, {"aaaaaaaaaaaaaaaaaaaaaaaa"}, {"Historical product"}, {new DateTime(2026, 9, 1)}, {2}, {12.35m}, {24.70m}, {"Paid"}, {new DateTime(2026, 9, 1)}, {new DateTime(2026, 9, 1)})
                """);
            await migrator.MigrateAsync();
            var invoice = await db.Invoices.Include(i => i.Items).SingleAsync(i => i.Id == id);
            Assert.Equal("LEGACY-TEST", invoice.Number); Assert.Equal("Paid", invoice.Status);
            Assert.Equal(24.70m, invoice.Total); Assert.Equal(new DateTime(2026, 9, 1), invoice.InvoiceDate);
            var line = Assert.Single(invoice.Items);
            Assert.Equal("Historical product", line.ProductName); Assert.Equal("Historical supplier", line.SupplierName);
            Assert.Equal(2, line.Quantity); Assert.Equal(12.35m, line.UnitPrice); Assert.Equal(24.70m, line.Subtotal);
        }
        finally
        {
            // Only this test's generated database is removed; never the configured application database.
            await new MySqlCommand($"DROP DATABASE `{databaseName}`", admin).ExecuteNonQueryAsync();
        }
    }
}
