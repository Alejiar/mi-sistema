-- phpMyAdmin SQL Dump
-- version 4.9.0.1
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost:3306
-- Tiempo de generación: 26-02-2026 a las 18:30:28
-- Versión del servidor: 10.3.16-MariaDB
-- Versión de PHP: 7.1.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `parksystem`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cajas`
--

CREATE TABLE `cajas` (
  `id` int(11) NOT NULL,
  `operador_id` int(11) DEFAULT NULL,
  `operador_nombre` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hora_apertura` datetime DEFAULT current_timestamp(),
  `hora_cierre` datetime DEFAULT NULL,
  `total_salidas` int(11) DEFAULT 0,
  `ingresos_efectivo` decimal(12,2) DEFAULT 0.00,
  `ingresos_tarjeta` decimal(12,2) DEFAULT 0.00,
  `ingresos_transferencia` decimal(12,2) DEFAULT 0.00,
  `total_ingresos` decimal(12,2) DEFAULT 0.00,
  `estado` enum('abierta','cerrada') COLLATE utf8mb4_unicode_ci DEFAULT 'abierta'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `cajas`
--

INSERT INTO `cajas` (`id`, `operador_id`, `operador_nombre`, `hora_apertura`, `hora_cierre`, `total_salidas`, `ingresos_efectivo`, `ingresos_tarjeta`, `ingresos_transferencia`, `total_ingresos`, `estado`) VALUES
(1, 1, 'Administrador', '2026-02-26 08:38:05', '2026-02-26 17:53:46', 33, '54000.00', '0.00', '0.00', '54000.00', 'cerrada'),
(2, 1, 'Administrador', '2026-02-26 11:53:46', '2026-02-26 17:58:43', 1, '0.00', '0.00', '1500.00', '1500.00', 'cerrada'),
(3, 1, 'Administrador', '2026-02-26 11:58:43', NULL, 0, '0.00', '0.00', '0.00', '0.00', 'abierta');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `casilleros`
--

