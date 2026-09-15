using Application.DTOs;
using Application.Services;
using Infrastructure.Data;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace InvoiceServiceTests;

public class InvoiceTests : IAsyncLifetime
{
    private readonly SqliteConnection connection = new("Data Source=:memory:");
    private AppDbContext db = null!;
    private InvoiceService service = null!;
    private readonly FakeCatalog catalog = new();
    private const string ProductA = "0dfcefae-6604-385b-8a72-e19493f1b2ac", ProductB = "bbbbbbbbbbbbbbbbbbbbbbbb", Supplier = "cccccccccccccccccccccccc";
    public async Task InitializeAsync()
    {
        await connection.OpenAsync();
        db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
        await db.Database.EnsureCreatedAsync();
        service = new InvoiceService(db, catalog);
    }
    public async Task DisposeAsync() { await db.DisposeAsync(); await connection.DisposeAsync(); }
    private static SaveInvoiceRequest Request() => new("TEST-1", DateTime.UtcNow, null,
        [new(ProductA, Supplier, 2, 12.35m), new(ProductB, Supplier, 1, 3.25m)], "Pending", null);
    private static ConfirmOrderRequest Order() => new(Guid.NewGuid(), [new(ProductA, Supplier, 2), new(ProductB, Supplier, 1)]);

    [Fact]
    public async Task OneInvoiceContainsMultipleLinesAndCorrectTotal()
    {
        var invoice = await service.CreateAsync(Request(), default);
        Assert.Equal(27.95m, invoice.Total); Assert.Equal(2, invoice.Items.Count);
        Assert.Equal(1, await db.Invoices.CountAsync()); Assert.Equal(2, await db.InvoiceItems.CountAsync());
        Assert.Equal(2, (await service.GetByIdAsync(invoice.Id, default)).Items.Count);
    }
    [Fact]
    public async Task UpdatingReplacesLinesAndRecalculatesTotal()
    {
        var invoice = await service.CreateAsync(Request(), default);
        var updated = await service.UpdateAsync(invoice.Id, Request() with { Items = [new(ProductB, Supplier, 3, 2m)] }, default);
        Assert.Single(updated.Items); Assert.Equal(6m, updated.Total); Assert.Equal(1, await db.InvoiceItems.CountAsync());
    }
    [Fact]
    public async Task ConfirmUsesCatalogPricesAndCreatesOnlyOneInvoice()
    {
        var invoice = await service.CreateFromOrderAsync("A", Order(), default);
        Assert.Equal(37.05m, invoice.Total); Assert.Equal(2, invoice.Items.Count);
        Assert.Equal(1, await db.Invoices.CountAsync());
    }
    [Fact]
    public async Task RetryReturnsSameInvoiceEvenIfCatalogIsUnavailable()
    {
        var order = Order(); var first = await service.CreateFromOrderAsync("A", order, default);
        catalog.Fail = true;
        var retry = await service.CreateFromOrderAsync("A", order, default);
        Assert.Equal(first.Id, retry.Id); Assert.Equal(1, await db.Invoices.CountAsync());
    }
    [Fact]
    public async Task SameOrderIdIsIsolatedByAuthenticatedUser()
    {
        var order = Order(); var first = await service.CreateFromOrderAsync("A", order, default);
        var second = await service.CreateFromOrderAsync("B", order, default);
        Assert.NotEqual(first.Id, second.Id);
    }
    [Fact]
    public async Task RetryWithChangedPayloadIsRejected()
    {
        var order = Order(); await service.CreateFromOrderAsync("A", order, default);
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.CreateFromOrderAsync("A", order with { Items = [new(ProductA, Supplier, 99)] }, default));
        Assert.Equal(1, await db.Invoices.CountAsync());
    }
    [Fact]
    public async Task MissingProductDoesNotPersistHeaderOrPartialLines()
    {
        catalog.Missing = ProductB;
        await Assert.ThrowsAsync<ArgumentException>(() => service.CreateAsync(Request(), default));
        Assert.Equal(0, await db.Invoices.CountAsync()); Assert.Equal(0, await db.InvoiceItems.CountAsync());
    }
    [Theory]
    [InlineData(0)] [InlineData(-1)] [InlineData(100001)]
    public async Task InvalidQuantityIsRejected(int quantity)
    {
        await Assert.ThrowsAsync<ArgumentException>(() => service.CreateAsync(Request() with { Items = [new(ProductA, Supplier, quantity, 1)] }, default));
    }
    [Fact]
    public async Task DuplicateProductsAndEmptyInvoicesAreRejected()
    {
        await Assert.ThrowsAsync<ArgumentException>(() => service.CreateAsync(Request() with { Items = [] }, default));
        await Assert.ThrowsAsync<ArgumentException>(() => service.CreateAsync(Request() with { Items = [new(ProductA, Supplier, 1, 1), new(ProductA, Supplier, 2, 1)] }, default));
    }
    [Fact]
    public async Task DeletingConfirmedInvoiceCannotRecreateItOnRetry()
    {
        var order = Order(); var invoice = await service.CreateFromOrderAsync("A", order, default);
        await service.DeleteAsync(invoice.Id, default);
        Assert.Empty(await service.GetAllAsync(default));
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.CreateFromOrderAsync("A", order, default));
        Assert.Equal(1, await db.Invoices.CountAsync());
    }
    private sealed class FakeCatalog : ICatalogClient
    {
        public bool Fail; public string? Missing;
        public Task<CatalogReference> GetActiveProductAsync(string id, CancellationToken ct)
        {
            if (Fail) throw new HttpRequestException("Unavailable");
            if (Missing == id) throw new ArgumentException("Product missing");
            return Task.FromResult(new CatalogReference(id, "Product", 12.35m));
        }
        public Task<CatalogReference> GetActiveSupplierAsync(string id, CancellationToken ct) => Task.FromResult(new CatalogReference(id, "Supplier"));
    }
}
