package com.crobless.purchasing;

import static org.junit.jupiter.api.Assertions.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import jakarta.validation.Validation;
import org.junit.jupiter.api.Test;

class InvoiceValidationTest {
    @Test void decimalArithmeticDoesNotLoseCents() {
        assertEquals(new BigDecimal("0.30"), PurchasingService.lineTotal(3, new BigDecimal("0.10")));
        assertEquals(new BigDecimal("76.50"), PurchasingService.lineTotal(3, new BigDecimal("25.50")));
    }
    @Test void rejectsInvalidNestedDetailsAndEmptyInvoices() {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            var validator = factory.getValidator();
            var empty = new Models.InvoiceRequest("INV", LocalDate.now(), "supplier", null, List.of());
            assertFalse(validator.validate(empty).isEmpty());
            var invalid = new Models.InvoiceRequest("INV", LocalDate.now(), "supplier", null,
                List.of(new Models.ItemRequest("product", 0, new BigDecimal("1.001"))));
            assertEquals(2, validator.validate(invalid).size());
        }
    }
}
