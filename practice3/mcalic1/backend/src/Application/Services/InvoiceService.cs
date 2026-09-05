using Application.DTOs;
using Domain.Entities;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Application.Services;

public interface IInvoiceService
{
    Task<InvoicePagedResult> GetInvoicesAsync(
        int page,
        int pageSize,
        CancellationToken ct
    );

    Task<InvoiceDto> GetByIdAsync(
        Guid id,
        CancellationToken ct
    );

    Task<InvoiceDto> CreateAsync(
        CreateInvoiceRequest request,
        CancellationToken ct
    );
}

public class InvoiceService : IInvoiceService
{
    private readonly AppDbContext _db;

    public InvoiceService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<InvoicePagedResult> GetInvoicesAsync(
        int page,
        int pageSize,
        CancellationToken ct
    )
    {
        if (page < 1)
            page = 1;

        if (pageSize < 1)
            pageSize = 10;

        var query = _db.Invoices
            .AsNoTracking()
            .Include(i => i.Customer)
            .Include(i => i.Details)
                .ThenInclude(d => d.Product)
            .OrderByDescending(i => i.Date);

        int totalItems = await query.CountAsync(ct);

        int totalPages = (int)Math.Ceiling(
            totalItems / (double)pageSize
        );

        var invoices = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var items = invoices
            .Select(MapInvoice)
            .ToList();

        return new InvoicePagedResult(
            items,
            totalItems,
            page,
            pageSize,
            totalPages
        );
    }

    public async Task<InvoiceDto> GetByIdAsync(
        Guid id,
        CancellationToken ct
    )
    {
        var invoice = await _db.Invoices
            .AsNoTracking()
            .Include(i => i.Customer)
            .Include(i => i.Details)
                .ThenInclude(d => d.Product)
            .FirstOrDefaultAsync(i => i.Id == id, ct)
            ?? throw new KeyNotFoundException(
                "Invoice not found."
            );

        return MapInvoice(invoice);
    }

    public async Task<InvoiceDto> CreateAsync(
        CreateInvoiceRequest request,
        CancellationToken ct
    )
    {
        if (string.IsNullOrWhiteSpace(request.InvoiceNumber))
        {
            throw new ArgumentException(
                "Invoice number is required."
            );
        }

        if (request.Details == null || request.Details.Count == 0)
        {
            throw new ArgumentException(
                "The invoice must contain at least one product."
            );
        }

        var invoiceNumber = request.InvoiceNumber.Trim();

        bool numberExists = await _db.Invoices
            .AnyAsync(
                i => i.InvoiceNumber == invoiceNumber,
                ct
            );

        if (numberExists)
        {
            throw new InvalidOperationException(
                "Invoice number already exists."
            );
        }

        var customer = await _db.Customers
            .FirstOrDefaultAsync(
                c => c.Id == request.CustomerId,
                ct
            )
            ?? throw new KeyNotFoundException(
                "Customer not found."
            );

        if (!customer.IsActive)
        {
            throw new InvalidOperationException(
                "Customer is inactive."
            );
        }

        var groupedDetails = request.Details
            .GroupBy(d => d.ProductId)
            .Select(g => new
            {
                ProductId = g.Key,
                Quantity = g.Sum(x => x.Quantity)
            })
            .ToList();

        if (groupedDetails.Any(d => d.Quantity <= 0))
        {
            throw new ArgumentException(
                "Product quantity must be greater than zero."
            );
        }

        var productIds = groupedDetails
            .Select(d => d.ProductId)
            .ToList();

        var products = await _db.Products
            .Where(p => productIds.Contains(p.Id))
            .ToListAsync(ct);

        if (products.Count != productIds.Count)
        {
            throw new KeyNotFoundException(
                "One or more products were not found."
            );
        }

        await using var transaction =
            await _db.Database.BeginTransactionAsync(ct);

        try
        {
            var invoice = new Invoice
            {
                InvoiceNumber = invoiceNumber,
                CustomerId = request.CustomerId,
                Date = request.Date ?? DateTime.UtcNow,
                Total = 0
            };

            decimal total = 0;

            foreach (var detailRequest in groupedDetails)
            {
                var product = products.First(
                    p => p.Id == detailRequest.ProductId
                );

                if (!product.IsActive)
                {
                    throw new InvalidOperationException(
                        $"Product '{product.Name}' is inactive."
                    );
                }

                if (product.Stock < detailRequest.Quantity)
                {
                    throw new InvalidOperationException(
                        $"Not enough stock for product '{product.Name}'."
                    );
                }

                decimal unitPrice = product.Price;

                decimal subtotal =
                    unitPrice * detailRequest.Quantity;

                invoice.Details.Add(
                    new InvoiceDetail
                    {
                        ProductId = product.Id,
                        Quantity = detailRequest.Quantity,
                        UnitPrice = unitPrice,
                        Subtotal = subtotal
                    }
                );

                product.Stock -= detailRequest.Quantity;

                total += subtotal;
            }

            invoice.Total = total;

            _db.Invoices.Add(invoice);

            await _db.SaveChangesAsync(ct);

            await transaction.CommitAsync(ct);

            var createdInvoice = await _db.Invoices
                .AsNoTracking()
                .Include(i => i.Customer)
                .Include(i => i.Details)
                    .ThenInclude(d => d.Product)
                .FirstAsync(i => i.Id == invoice.Id, ct);

            return MapInvoice(createdInvoice);
        }
        catch
        {
            await transaction.RollbackAsync(ct);
            throw;
        }
    }

    private static InvoiceDto MapInvoice(
        Invoice invoice
    )
    {
        var details = invoice.Details
            .Select(d => new InvoiceDetailDto(
                d.Id,
                d.ProductId,
                d.Product.Name,
                d.Quantity,
                d.UnitPrice,
                d.Subtotal
            ))
            .ToList();

        return new InvoiceDto(
            invoice.Id,
            invoice.InvoiceNumber,
            invoice.Date,
            invoice.CustomerId,
            invoice.Customer.Name,
            invoice.Total,
            invoice.CreatedAt,
            details
        );
    }
}