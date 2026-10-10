CREATE DATABASE IF NOT EXISTS products_db;
USE products_db;

CREATE TABLE IF NOT EXISTS products (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  PRIMARY KEY (id)
);

INSERT IGNORE INTO products (id, name, price) VALUES
  (1, 'Laptop', 1200.00),
  (2, 'Mouse', 25.00);