-- ============================================================
-- PARKSYSTEM v2 - Base de Datos
-- ============================================================
CREATE DATABASE IF NOT EXISTS parksystem CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE parksystem;

CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol ENUM('admin','operador') DEFAULT 'operador',
    activo TINYINT(1) DEFAULT 1,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS configuracion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clave VARCHAR(80) NOT NULL UNIQUE,
    valor TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tarifas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo_vehiculo ENUM('carro','moto') NOT NULL,
    modalidad ENUM('dia','noche','24horas','mensualidad') NOT NULL,
    precio_hora DECIMAL(10,2) NOT NULL DEFAULT 0,
    precio_fraccion DECIMAL(10,2) NOT NULL DEFAULT 0,
    precio_mensualidad DECIMAL(10,2) NOT NULL DEFAULT 0,
    UNIQUE KEY uk (tipo_vehiculo, modalidad)
);

CREATE TABLE IF NOT EXISTS convenios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo ENUM('horas_gratis','descuento_fijo','porcentaje') NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    activo TINYINT(1) DEFAULT 1
);

CREATE TABLE IF NOT EXISTS casilleros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero INT NOT NULL UNIQUE,
    ocupado TINYINT(1) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS mensualidades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    placa VARCHAR(10) NOT NULL,
    tipo_vehiculo ENUM('carro','moto') NOT NULL,
    nombre_cliente VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    fecha_inicio DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    estado ENUM('activo','pendiente','vencido') DEFAULT 'activo',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pagos_mensualidad (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mensualidad_id INT NOT NULL,
    fecha_pago DATETIME DEFAULT CURRENT_TIMESTAMP,
    monto DECIMAL(10,2) NOT NULL,
    metodo_pago ENUM('efectivo','tarjeta','transferencia') DEFAULT 'efectivo',
    operador_id INT NOT NULL,
    FOREIGN KEY (mensualidad_id) REFERENCES mensualidades(id) ON DELETE CASCADE,
    FOREIGN KEY (operador_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS vehiculos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    placa VARCHAR(10) NOT NULL,
    tipo ENUM('carro','moto') NOT NULL,
    modalidad ENUM('dia','noche','24horas') DEFAULT 'dia',
    casillero_id INT NULL,
    hora_entrada DATETIME NOT NULL,
    hora_salida DATETIME NULL,
    tiempo_minutos INT NULL,
    tarifa_hora DECIMAL(10,2) DEFAULT 0,
    tarifa_fraccion DECIMAL(10,2) DEFAULT 0,
    horas_cobradas INT DEFAULT 0,
    fraccion_cobrada TINYINT(1) DEFAULT 0,
    subtotal DECIMAL(10,2) DEFAULT 0,
    descuento DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) DEFAULT 0,
    convenio_id INT NULL,
    tipo_salida ENUM('normal','convenio') DEFAULT 'normal',
    metodo_pago ENUM('efectivo','tarjeta','transferencia') DEFAULT 'efectivo',
    operador_entrada_id INT NOT NULL,
    operador_salida_id INT NULL,
    estado ENUM('activo','finalizado') DEFAULT 'activo',
    codigo_barras VARCHAR(60) UNIQUE,
    es_mensualidad TINYINT(1) DEFAULT 0,
    mensualidad_id INT NULL,
    FOREIGN KEY (casillero_id) REFERENCES casilleros(id) ON DELETE SET NULL,
    FOREIGN KEY (convenio_id) REFERENCES convenios(id) ON DELETE SET NULL,
    FOREIGN KEY (operador_entrada_id) REFERENCES usuarios(id),
    FOREIGN KEY (operador_salida_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (mensualidad_id) REFERENCES mensualidades(id) ON DELETE SET NULL
);

-- password: password
INSERT INTO usuarios (nombre, usuario, password, rol) VALUES
('Administrador', 'admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('Operador 1', 'operador1', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'operador');

INSERT INTO configuracion (clave, valor) VALUES
('nombre_parqueadero', 'ParkSystem'),
('nit', '900.000.000-0'),
('direccion', 'Calle 1 # 2-3'),
('telefono', '3001234567'),
('tiempo_gracia', '10'),
('logo_url', ''),
('ancho_recibo', '80'),
('espacios_carro', '20'),
('espacios_moto', '10'),
('recibo_pie', 'Gracias por su visita'),
('recibo_mostrar_nit', '1'),
('recibo_mostrar_dir', '1'),
('recibo_mostrar_tel', '1'),
('recibo_mostrar_barcode', '1');

INSERT INTO tarifas (tipo_vehiculo, modalidad, precio_hora, precio_fraccion, precio_mensualidad) VALUES
('carro', 'dia',        3000, 1500, 0),
('carro', 'noche',      2500, 1250, 0),
('carro', '24horas',    3500, 1750, 0),
('carro', 'mensualidad',0,    0,    120000),
('moto',  'dia',        2000, 1000, 0),
('moto',  'noche',      1800,  900, 0),
('moto',  '24horas',    2500, 1250, 0),
('moto',  'mensualidad',0,    0,    80000);

INSERT INTO convenios (nombre, tipo, valor) VALUES
('Convenio General', 'horas_gratis', 1),
('Descuento Fijo',   'descuento_fijo', 3000),
('20% Descuento',    'porcentaje', 20);

INSERT INTO casilleros (numero) VALUES
(1),(2),(3),(4),(5),(6),(7),(8),(9),(10),
(11),(12),(13),(14),(15),(16),(17),(18),(19),(20),
(21),(22),(23),(24),(25),(26),(27),(28),(29),(30);
