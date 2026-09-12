package com.example.catalog;

import com.example.catalog.catalog.repository.ProductRepository;
import com.example.catalog.support.AbstractPostgresIntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Full-stack integration test: HTTP -> Controller -> Service -> Repository ->
 * PostgreSQL (Testcontainers). Also verifies Flyway migrations run and that the
 * API is reachable without any Authorization header.
 */
@SpringBootTest
@AutoConfigureMockMvc
class ProductIntegrationTest extends AbstractPostgresIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ProductRepository productRepository;

    @BeforeEach
    void cleanUp() {
        productRepository.deleteAll();
    }

    private Map<String, Object> body(String sku, String slug) {
        return Map.of(
                "sku", sku,
                "name", "iPhone " + sku,
                "slug", slug,
                "description", "A phone",
                "price", 999.99,
                "currency", "USD",
                "status", "ACTIVE");
    }

    @Test
    void fullCrudFlowWorksWithoutAuthentication() throws Exception {
        // CREATE - no Authorization header supplied.
        String created = mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body("SKU-INT", "slug-int"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andReturn().getResponse().getContentAsString();

        String id = objectMapper.readTree(created).get("id").asText();

        // READ
        mockMvc.perform(get("/api/v1/products/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sku").value("SKU-INT"));

        // LIST with pagination + filter
        mockMvc.perform(get("/api/v1/products")
                        .param("status", "ACTIVE")
                        .param("page", "0")
                        .param("size", "10")
                        .param("sort", "name,asc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].sku").value("SKU-INT"));
    }

    @Test
    void duplicateSkuReturnsConflict() throws Exception {
        mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body("DUP", "slug-dup-1"))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body("DUP", "slug-dup-2"))))
                .andExpect(status().isConflict());
    }

    @Test
    void listEndpointIsReachableWithoutAuthorizationHeader() throws Exception {
        mockMvc.perform(get("/api/v1/products"))
                .andExpect(status().isOk());
    }
}