CREATE TABLE `casilleros` (
  `id` int(11) NOT NULL,
  `numero` int(11) NOT NULL,
  `ocupado` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `casilleros`
--

INSERT INTO `casilleros` (`id`, `numero`, `ocupado`) VALUES
(1, 1, 0),
(2, 2, 0),
(3, 3, 0),
(4, 4, 0),
(5, 5, 0),
(6, 6, 0),
(7, 7, 0),
(8, 8, 0),
(9, 9, 0),
(10, 10, 0),
(11, 11, 0),
(12, 12, 0),
(13, 13, 0),
(14, 14, 0),
(15, 15, 0),
(16, 16, 0),
(17, 17, 0),
(18, 18, 0),
(19, 19, 0),
(20, 20, 0),
(21, 21, 0),
(22, 22, 0),
(23, 23, 0),
(24, 24, 0),
(25, 25, 0),
(26, 26, 0),
(27, 27, 0),
(28, 28, 0),
(29, 29, 0),
(30, 30, 0);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `configuracion`
--

CREATE TABLE `configuracion` (
  `id` int(11) NOT NULL,
  `clave` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `valor` text COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `configuracion`
--

INSERT INTO `configuracion` (`id`, `clave`, `valor`) VALUES
(1, 'nombre_parqueadero', 'ZONA 3'),
(2, 'nit', '39.191.707'),
(3, 'direccion', 'Calle 31 #31-69'),
(4, 'telefono', '3235983557'),
(5, 'tiempo_gracia', '10'),
(6, 'logo_url', ''),
(7, 'ancho_recibo', '58'),
(8, 'espacios_carro', '20'),
(9, 'espacios_moto', '10'),
(10, 'recibo_pie', 'Gracias por su visita'),
(11, 'recibo_mostrar_nit', '1'),
(12, 'recibo_mostrar_dir', '1'),
(13, 'recibo_mostrar_tel', '1'),
(14, 'recibo_mostrar_barcode', '1'),
(25, 'recibo_encabezado', '');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `convenios`
--

CREATE TABLE `convenios` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` enum('horas_gratis','descuento_fijo','porcentaje') COLLATE utf8mb4_unicode_ci NOT NULL,
  `valor` decimal(10,2) NOT NULL,
  `activo` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `convenios`
--

INSERT INTO `convenios` (`id`, `nombre`, `tipo`, `valor`, `activo`) VALUES
(1, 'Convenio General', 'horas_gratis', '1.00', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `mensualidades`
--

CREATE TABLE `mensualidades` (
  `id` int(11) NOT NULL,
  `placa` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo_vehiculo` enum('carro','moto') COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre_cliente` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefono` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_inicio` date NOT NULL,
  `fecha_vencimiento` date NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  `estado` enum('activo','pendiente','vencido') COLLATE utf8mb4_unicode_ci DEFAULT 'activo',
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pagos_mensualidad`
--

CREATE TABLE `pagos_mensualidad` (
  `id` int(11) NOT NULL,
  `mensualidad_id` int(11) NOT NULL,
  `fecha_pago` datetime DEFAULT current_timestamp(),
  `monto` decimal(10,2) NOT NULL,
  `metodo_pago` enum('efectivo','tarjeta','transferencia') COLLATE utf8mb4_unicode_ci DEFAULT 'efectivo',
  `operador_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tarifas`
--

CREATE TABLE `tarifas` (
  `id` int(11) NOT NULL,
  `tipo_vehiculo` enum('carro','moto') COLLATE utf8mb4_unicode_ci NOT NULL,
  `modalidad` enum('dia','noche','24horas','horas','mensualidad') COLLATE utf8mb4_unicode_ci NOT NULL,
  `precio_hora` decimal(10,2) NOT NULL DEFAULT 0.00,
  `precio_fraccion` decimal(10,2) NOT NULL DEFAULT 0.00,
  `precio_mensualidad` decimal(10,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `tarifas`
--

INSERT INTO `tarifas` (`id`, `tipo_vehiculo`, `modalidad`, `precio_hora`, `precio_fraccion`, `precio_mensualidad`) VALUES
(113, 'carro', 'dia', '20000.00', '0.00', '0.00'),
(114, 'carro', 'noche', '25000.00', '0.00', '0.00'),
(115, 'carro', '24horas', '35000.00', '0.00', '0.00'),
(117, 'carro', 'mensualidad', '0.00', '0.00', '120000.00'),
(118, 'moto', 'dia', '10000.00', '0.00', '0.00'),
(119, 'moto', 'noche', '15000.00', '0.00', '0.00'),
(120, 'moto', '24horas', '20000.00', '0.00', '0.00'),

(122, 'moto', 'mensualidad', '0.00', '0.00', '80000.00'),
(126, 'carro', 'horas', '4000.00', '2000.00', '0.00'),
(131, 'moto', 'horas', '1500.00', '750.00', '0.00');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `usuario` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rol` enum('admin','operador') COLLATE utf8mb4_unicode_ci DEFAULT 'operador',
  `activo` tinyint(1) DEFAULT 1,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `nombre`, `usuario`, `password`, `rol`, `activo`, `creado_en`) VALUES
(1, 'Administrador', 'admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 1, '2026-02-26 12:01:56'),
(2, 'Operador 1', 'operador1', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'operador', 1, '2026-02-26 12:01:56'),
(3, 'ALEJO', 'alejo', '$2y$10$kPyhrUoGgBYlcQriUDMNWenEEyPLkusDid8bW8LaMkBkrQ29Ej2DG', 'operador', 1, '2026-02-26 17:00:16');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `vehiculos`
--

CREATE TABLE `vehiculos` (
  `id` int(11) NOT NULL,
  `placa` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` enum('carro','moto') COLLATE utf8mb4_unicode_ci NOT NULL,
  `modalidad` enum('dia','noche','24horas','horas','mensualidad') COLLATE utf8mb4_unicode_ci DEFAULT 'dia',
  `casillero_id` int(11) DEFAULT NULL,
  `hora_entrada` datetime NOT NULL,
  `hora_salida` datetime DEFAULT NULL,
  `tiempo_minutos` int(11) DEFAULT NULL,
  `tarifa_hora` decimal(10,2) DEFAULT 0.00,
  `tarifa_fraccion` decimal(10,2) DEFAULT 0.00,
  `horas_cobradas` int(11) DEFAULT 0,
  `fraccion_cobrada` tinyint(1) DEFAULT 0,
  `subtotal` decimal(10,2) DEFAULT 0.00,
  `descuento` decimal(10,2) DEFAULT 0.00,
  `total` decimal(10,2) DEFAULT 0.00,
  `convenio_id` int(11) DEFAULT NULL,
  `tipo_salida` enum('normal','convenio') COLLATE utf8mb4_unicode_ci DEFAULT 'normal',
  `metodo_pago` enum('efectivo','tarjeta','transferencia') COLLATE utf8mb4_unicode_ci DEFAULT 'efectivo',
  `operador_entrada_id` int(11) NOT NULL,
  `operador_salida_id` int(11) DEFAULT NULL,
  `estado` enum('activo','finalizado') COLLATE utf8mb4_unicode_ci DEFAULT 'activo',
  `codigo_barras` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `es_mensualidad` tinyint(1) DEFAULT 0,
  `mensualidad_id` int(11) DEFAULT NULL,
  `caja_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `vehiculos`
--

INSERT INTO `vehiculos` (`id`, `placa`, `tipo`, `modalidad`, `casillero_id`, `hora_entrada`, `hora_salida`, `tiempo_minutos`, `tarifa_hora`, `tarifa_fraccion`, `horas_cobradas`, `fraccion_cobrada`, `subtotal`, `descuento`, `total`, `convenio_id`, `tipo_salida`, `metodo_pago`, `operador_entrada_id`, `operador_salida_id`, `estado`, `codigo_barras`, `es_mensualidad`, `mensualidad_id`, `caja_id`) VALUES
(1, 'HOQ79C', 'moto', 'dia', 1, '2026-02-26 13:48:12', '2026-02-26 14:38:13', 50, '2000.00', '1000.00', 1, 1, '3000.00', '0.00', '3000.00', NULL, 'normal', 'efectivo', 1, 1, 'finalizado', 'HOQ79C2026022613481241', 0, NULL, 1),
(2, 'ITV892', 'carro', 'dia', NULL, '2026-02-26 14:38:56', '2026-02-26 14:39:16', 1, '3000.00', '1500.00', 1, 0, '3000.00', '0.00', '3000.00', NULL, 'normal', 'efectivo', 1, 1, 'finalizado', 'ITV8922026022614385630', 0, NULL, 1),
(3, 'HOQ79C', 'moto', 'dia', 1, '2026-02-26 14:47:51', '2026-02-26 14:48:35', 1, '2000.00', '1000.00', 1, 0, '2000.00', '3000.00', '0.00', NULL, 'normal', 'efectivo', 1, 1, 'finalizado', 'HOQ79C2026022614475137', 0, NULL, 1),
(4, 'ITV892', 'carro', 'dia', NULL, '2026-02-26 14:48:45', '2026-02-26 15:07:42', 18, '3000.00', '1500.00', 0, 0, '3000.00', '0.00', '3000.00', NULL, 'normal', 'efectivo', 1, 1, 'finalizado', 'ITV8922026022614484570', 0, NULL, 1),
(5, 'HOQ79C', 'moto', 'dia', NULL, '2026-02-26 14:58:20', '2026-02-26 15:07:38', 9, '2000.00', '1000.00', 0, 0, '2000.00', '0.00', '2000.00', NULL, 'normal', 'efectivo', 1, 1, 'finalizado', 'HOQ79C2026022614582076', 0, NULL, 1),
(6, 'HOQ79C', 'moto', 'horas', NULL, '2026-02-26 15:07:47', '2026-02-26 15:19:25', 11, '2000.00', '1000.00', 1, 1, '1500.00', '1500.00', '0.00', 1, 'normal', 'efectivo', 1, 1, 'finalizado', 'HOQ79C2026022615074775', 0, NULL, 1),
(7, 'ITV892', 'carro', 'horas', NULL, '2026-02-26 15:10:42', '2026-02-26 15:19:14', 8, '3000.00', '1500.00', 1, 0, '4000.00', '0.00', '4000.00', NULL, 'normal', 'efectivo', 1, 1, 'finalizado', 'ITV8922026022615104217', 0, NULL, 1),
(8, 'HOQ48C', 'moto', 'horas', NULL, '2026-02-26 15:13:07', '2026-02-26 15:19:03', 5, '10000.00', '0.00', 1, 0, '1500.00', '3000.00', '0.00', NULL, 'normal', 'efectivo', 1, 1, 'finalizado', 'HOQ48C2026022615130757', 0, NULL, 1),
(9, 'ITV892', 'carro', 'horas', NULL, '2026-02-26 15:19:33', '2026-02-26 15:40:58', 21, '20000.00', '0.00', 1, 1, '6000.00', '4000.00', '2000.00', 1, 'normal', 'efectivo', 1, 1, 'finalizado', 'ITV8922026022615193389', 0, NULL, 1),
(10, 'ITV894', 'carro', 'horas', NULL, '2026-02-26 15:19:55', '2026-02-26 15:40:49', 20, '20000.00', '0.00', 1, 1, '6000.00', '4000.00', '2000.00', 1, 'normal', 'efectivo', 1, 1, 'finalizado', 'ITV8942026022615195550', 0, NULL, 1),
(11, 'HOQ79C', 'moto', 'horas', NULL, '2026-02-26 15:20:05', '2026-02-26 15:20:49', 1, '10000.00', '0.00', 1, 0, '1500.00', '0.00', '1500.00', NULL, 'normal', 'efectivo', 1, 1, 'finalizado', 'HOQ79C2026022615200564', 0, NULL, 1),
(12, 'HOQ79C', 'moto', 'horas', NULL, '2026-02-26 15:22:34', '2026-02-26 15:40:39', 18, '10000.00', '0.00', 1, 1, '2250.00', '1500.00', '750.00', 1, 'normal', 'efectivo', 1, 1, 'finalizado', 'HOQ79C2026022615223468', 0, NULL, 1),
(13, 'HOQ65C', 'moto', 'horas', NULL, '2026-02-26 15:23:21', '2026-02-26 15:40:29', 17, '10000.00', '0.00', 1, 1, '2250.00', '1500.00', '750.00', 1, 'normal', 'efectivo', 1, 1, 'finalizado', 'HOQ65C2026022615232193', 0, NULL, 1),
(14, 'HOQ27C', 'moto', 'horas', NULL, '2026-02-26 15:25:36', '2026-02-26 15:40:20', 14, '10000.00', '0.00', 1, 1, '2250.00', '1500.00', '750.00', 1, 'normal', 'efectivo', 1, 1, 'finalizado', 'HOQ27C2026022615253661', 0, NULL, 1),
(15, 'HOQ64C', 'moto', 'dia', NULL, '2026-02-26 15:30:02', '2026-02-26 15:40:15', 10, '10000.00', '0.00', 0, 0, '10000.00', '10000.00', '0.00', 1, 'normal', 'efectivo', 1, 1, 'finalizado', 'HOQ64C2026022615300231', 0, NULL, 1),
(16, 'ITV876', 'carro', 'horas', NULL, '2026-02-26 15:36:46', '2026-02-26 15:40:07', 3, '4000.00', '2000.00', 1, 0, '4000.00', '4000.00', '0.00', 1, 'normal', 'efectivo', 1, 1, 'finalizado', 'ITV8762026022615364627', 0, NULL, 1),
(17, 'ITV56G', 'moto', 'horas', NULL, '2026-02-26 15:36:56', '2026-02-26 15:39:59', 3, '1500.00', '750.00', 1, 0, '1500.00', '1500.00', '0.00', 1, 'normal', 'efectivo', 1, 1, 'finalizado', 'ITV56G2026022615365621', 0, NULL, 1),
(18, 'HOQ79C', 'moto', 'horas', NULL, '2026-02-26 15:47:02', '2026-02-26 17:52:29', 125, '1500.00', '750.00', 2, 0, '3000.00', '0.00', '3000.00', NULL, 'normal', 'efectivo', 1, 1, 'finalizado', 'HOQ79C2026022615470296', 0, NULL, 1),
(19, 'ITB90C', 'moto', 'horas', NULL, '2026-02-26 16:00:53', '2026-02-26 17:53:24', 112, '1500.00', '750.00', 1, 1, '2250.00', '0.00', '2250.00', NULL, 'normal', 'efectivo', 1, 1, 'finalizado', 'ITB90C2026022616005325', 0, NULL, 1),
(20, 'PP045F', 'moto', 'horas', NULL, '2026-02-26 16:04:37', '2026-02-26 17:53:17', 108, '1500.00', '750.00', 1, 1, '2250.00', '0.00', '2250.00', NULL, 'normal', 'efectivo', 1, 1, 'finalizado', 'PP045F2026022616043783', 0, NULL, 1),
(21, 'GHT98S', 'moto', 'horas', NULL, '2026-02-26 16:07:44', '2026-02-26 17:53:09', 105, '1500.00', '750.00', 1, 1, '2250.00', '0.00', '2250.00', NULL, 'normal', 'efectivo', 1, 1, 'finalizado', 'GHT98S2026022616074474', 0, NULL, 1),
(22, 'PPO98D', 'moto', 'horas', NULL, '2026-02-26 16:09:29', '2026-02-26 17:53:02', 103, '1500.00', '750.00', 1, 1, '2250.00', '0.00', '2250.00', NULL, 'normal', 'efectivo', 1, 1, 'finalizado', 'PPO98D2026022616092945', 0, NULL, 1),
(23, 'OPP45F', 'moto', 'horas', 2, '2026-02-26 16:10:08', '2026-02-26 17:52:57', 102, '1500.00', '750.00', 1, 1, '2250.00', '0.00', '2250.00', NULL, 'normal', 'efectivo', 1, 1, 'finalizado', 'OPP45F2026022616100873', 0, NULL, 1),
(24, 'GOP98F', 'moto', 'horas', NULL, '2026-02-26 16:17:10', '2026-02-26 17:52:42', 95, '1500.00', '750.00', 1, 1, '2250.00', '0.00', '2250.00', NULL, 'normal', 'efectivo', 1, 1, 'finalizado', 'GOP98F2026022616171027', 0, NULL, 1),
(25, 'KFI98X', 'moto', 'horas', NULL, '2026-02-26 16:19:07', '2026-02-26 17:52:38', 93, '1500.00', '750.00', 1, 1, '2250.00', '0.00', '2250.00', NULL, 'normal', 'efectivo', 1, 1, 'finalizado', 'KFI98X2026022616190792', 0, NULL, 1),
(26, 'HOE69F', 'moto', 'horas', NULL, '2026-02-26 16:26:46', '2026-02-26 17:52:35', 85, '1500.00', '750.00', 1, 1, '2250.00', '0.00', '2250.00', NULL, 'normal', 'efectivo', 1, 1, 'finalizado', '000026', 0, NULL, 1),
(27, 'GHK89D', 'moto', 'horas', NULL, '2026-02-26 16:29:34', '2026-02-26 17:45:00', 75, '1500.00', '750.00', 1, 1, '2250.00', '0.00', '2250.00', NULL, 'normal', 'efectivo', 1, 1, 'finalizado', '000027', 0, NULL, 1),
(28, 'GJS68G', 'moto', 'horas', NULL, '2026-02-26 16:34:54', '2026-02-26 17:35:31', 60, '1500.00', '750.00', 1, 0, '1500.00', '1500.00', '0.00', 1, 'normal', 'efectivo', 1, 1, 'finalizado', '000028', 0, NULL, 1),
(29, 'IYG98C', 'moto', 'horas', NULL, '2026-02-26 16:41:22', '2026-02-26 16:58:02', 16, '1500.00', '750.00', 1, 1, '2250.00', '0.00', '2250.00', NULL, 'normal', 'efectivo', 1, 1, 'finalizado', '000029', 0, NULL, 1),
(30, 'HKD89G', 'moto', 'horas', NULL, '2026-02-26 16:44:40', '2026-02-26 16:57:55', 13, '1500.00', '750.00', 1, 1, '2250.00', '0.00', '2250.00', NULL, 'normal', 'efectivo', 1, 1, 'finalizado', '000030', 0, NULL, 1),
(31, 'POO75G', 'moto', 'horas', NULL, '2026-02-26 16:56:14', '2026-02-26 16:57:50', 1, '1500.00', '750.00', 1, 0, '1500.00', '0.00', '1500.00', NULL, 'normal', 'efectivo', 1, 1, 'finalizado', '000031', 0, NULL, 1),
(32, 'ITV895', 'carro', 'horas', NULL, '2026-02-26 16:59:26', '2026-02-26 17:15:36', 16, '4000.00', '2000.00', 1, 1, '6000.00', '4000.00', '2000.00', 1, 'normal', 'efectivo', 1, 1, 'finalizado', '000032', 0, NULL, 1),
(33, 'GDS78V', 'moto', 'horas', NULL, '2026-02-26 17:45:31', '2026-02-26 17:51:40', 6, '1500.00', '750.00', 1, 0, '1500.00', '1500.00', '0.00', 1, 'normal', 'efectivo', 1, 1, 'finalizado', 'GDS78V', 0, NULL, 1),
(34, 'HOQ79C', 'moto', 'horas', NULL, '2026-02-26 17:54:25', '2026-02-26 17:54:42', 1, '1500.00', '750.00', 1, 0, '1500.00', '0.00', '1500.00', NULL, 'normal', 'transferencia', 1, 1, 'finalizado', 'HOQ79C', 0, NULL, 2),
(35, 'ITV892', 'carro', 'horas', NULL, '2026-02-26 17:58:37', '2026-02-26 18:14:44', 16, '4000.00', '2000.00', 1, 1, '6000.00', '0.00', '6000.00', NULL, 'normal', 'efectivo', 1, 1, 'finalizado', 'ITV892', 0, NULL, 3),
(36, 'ITV098', 'carro', 'noche', NULL, '2026-02-26 18:09:55', '2026-02-26 18:10:23', 1, '25000.00', '0.00', 0, 0, '25000.00', '0.00', '25000.00', NULL, 'normal', 'efectivo', 1, 1, 'finalizado', 'ITV098', 0, NULL, 3);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `cajas`
--
ALTER TABLE `cajas`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `casilleros`
--
ALTER TABLE `casilleros`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `numero` (`numero`);

--
-- Indices de la tabla `configuracion`
--
ALTER TABLE `configuracion`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `clave` (`clave`);

--
-- Indices de la tabla `convenios`
--
ALTER TABLE `convenios`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `mensualidades`
--
ALTER TABLE `mensualidades`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `pagos_mensualidad`
--
ALTER TABLE `pagos_mensualidad`
  ADD PRIMARY KEY (`id`),
  ADD KEY `mensualidad_id` (`mensualidad_id`),
  ADD KEY `operador_id` (`operador_id`);

--
-- Indices de la tabla `tarifas`
--
ALTER TABLE `tarifas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk` (`tipo_vehiculo`,`modalidad`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `usuario` (`usuario`);

--
-- Indices de la tabla `vehiculos`
--
ALTER TABLE `vehiculos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `codigo_barras` (`codigo_barras`),
  ADD KEY `casillero_id` (`casillero_id`),
  ADD KEY `convenio_id` (`convenio_id`),
  ADD KEY `operador_entrada_id` (`operador_entrada_id`),
  ADD KEY `operador_salida_id` (`operador_salida_id`),
  ADD KEY `mensualidad_id` (`mensualidad_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `cajas`
--
ALTER TABLE `cajas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `casilleros`
--
ALTER TABLE `casilleros`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT de la tabla `configuracion`
--
ALTER TABLE `configuracion`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=90;

--
-- AUTO_INCREMENT de la tabla `convenios`
--
ALTER TABLE `convenios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `mensualidades`
--
ALTER TABLE `mensualidades`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `pagos_mensualidad`
--
ALTER TABLE `pagos_mensualidad`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tarifas`
--
ALTER TABLE `tarifas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=973;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `vehiculos`
--
ALTER TABLE `vehiculos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `pagos_mensualidad`
--
ALTER TABLE `pagos_mensualidad`
  ADD CONSTRAINT `pagos_mensualidad_ibfk_1` FOREIGN KEY (`mensualidad_id`) REFERENCES `mensualidades` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `pagos_mensualidad_ibfk_2` FOREIGN KEY (`operador_id`) REFERENCES `usuarios` (`id`);

--
-- Filtros para la tabla `vehiculos`
--
ALTER TABLE `vehiculos`
  ADD CONSTRAINT `vehiculos_ibfk_1` FOREIGN KEY (`casillero_id`) REFERENCES `casilleros` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `vehiculos_ibfk_2` FOREIGN KEY (`convenio_id`) REFERENCES `convenios` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `vehiculos_ibfk_3` FOREIGN KEY (`operador_entrada_id`) REFERENCES `usuarios` (`id`),
  ADD CONSTRAINT `vehiculos_ibfk_4` FOREIGN KEY (`operador_salida_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `vehiculos_ibfk_5` FOREIGN KEY (`mensualidad_id`) REFERENCES `mensualidades` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
