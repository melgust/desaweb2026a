using System;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Api.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260904000000_AddSuppliersInvoices")]
public partial class AddSuppliersInvoices : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "Suppliers",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "char(36)", nullable: false),
                Name = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false),
                TaxId = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: true),
                Email = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: true),
                Phone = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: true),
                IsActive = table.Column<bool>(type: "tinyint(1)", nullable: false),
                CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
            },
            constraints: table => table.PrimaryKey("PK_Suppliers", x => x.Id));

        migrationBuilder.CreateTable(
            name: "Invoices",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "char(36)", nullable: false),
                InvoiceNumber = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false),
                SupplierId = table.Column<Guid>(type: "char(36)", nullable: false),
                InvoiceDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                Total = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Invoices", x => x.Id);
                table.ForeignKey("FK_Invoices_Suppliers_SupplierId", x => x.SupplierId, "Suppliers", "Id", onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "InvoiceDetails",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "char(36)", nullable: false),
                InvoiceId = table.Column<Guid>(type: "char(36)", nullable: false),
                ProductId = table.Column<Guid>(type: "char(36) CHARACTER SET ascii COLLATE ascii_general_ci", nullable: false),
                Quantity = table.Column<int>(type: "int", nullable: false),
                UnitPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                Subtotal = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_InvoiceDetails", x => x.Id);
                table.ForeignKey("FK_InvoiceDetails_Invoices_InvoiceId", x => x.InvoiceId, "Invoices", "Id", onDelete: ReferentialAction.Cascade);
                table.ForeignKey("FK_InvoiceDetails_Products_ProductId", x => x.ProductId, "Products", "Id", onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateIndex(name: "IX_Suppliers_Name", table: "Suppliers", column: "Name", unique: true);
        migrationBuilder.CreateIndex(name: "IX_Invoices_InvoiceNumber", table: "Invoices", column: "InvoiceNumber", unique: true);
        migrationBuilder.CreateIndex(name: "IX_Invoices_SupplierId", table: "Invoices", column: "SupplierId");
        migrationBuilder.CreateIndex(name: "IX_InvoiceDetails_ProductId", table: "InvoiceDetails", column: "ProductId");
        migrationBuilder.CreateIndex(name: "IX_InvoiceDetails_InvoiceId_ProductId", table: "InvoiceDetails", columns: new[] { "InvoiceId", "ProductId" }, unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "InvoiceDetails");
        migrationBuilder.DropTable(name: "Invoices");
        migrationBuilder.DropTable(name: "Suppliers");
    }
}
