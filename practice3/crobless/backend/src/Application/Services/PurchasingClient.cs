using System.Net;
using System.Net.Http.Json;
using Application.DTOs;

namespace Application.Services;

public class PurchasingUnavailableException : Exception
{
    public PurchasingUnavailableException() : base("El servicio de proveedores y facturas no está disponible.") { }
}

public class PurchasingClient
{
    private readonly HttpClient _http;
    public PurchasingClient(HttpClient http) => _http = http;
    public async Task<Dictionary<Guid, SupplierDto>> SuppliersAsync(CancellationToken ct)
    {
        try
        {
            using var response = await _http.GetAsync("internal/suppliers", ct);
            if (!response.IsSuccessStatusCode) throw new PurchasingUnavailableException();
            var suppliers = await response.Content.ReadFromJsonAsync<List<SupplierDto>>(ct) ?? [];
            return suppliers.ToDictionary(s => s.Id);
        }
        catch (HttpRequestException) { throw new PurchasingUnavailableException(); }
        catch (TaskCanceledException) when (!ct.IsCancellationRequested) { throw new PurchasingUnavailableException(); }
    }
    public async Task ReserveProductDeletionAsync(Guid id, CancellationToken ct)
    {
        try
        {
            using var response = await _http.PutAsync($"internal/products/{id}/deletion", null, ct);
            if (response.StatusCode == HttpStatusCode.BadRequest)
                throw new InvalidOperationException("No se puede eliminar un producto utilizado por facturas.");
            if (!response.IsSuccessStatusCode) throw new PurchasingUnavailableException();
        }
        catch (HttpRequestException) { throw new PurchasingUnavailableException(); }
        catch (TaskCanceledException) when (!ct.IsCancellationRequested) { throw new PurchasingUnavailableException(); }
    }
}
