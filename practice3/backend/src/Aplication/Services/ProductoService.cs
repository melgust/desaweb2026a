using Backend.src.Domain.Entities;
using MySqlConnector;

namespace Backend.src.Aplication.Services;

public sealed class ProductoService(IConfiguration configuration) : IProductoService
{
    public async Task<IReadOnlyList<Producto>> GetAllAsync(CancellationToken cancellationToken)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("DefaultConnection no está configurada.");
        const string query = """
            SELECT IdProducto, Nombre, Descripcion, Precio, Stock, ImagenUrl, Estado
            FROM Producto
            ORDER BY IdProducto;
            """;

        var products = new List<Producto>();
        await using var connection = new MySqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);
        await using var command = new MySqlCommand(query, connection);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        while (await reader.ReadAsync(cancellationToken))
        {
            products.Add(new Producto
            {
                IdProducto = reader.GetInt32("IdProducto"),
                Nombre = reader.GetString("Nombre"),
                Descripcion = reader.GetString("Descripcion"),
                Precio = reader.GetDecimal("Precio"),
                Stock = reader.GetInt32("Stock"),
                ImagenUrl = reader.IsDBNull(reader.GetOrdinal("ImagenUrl"))
                    ? null
                    : reader.GetString("ImagenUrl"),
                Estado = reader.GetBoolean("Estado")
            });
        }

        return products;
    }

    public async Task<Producto?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("DefaultConnection no está configurada.");
        const string query = """
            SELECT IdProducto, Nombre, Descripcion, Precio, Stock, ImagenUrl, Estado
            FROM Producto
            WHERE IdProducto = @IdProducto;
            """;

        await using var connection = new MySqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);
        await using var command = new MySqlCommand(query, connection);
        command.Parameters.AddWithValue("@IdProducto", id);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return null;
        }

        return new Producto
        {
            IdProducto = reader.GetInt32("IdProducto"),
            Nombre = reader.GetString("Nombre"),
            Descripcion = reader.GetString("Descripcion"),
            Precio = reader.GetDecimal("Precio"),
            Stock = reader.GetInt32("Stock"),
            ImagenUrl = reader.IsDBNull(reader.GetOrdinal("ImagenUrl"))
                ? null
                : reader.GetString("ImagenUrl"),
            Estado = reader.GetBoolean("Estado")
        };
    }
}