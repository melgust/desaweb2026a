package gt.edu.umg.catalog;
import java.util.List;
 import java.util.Map;
 import java.util.NoSuchElementException;
 import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
@RestController @RequestMapping("/api") @CrossOrigin(origins="*") public class CatalogController {
 private final CatalogRepository repo; public CatalogController(CatalogRepository repo){this.repo=repo;}
 @GetMapping("/products") public Map<String,Object> products(@RequestParam(required=false,defaultValue="") String search, @RequestParam(defaultValue="1") int page, @RequestParam(defaultValue="10") int pageSize){
  page=Math.max(page,1); pageSize=Math.min(Math.max(pageSize,1),100); List<CatalogItem> all=search.isBlank()?repo.findByTypeOrderByName("product"):repo.findByTypeAndNameContainingIgnoreCaseOrderByName("product",search); int from=Math.min((page-1)*pageSize,all.size()); int to=Math.min(from+pageSize,all.size());
  return Map.of("items",all.subList(from,to),"totalItems",all.size(),"page",page,"pageSize",pageSize,"totalPages",(int)Math.ceil((double)all.size()/pageSize));
 }
 @GetMapping("/{type:categories|suppliers}") public List<CatalogItem> all(@PathVariable String type){return repo.findByTypeOrderByName(singular(type));}
 @GetMapping("/{type:products|categories|suppliers}/{id}") public CatalogItem one(@PathVariable String type,@PathVariable String id){return repo.findByIdAndType(id,singular(type)).orElseThrow(()->new NoSuchElementException("Recurso no encontrado"));}
 @PostMapping("/{type:products|categories|suppliers}") public ResponseEntity<CatalogItem> create(@PathVariable String type,@Valid @RequestBody CatalogItem item){item.id=UUID.randomUUID().toString();item.type=singular(type);item.createdAt=java.time.Instant.now();item.updatedAt=item.createdAt;if(repo.existsByTypeAndNameIgnoreCase(item.type,item.name)) throw new IllegalArgumentException("Ya existe un registro con ese nombre"); return ResponseEntity.status(201).body(repo.save(item));}
 @PutMapping("/{type:products|categories|suppliers}/{id}") public CatalogItem update(@PathVariable String type,@PathVariable String id,@Valid @RequestBody CatalogItem item){CatalogItem old=one(type,id); item.id=old.id;item.type=old.type;item.createdAt=old.createdAt;item.updatedAt=java.time.Instant.now();return repo.save(item);}
 @DeleteMapping("/{type:products|categories|suppliers}/{id}") public ResponseEntity<Void> delete(@PathVariable String type,@PathVariable String id){repo.delete(one(type,id));return ResponseEntity.noContent().build();}
 @PostMapping("/products/{id}/stock") public CatalogItem stock(@PathVariable String id,@RequestParam int quantity){CatalogItem p=one("products",id); if(!p.isActive)throw new IllegalArgumentException("Producto inactivo"); p.stock+=quantity;if(p.stock<0)throw new IllegalArgumentException("Stock insuficiente");p.updatedAt=java.time.Instant.now();return repo.save(p);}
 private String singular(String type){return type.endsWith("ies")?type.substring(0,type.length()-3)+"y":type.substring(0,type.length()-1);}
}
