-- Script para agregar 10 productos con costos reales en USD
-- Productos de tecnología y electrónicos con precios del mercado internacional 2025

INSERT INTO productos (nombre, categoria, costo_unitario, demanda_anual, costo_pedido, costo_mantenimiento, stock_actual, stock_minimo, stock_maximo, punto_reorden, fecha_ultima_actualizacion) VALUES

-- 1. Laptop HP Pavilion 15
('Laptop HP Pavilion 15', 'Computadores', 699.99, 120, 35.00, 0.25, 8, 5, 50, 12, NOW()),

-- 2. iPhone 15 Pro
('iPhone 15 Pro 256GB', 'Telefonía', 1299.99, 200, 50.00, 0.20, 15, 8, 60, 20, NOW()),

-- 3. Samsung Galaxy S24 Ultra
('Samsung Galaxy S24 Ultra', 'Telefonía', 1199.99, 180, 45.00, 0.22, 12, 6, 45, 15, NOW()),

-- 4. iPad Air 5ta Gen
('iPad Air 5ta Generación', 'Tablets', 799.99, 80, 30.00, 0.18, 6, 4, 30, 10, NOW()),

-- 5. MacBook Air M3
('MacBook Air M3 13"', 'Computadores', 1599.99, 60, 60.00, 0.15, 3, 2, 25, 8, NOW()),

-- 6. Monitor Gaming ASUS ROG
('Monitor ASUS ROG 27" 144Hz', 'Monitores', 449.99, 150, 25.00, 0.20, 20, 10, 80, 25, NOW()),

-- 7. Teclado Mecánico Corsair
('Teclado Corsair K95 RGB', 'Periféricos', 159.99, 300, 12.00, 0.30, 35, 20, 150, 45, NOW()),

-- 8. Mouse Gaming Logitech
('Mouse Logitech G Pro X', 'Periféricos', 94.99, 400, 10.00, 0.35, 18, 25, 200, 50, NOW()),

-- 9. Auriculares Sony WH-1000XM5
('Auriculares Sony WH-1000XM5', 'Audio', 299.99, 180, 20.00, 0.25, 22, 15, 100, 30, NOW()),

-- 10. Disco SSD Samsung 1TB
('SSD Samsung 970 EVO Plus 1TB', 'Almacenamiento', 119.99, 250, 15.00, 0.28, 40, 30, 200, 60, NOW());

-- Verificar los productos insertados
SELECT 
    id,
    nombre,
    categoria,
    costo_unitario,
    stock_actual,
    stock_minimo,
    punto_reorden,
    CASE 
        WHEN stock_actual <= stock_minimo THEN 'CRÍTICO'
        WHEN stock_actual <= punto_reorden THEN 'BAJO'
        ELSE 'NORMAL'
    END as estado_stock
FROM productos 
ORDER BY id DESC 
LIMIT 10;
