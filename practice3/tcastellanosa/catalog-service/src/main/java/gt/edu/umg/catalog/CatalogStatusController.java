package gt.edu.umg.catalog;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CatalogStatusController {
    @GetMapping("/")
    public Map<String, String> status() {
        return Map.of("service", "catalog-service", "status", "ok", "api", "/api");
    }
}
