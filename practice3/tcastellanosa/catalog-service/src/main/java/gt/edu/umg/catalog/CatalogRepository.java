package gt.edu.umg.catalog;
import java.util.*; import org.springframework.data.mongodb.repository.MongoRepository;
public interface CatalogRepository extends MongoRepository<CatalogItem,String> {
 List<CatalogItem> findByTypeOrderByName(String type);
 List<CatalogItem> findByTypeAndNameContainingIgnoreCaseOrderByName(String type, String name);
 Optional<CatalogItem> findByIdAndType(String id, String type);
 boolean existsByTypeAndNameIgnoreCase(String type, String name);
}
