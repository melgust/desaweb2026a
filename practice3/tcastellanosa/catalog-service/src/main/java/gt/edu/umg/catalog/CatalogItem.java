package gt.edu.umg.catalog;
import jakarta.validation.constraints.*;
import java.time.Instant;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("catalog")
public class CatalogItem {
 @Id public String id;
 @NotBlank @Size(max=150) public String name;
 public String type;
 public String description;
 public String categoryId;
 public String taxId;
 @Email public String email;
 public String phone;
 public double price;
 public int stock;
 @JsonProperty("isActive") public boolean isActive = true;
 public Instant createdAt = Instant.now();
 public Instant updatedAt = Instant.now();
}
