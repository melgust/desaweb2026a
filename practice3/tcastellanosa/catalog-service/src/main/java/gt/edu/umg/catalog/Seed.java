package gt.edu.umg.catalog;
import org.springframework.boot.CommandLineRunner;
 import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
@Configuration class Seed {
 @Bean CommandLineRunner catalogSeed(CatalogRepository r){return a->{
  CatalogItem hardware=ensure(r,"category","Hardware");
  CatalogItem office=ensure(r,"category","Oficina");
  CatalogItem software=ensure(r,"category","Software");
  CatalogItem s1=ensure(r,"supplier","Tech Supplies Guatemala");s1.taxId="GT-987654-1";s1.email="sales@techsupplies.example";s1.phone="+502 2200-1000";r.save(s1);
  CatalogItem s2=ensure(r,"supplier","Office World Guatemala");s2.taxId="GT-123456-7";s2.email="ventas@officeworld.example";s2.phone="+502 2200-2000";r.save(s2);
  CatalogItem s3=ensure(r,"supplier","Software Partners");s3.taxId="GT-555555-5";s3.email="support@softwarepartners.example";s3.phone="+502 2200-3000";r.save(s3);
  product(r,"Laptop Pro 14","Laptop empresarial",hardware.id,950,23);
  product(r,"Wireless Mouse","Mouse ergonomico inalambrico",hardware.id,18.50,45);
  product(r,"Office Chair","Silla de oficina ajustable",office.id,135,18);
  product(r,"Business Suite","Licencia anual de productividad",software.id,299,10);
  product(r,"USB-C Dock","Estacion de conexion empresarial",hardware.id,89.99,12);
 };}
 private CatalogItem ensure(CatalogRepository r,String type,String name){return r.findByTypeAndNameContainingIgnoreCaseOrderByName(type,name).stream().filter(x->x.name.equalsIgnoreCase(name)).findFirst().orElseGet(()->{CatalogItem item=new CatalogItem();item.id=java.util.UUID.randomUUID().toString();item.type=type;item.name=name;return r.save(item);});}
 private void product(CatalogRepository r,String name,String description,String categoryId,double price,int stock){CatalogItem p=ensure(r,"product",name);p.description=description;p.categoryId=categoryId;p.price=price;p.stock=stock;p.isActive=true;r.save(p);}
}
