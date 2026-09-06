using System.Net;
using System.Net.Http.Json;

namespace Application.Services;

public interface ICatalogClient
{
    Task<CatalogReference> GetActiveProductAsync(string id, CancellationToken ct);
    Task<CatalogReference> GetActiveSupplierAsync(string id, CancellationToken ct);
}

public record CatalogReference(string Id, string Name);

public class CatalogClient : ICatalogClient
{
    private readonly HttpClient _httpClient;

    public CatalogClient(HttpClient httpClient) => _httpClient = httpClient;

    public Task<CatalogReference> GetActiveProductAsync(string id, CancellationToken ct) =>
        GetActiveAsync("api/products", id, "Product", ct);

    public Task<CatalogReference> GetActiveSupplierAsync(string id, CancellationToken ct) =>
        GetActiveAsync("api/suppliers", id, "Supplier", ct);

    private async Task<CatalogReference> GetActiveAsync(string resource, string id, string label, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(id))
            throw new ArgumentException($"{label} is required.");

        using var response = await _httpClient.GetAsync($"{resource}/{Uri.EscapeDataString(id)}", ct);
        if (response.StatusCode == HttpStatusCode.NotFound)
            throw new ArgumentException($"{label} not found or inactive.");

        response.EnsureSuccessStatusCode();
        var item = await response.Content.ReadFromJsonAsync<CatalogItem>(cancellationToken: ct)
            ?? throw new HttpRequestException($"Catalog returned an invalid {label.ToLowerInvariant()} response.");
        if (!item.IsActive)
            throw new ArgumentException($"{label} not found or inactive.");

        return new CatalogReference(item.Id, item.Name);
    }

    private sealed record CatalogItem(string Id, string Name, bool IsActive);
}
