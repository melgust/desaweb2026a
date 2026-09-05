using Application.DTOs;
using Domain.Entities;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Application.Services;

public interface ICustomerService
{
    Task<CustomerPagedResult> GetCustomersAsync(
        string? search,
        int page,
        int pageSize,
        CancellationToken ct
    );

    Task<CustomerDto> GetByIdAsync(Guid id, CancellationToken ct);

    Task<CustomerDto> CreateAsync(
        CreateCustomerRequest request,
        CancellationToken ct
    );

    Task<CustomerDto> UpdateAsync(
        Guid id,
        UpdateCustomerRequest request,
        CancellationToken ct
    );

    Task DeleteAsync(Guid id, CancellationToken ct);
}

public class CustomerService : ICustomerService
{
    private readonly AppDbContext _db;

    public CustomerService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<CustomerPagedResult> GetCustomersAsync(
        string? search,
        int page,
        int pageSize,
        CancellationToken ct
    )
    {
        var query = _db.Customers.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var lower = search.ToLower();

            query = query.Where(c =>
                c.Name.ToLower().Contains(lower) ||
                (c.Nit != null && c.Nit.ToLower().Contains(lower)) ||
                (c.Email != null && c.Email.ToLower().Contains(lower))
            );
        }

        query = query.OrderBy(c => c.Name);

        int totalItems = await query.CountAsync(ct);
        int totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new CustomerDto(
                c.Id,
                c.Name,
                c.Nit,
                c.Address,
                c.Phone,
                c.Email,
                c.IsActive,
                c.CreatedAt
            ))
            .ToListAsync(ct);

        return new CustomerPagedResult(
            items,
            totalItems,
            page,
            pageSize,
            totalPages
        );
    }

    public async Task<CustomerDto> GetByIdAsync(
        Guid id,
        CancellationToken ct
    )
    {
        var customer = await _db.Customers
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id, ct)
            ?? throw new KeyNotFoundException("Customer not found.");

        return new CustomerDto(
            customer.Id,
            customer.Name,
            customer.Nit,
            customer.Address,
            customer.Phone,
            customer.Email,
            customer.IsActive,
            customer.CreatedAt
        );
    }

    public async Task<CustomerDto> CreateAsync(
        CreateCustomerRequest request,
        CancellationToken ct
    )
    {
        var customer = new Customer
        {
            Name = request.Name,
            Nit = request.Nit,
            Address = request.Address,
            Phone = request.Phone,
            Email = request.Email,
            IsActive = request.IsActive
        };

        _db.Customers.Add(customer);

        await _db.SaveChangesAsync(ct);

        return new CustomerDto(
            customer.Id,
            customer.Name,
            customer.Nit,
            customer.Address,
            customer.Phone,
            customer.Email,
            customer.IsActive,
            customer.CreatedAt
        );
    }

    public async Task<CustomerDto> UpdateAsync(
        Guid id,
        UpdateCustomerRequest request,
        CancellationToken ct
    )
    {
        var customer = await _db.Customers
            .FirstOrDefaultAsync(c => c.Id == id, ct)
            ?? throw new KeyNotFoundException("Customer not found.");

        customer.Name = request.Name;
        customer.Nit = request.Nit;
        customer.Address = request.Address;
        customer.Phone = request.Phone;
        customer.Email = request.Email;
        customer.IsActive = request.IsActive;
        customer.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        return new CustomerDto(
            customer.Id,
            customer.Name,
            customer.Nit,
            customer.Address,
            customer.Phone,
            customer.Email,
            customer.IsActive,
            customer.CreatedAt
        );
    }

    public async Task DeleteAsync(
        Guid id,
        CancellationToken ct
    )
    {
        var customer = await _db.Customers
            .FirstOrDefaultAsync(c => c.Id == id, ct)
            ?? throw new KeyNotFoundException("Customer not found.");

        _db.Customers.Remove(customer);

        await _db.SaveChangesAsync(ct);
    }
}