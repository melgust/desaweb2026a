using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Api.Migrations;

public partial class DecoupleInvoiceCatalog : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>("ProductName", "Invoices", type: "varchar(255)", maxLength: 255, nullable: true)
            .Annotation("MySql:CharSet", "utf8mb4");
        migrationBuilder.AddColumn<string>("SupplierName", "Invoices", type: "varchar(255)", maxLength: 255, nullable: true)
            .Annotation("MySql:CharSet", "utf8mb4");

        migrationBuilder.Sql("""
            UPDATE Invoices i
            INNER JOIN Products p ON p.Id = i.ProductId
            INNER JOIN Suppliers s ON s.Id = i.SupplierId
            SET i.ProductName = p.Name, i.SupplierName = s.Name;
            """);

        migrationBuilder.DropForeignKey("FK_Invoices_Products_ProductId", "Invoices");
        migrationBuilder.DropForeignKey("FK_Invoices_Suppliers_SupplierId", "Invoices");
        migrationBuilder.DropIndex("IX_Invoices_ProductId", "Invoices");
        migrationBuilder.DropIndex("IX_Invoices_SupplierId", "Invoices");

        migrationBuilder.AlterColumn<string>(
            name: "SupplierId", table: "Invoices", type: "varchar(64)", maxLength: 64, nullable: false,
            oldClrType: typeof(Guid), oldType: "char(36)")
            .Annotation("MySql:CharSet", "utf8mb4")
            .OldAnnotation("Relational:Collation", "ascii_general_ci");
        migrationBuilder.AlterColumn<string>(
            name: "ProductId", table: "Invoices", type: "varchar(64)", maxLength: 64, nullable: false,
            oldClrType: typeof(Guid), oldType: "char(36)")
            .Annotation("MySql:CharSet", "utf8mb4")
            .OldAnnotation("Relational:Collation", "ascii_general_ci");
        migrationBuilder.AlterColumn<string>(
            name: "ProductName", table: "Invoices", type: "varchar(255)", maxLength: 255, nullable: false,
            oldClrType: typeof(string), oldType: "varchar(255)", oldMaxLength: 255, oldNullable: true)
            .Annotation("MySql:CharSet", "utf8mb4")
            .OldAnnotation("MySql:CharSet", "utf8mb4");
        migrationBuilder.AlterColumn<string>(
            name: "SupplierName", table: "Invoices", type: "varchar(255)", maxLength: 255, nullable: false,
            oldClrType: typeof(string), oldType: "varchar(255)", oldMaxLength: 255, oldNullable: true)
            .Annotation("MySql:CharSet", "utf8mb4")
            .OldAnnotation("MySql:CharSet", "utf8mb4");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AlterColumn<Guid>(
            name: "SupplierId", table: "Invoices", type: "char(36)", nullable: false,
            collation: "ascii_general_ci", oldClrType: typeof(string), oldType: "varchar(64)", oldMaxLength: 64)
            .OldAnnotation("MySql:CharSet", "utf8mb4");
        migrationBuilder.AlterColumn<Guid>(
            name: "ProductId", table: "Invoices", type: "char(36)", nullable: false,
            collation: "ascii_general_ci", oldClrType: typeof(string), oldType: "varchar(64)", oldMaxLength: 64)
            .OldAnnotation("MySql:CharSet", "utf8mb4");

        migrationBuilder.CreateIndex("IX_Invoices_ProductId", "Invoices", "ProductId");
        migrationBuilder.CreateIndex("IX_Invoices_SupplierId", "Invoices", "SupplierId");
        migrationBuilder.AddForeignKey(
            "FK_Invoices_Products_ProductId", "Invoices", "ProductId", "Products",
            principalColumn: "Id", onDelete: ReferentialAction.Restrict);
        migrationBuilder.AddForeignKey(
            "FK_Invoices_Suppliers_SupplierId", "Invoices", "SupplierId", "Suppliers",
            principalColumn: "Id", onDelete: ReferentialAction.Restrict);
        migrationBuilder.DropColumn("ProductName", "Invoices");
        migrationBuilder.DropColumn("SupplierName", "Invoices");
    }
}
