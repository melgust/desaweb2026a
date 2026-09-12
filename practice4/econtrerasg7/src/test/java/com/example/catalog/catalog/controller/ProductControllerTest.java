package com.example.catalog.catalog.controller;

import com.example.catalog.catalog.dto.ProductResponse;
import com.example.catalog.catalog.entity.ProductStatus;
import com.example.catalog.catalog.service.ProductService;
import com.example.catalog.common.exception.DuplicateProductException;
import com.example.catalog.common.exception.ProductNotFoundException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ProductController.class)
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private ProductService productService;

    private ProductResponse sampleResponse(UUID id) {
        return new ProductResponse(id, "SKU-1", "iPhone", "iphone", "A phone",
                new BigDecimal("999.9900"), "USD", ProductStatus.ACTIVE,
                Instant.now(), Instant.now(), 0L);
    }

    private Map<String, Object> validBody() {
        return Map.of(
                "sku", "SKU-1",
                "name", "iPhone",
                "slug", "iphone",
                "description", "A phone",
                "price", 999.99,
                "currency", "USD",
                "status", "ACTIVE");
    }

    @Test
    void createReturns201() throws Exception {
        UUID id = UUID.randomUUID();
        when(productService.create(any())).thenReturn(sampleResponse(id));

        mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validBody())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(id.toString()))
                .andExpect(jsonPath("$.sku").value("SKU-1"));
    }

    @Test
    void createReturns400OnValidationError() throws Exception {
        Map<String, Object> invalid = Map.of(
                "sku", "",
                "name", "iPhone",
                "slug", "iphone",
                "price", -5,
                "currency", "US",
                "status", "ACTIVE");

        mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Validation Failed"));
    }

    @Test
    void createReturns409OnDuplicate() throws Exception {
        when(productService.create(any())).thenThrow(DuplicateProductException.forSku("SKU-1"));

        mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validBody())))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.title").value("Duplicate Product"));
    }

    @Test
    void getByIdReturns200() throws Exception {
        UUID id = UUID.randomUUID();
        when(productService.getById(id)).thenReturn(sampleResponse(id));

        mockMvc.perform(get("/api/v1/products/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id.toString()));
    }

    @Test
    void getByIdReturns404() throws Exception {
        UUID id = UUID.randomUUID();
        when(productService.getById(id)).thenThrow(new ProductNotFoundException(id));

        mockMvc.perform(get("/api/v1/products/{id}", id))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title").value("Product Not Found"));
    }

    @Test
    void listReturns200WithoutAuthentication() throws Exception {
        when(productService.findAll(any(), any(), any(), any()))
                .thenReturn(org.springframework.data.domain.Page.empty());

        // Note: no Authorization header is sent - the API is unauthenticated.
        mockMvc.perform(get("/api/v1/products"))
                .andExpect(status().isOk());
    }

    @Test
    void updateReturns200() throws Exception {
        UUID id = UUID.randomUUID();
        when(productService.update(eq(id), any())).thenReturn(sampleResponse(id));

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .put("/api/v1/products/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validBody())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id.toString()));
    }

    @Test
    void deleteReturns204() throws Exception {
        UUID id = UUID.randomUUID();

        mockMvc.perform(delete("/api/v1/products/{id}", id))
                .andExpect(status().isNoContent());
    }
}
