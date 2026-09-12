package com.crobless.purchasing;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;

public final class Models {
    private Models() {}
    @Document("suppliers")
    public static class Supplier {
        @Id public String id;
        public String name;
        public String contactEmail;
        public String phone;
        public boolean isActive;
        public Instant createdAt;
        public Instant updatedAt;
        @JsonIgnore public boolean deleted;
    }
    @Document("invoices")
    public static class Invoice {
        @Id public String id;
        public String invoiceNumber;
        @JsonIgnore public String numberKey;
        public LocalDate invoiceDate;
        public String supplierId;
        public String supplierName;
        @Field(targetType = FieldType.DECIMAL128) public BigDecimal subtotal;
        @Field(targetType = FieldType.DECIMAL128) public BigDecimal tax;
        @Field(targetType = FieldType.DECIMAL128) public BigDecimal total;
        public String notes;
        public Instant createdAt;
        public List<Detail> items;
    }
    public record Detail(String id, String productId, String productName, int quantity,
        @Field(targetType = FieldType.DECIMAL128) BigDecimal unitPrice,
        @Field(targetType = FieldType.DECIMAL128) BigDecimal subtotal) {}
    public record SupplierRequest(@NotBlank @Size(max=150) String name,
        @Email @Size(max=150) String contactEmail, @Size(max=50) String phone, boolean isActive) {}
    public record ItemRequest(@NotNull String productId, @NotNull @Positive Integer quantity,
        @NotNull @DecimalMin("0") @Digits(integer=16, fraction=2) BigDecimal unitPrice) {}
    public record InvoiceRequest(@NotBlank @Size(max=50) String invoiceNumber,
        @NotNull LocalDate invoiceDate, @NotNull String supplierId, @Size(max=2000) String notes,
        @NotEmpty @Size(max=500) List<@NotNull @Valid ItemRequest> items) {}
    public record SupplierPage(List<Supplier> items, long totalItems, int page, int pageSize, long totalPages) {}
    public record Product(String id, String name) {}
    public record Snapshot(List<Supplier> suppliers, List<Invoice> invoices) {}
}
