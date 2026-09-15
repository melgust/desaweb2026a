using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace Application.Services;

public record CatalogProduct(string Id, string Name, decimal? Price, int? Stock, bool? IsActive);
public record CatalogSupplier(Guid Id, string Name, string TaxId, string? Email, string? Phone, string? Address, bool IsActive);
public class CatalogUnavailableException : Exception
{
    public CatalogUnavailableException(Exception? inner = null)
        : base("Product catalog is temporarily unavailable.", inner) { }
}

public class CatalogClient(HttpClient http)
{
    public async Task<CatalogSupplier?> GetSupplierAsync(Guid id, CancellationToken ct)
    {
        try
        {
            using var response = await http.GetAsync($"api/suppliers/{id}", ct);
            if (response.StatusCode == HttpStatusCode.NotFound) return null;
            if (!response.IsSuccessStatusCode) throw new CatalogUnavailableException();
            var supplier = await response.Content.ReadFromJsonAsync<CatalogSupplier>(ct);
            if (supplier is null || supplier.Id != id || string.IsNullOrWhiteSpace(supplier.Name) || string.IsNullOrWhiteSpace(supplier.TaxId) || supplier.TaxId.Length > 255)
                throw new CatalogUnavailableException();
            return supplier;
        }
        catch (HttpRequestException ex) { throw new CatalogUnavailableException(ex); }
        catch (JsonException ex) { throw new CatalogUnavailableException(ex); }
        catch (OperationCanceledException ex) when (!ct.IsCancellationRequested)
        { throw new CatalogUnavailableException(ex); }
    }

    public async Task<CatalogProduct> GetProductAsync(string id, CancellationToken ct)
    {
        try
        {
            using var response = await http.GetAsync($"api/products/{Uri.EscapeDataString(id)}", ct);
            if (response.StatusCode == HttpStatusCode.NotFound)
                throw new ArgumentException($"Product '{id}' does not exist.");
            if (!response.IsSuccessStatusCode) throw new CatalogUnavailableException();
            var product = await response.Content.ReadFromJsonAsync<CatalogProduct>(ct);
            if (product is null || product.Id != id) throw new CatalogUnavailableException();
            return product;
        }
        catch (HttpRequestException ex) { throw new CatalogUnavailableException(ex); }
        catch (JsonException ex) { throw new CatalogUnavailableException(ex); }
        catch (OperationCanceledException ex) when (!ct.IsCancellationRequested)
        { throw new CatalogUnavailableException(ex); }
    }
}
