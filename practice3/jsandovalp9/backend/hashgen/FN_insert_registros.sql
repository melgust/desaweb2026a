

SET cte_max_recursion_depth = 1000000;

INSERT INTO `Products` (`Id`, `Name`, `Description`, `Price`, `Stock`, `IsActive`, `CreatedAt`, `UpdatedAt`)
WITH RECURSIVE CTE AS (
    SELECT 1 AS n
    UNION ALL
    SELECT n + 1 FROM CTE WHERE n < 50000 -- Ajusta la cantidad aquí
)
SELECT 
    UUID(),
    CONCAT(
        ELT(FLOOR(1 + RAND() * 5), 'Laptop', 'Smartphone', 'Audífonos', 'Monitor', 'Teclado'), ' ',
        ELT(FLOOR(1 + RAND() * 5), 'Pro', 'Ultra', 'Gaming', 'Lite', 'Max'), ' ',
        FLOOR(100 + RAND() * 900)
    ),
    CONCAT('Descripción del producto ', UUID(), '. Excelente calidad.'),
    ROUND(10 + (RAND() * 1490), 30),
    FLOOR(RAND() * 501),
    FLOOR(RAND() * 2),
    NOW() - INTERVAL FLOOR(RAND() * 365) DAY - INTERVAL FLOOR(RAND() * 86400) SECOND,
    NOW()
FROM CTE;