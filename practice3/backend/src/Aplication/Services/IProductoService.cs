using Backend.src.Domain.Entities;

namespace Backend.src.Aplication.Services;

public interface IProductoService
{
    Task<IReadOnlyList<Producto>> GetAllAsync(CancellationToken cancellationToken);
    Task<Producto?> GetByIdAsync(int id, CancellationToken cancellationToken);
}