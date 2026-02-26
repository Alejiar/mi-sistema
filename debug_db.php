<?php
require 'php/config.php';

echo "<h1>Estado de Base de Datos</h1>";

// Primero, ejecutar la migración y aseguramiento
function migrateTableStructure($db) {
    $db->query("ALTER TABLE tarifas CHANGE COLUMN modalidad modalidad ENUM('dia','noche','24horas','horas','mensualidad') NOT NULL");
    $db->query("ALTER TABLE vehiculos CHANGE COLUMN modalidad modalidad ENUM('dia','noche','24horas','horas','mensualidad') DEFAULT 'dia'");
}

function ensureTarifas($db) {
    $defaults = [
        ['carro', 'dia',        20000,    0,      0],
        ['carro', 'noche',      25000,    0,      0],
        ['carro', '24horas',    35000,    0,      0],
        ['carro', 'horas',       4000,  2000,      0],
        ['carro', 'mensualidad',    0,     0, 120000],
        ['moto',  'dia',        10000,    0,      0],
        ['moto',  'noche',      15000,    0,      0],
        ['moto',  '24horas',    20000,    0,      0],
        ['moto',  'horas',       1500,   750,      0],
        ['moto',  'mensualidad',    0,     0,  80000],
    ];

    foreach ($defaults as [$tipo, $mod, $ph, $pf, $pm]) {
        $st = $db->prepare("INSERT INTO tarifas (tipo_vehiculo, modalidad, precio_hora, precio_fraccion, precio_mensualidad) 
                            VALUES (?,?,?,?,?)
                            ON DUPLICATE KEY UPDATE precio_hora=VALUES(precio_hora), precio_fraccion=VALUES(precio_fraccion), precio_mensualidad=VALUES(precio_mensualidad)");
        $st->bind_param("ssiii", $tipo, $mod, $ph, $pf, $pm);
        if (!$st->execute()) {
            echo "ERROR en " . implode("/", [$tipo, $mod]) . ": " . $st->error . "<br>";
        }
    }
}

// Ejecutar migraciones
echo "<h2>Ejecutando migraciones...</h2>";
migrateTableStructure($db);
echo "✓ Estructura de tabla actualizada<br>";

echo "<h2>Asegurando tarifas por defecto...</h2>";
ensureTarifas($db);
echo "✓ Tarifas aseguradas<br>";

// Mostrar contenido actual
echo "<h2>Contenido actual de tabla tarifas:</h2>";
$result = $db->query("SELECT * FROM tarifas ORDER BY tipo_vehiculo, modalidad");

echo "<table border='1' cellpadding='10'>";
echo "<tr><th>tipo_vehiculo</th><th>modalidad</th><th>precio_hora</th><th>precio_fraccion</th><th>precio_mensualidad</th></tr>";
while ($row = $result->fetch_assoc()) {
    echo "<tr>";
    echo "<td>" . $row['tipo_vehiculo'] . "</td>";
    echo "<td>" . $row['modalidad'] . "</td>";
    echo "<td>" . $row['precio_hora'] . "</td>";
    echo "<td>" . $row['precio_fraccion'] . "</td>";
    echo "<td>" . $row['precio_mensualidad'] . "</td>";
    echo "</tr>";
}
echo "</table>";

// Verificar que getTarifas de config.php devuelve lo esperado
echo "<h2>getTarifas() - Estructura en memoria:</h2>";
function getTarifas($db) {
    $r = $db->query("SELECT * FROM tarifas ORDER BY tipo_vehiculo, modalidad");
    if (!$r) return [];
    $t = [];
    while ($row = $r->fetch_assoc()) {
        if (!isset($t[$row['tipo_vehiculo']])) $t[$row['tipo_vehiculo']] = [];
        $t[$row['tipo_vehiculo']][$row['modalidad']] = $row;
    }
    return $t;
}

$tarifas = getTarifas($db);
echo "<pre>" . json_encode($tarifas, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "</pre>";
?>
