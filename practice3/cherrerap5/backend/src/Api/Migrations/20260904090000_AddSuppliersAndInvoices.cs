using System;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Api.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260904090000_AddSuppliersAndInvoices")]
public partial class AddSuppliersAndInvoices : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "Suppliers",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                Name = table.Column<string>(type: "varchar(255)", nullable: false).Annotation("MySql:CharSet", "utf8mb4"),
                TaxId = table.Column<string>(type: "varchar(255)", nullable: true).Annotation("MySql:CharSet", "utf8mb4"),
                ContactName = table.Column<string>(type: "longtext", nullable: true).Annotation("MySql:CharSet", "utf8mb4"),
                Email = table.Column<string>(type: "longtext", nullable: true).Annotation("MySql:CharSet", "utf8mb4"),
                Phone = table.Column<string>(type: "longtext", nullable: true).Annotation("MySql:CharSet", "utf8mb4"),
                Address = table.Column<string>(type: "longtext", nullable: true).Annotation("MySql:CharSet", "utf8mb4"),
                IsActive = table.Column<bool>(type: "tinyint(1)", nullable: false),
                CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
            },
            constraints: table => table.PrimaryKey("PK_Suppliers", x => x.Id))
            .Annotation("MySql:CharSet", "utf8mb4");

        migrationBuilder.CreateTable(
            name: "Invoices",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                Number = table.Column<string>(type: "varchar(255)", nullable: false).Annotation("MySql:CharSet", "utf8mb4"),
                SupplierId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                ProductId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                InvoiceDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                DueDate = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                Quantity = table.Column<int>(type: "int", nullable: false),
                UnitPrice = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                Total = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                Status = table.Column<string>(type: "longtext", nullable: false).Annotation("MySql:CharSet", "utf8mb4"),
                Notes = table.Column<string>(type: "longtext", nullable: true).Annotation("MySql:CharSet", "utf8mb4"),
                CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Invoices", x => x.Id);
                table.ForeignKey("FK_Invoices_Products_ProductId", x => x.ProductId, "Products", "Id", onDelete: ReferentialAction.Restrict);
                table.ForeignKey("FK_Invoices_Suppliers_SupplierId", x => x.SupplierId, "Suppliers", "Id", onDelete: ReferentialAction.Restrict);
            })
            .Annotation("MySql:CharSet", "utf8mb4");

        migrationBuilder.CreateIndex("IX_Suppliers_Name", "Suppliers", "Name");
        migrationBuilder.CreateIndex("IX_Suppliers_TaxId", "Suppliers", "TaxId", unique: true);
        migrationBuilder.CreateIndex("IX_Invoices_Number", "Invoices", "Number", unique: true);
        migrationBuilder.CreateIndex("IX_Invoices_ProductId", "Invoices", "ProductId");
        migrationBuilder.CreateIndex("IX_Invoices_SupplierId", "Invoices", "SupplierId");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable("Invoices");
        migrationBuilder.DropTable("Suppliers");
    }
}
