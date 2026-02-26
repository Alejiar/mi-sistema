<?php
require 'php/config.php';

echo "<h1>Diagnosis y Reparación</h1>";

// Step 1: Migración de tabla
echo "<h2>Step 1: Migrando estructura de tablas...</h2>";
$queries = [
    "ALTER TABLE tarifas CHANGE COLUMN modalidad modalidad ENUM('dia','noche','24horas','horas','mensualidad') NOT NULL",
    "ALTER TABLE vehiculos CHANGE COLUMN modalidad modalidad ENUM('dia','noche','24horas','horas','mensualidad') DEFAULT 'dia'"
];

foreach ($queries as $q) {
    $result = $db->query($q);
    if ($result) {
        echo "✓ Executed: " . substr($q, 0, 80) . "...<br>";
    } else {
        echo "⚠ " . $db->error . "<br>";
    }
}

// Step 2: Insertar tarifas con ON DUPLICATE KEY UPDATE
echo "<h2>Step 2: Insertando/Actualizando tarifas...</h2>";
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
    
    if ($st === false) {
        echo "ERROR en prepare: " . $db->error . "<br>";
        continue;
    }
    
    $st->bind_param("ssiii", $tipo, $mod, $ph, $pf, $pm);
    
    if (!$st->execute()) {
        echo "✗ Error para $tipo/$mod: " . $st->error . "<br>";
    } else {
        echo "✓ $tipo/$mod: \$" . ($ph ? $ph : "variable") . "<br>";
    }
}

// Step 3: Mostrar contenido actual
echo "<h2>Step 3: Contenido actual de tarifas:</h2>";
$result = $db->query("SELECT * FROM tarifas ORDER BY tipo_vehiculo, modalidad");

if (!$result) {
    echo "ERROR: " . $db->error . "<br>";
} else {
    echo "<table border='1' cellpadding='10' style='border-collapse: collapse;'>";
    echo "<tr style='background: #ddd;'><th>tipo</th><th>modalidad</th><th>precio_hora</th><th>fracción</th><th>mensual</th></tr>";
    while ($row = $result->fetch_assoc()) {
        $highlight = ($row['modalidad'] === 'horas') ? "style='background: #ffffcc;'" : "";
        echo "<tr $highlight>";
        echo "<td>" . $row['tipo_vehiculo'] . "</td>";
        echo "<td><strong>" . $row['modalidad'] . "</strong></td>";
        echo "<td>" . $row['precio_hora'] . "</td>";
        echo "<td>" . $row['precio_fraccion'] . "</td>";
        echo "<td>" . $row['precio_mensualidad'] . "</td>";
        echo "</tr>";
    }
    echo "</table>";
}

echo "<h2>Step 4: Verificación de API entrada</h2>";
?>
<p>Abre la consola del navegador (F12) e intenta:</p>
<pre>
fetch('php/vehiculos.php', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({acc: 'entrada', placa: 'TEST123', tipo: 'carro', modalidad: 'horas'})
}).then(r => r.json()).then(console.log)
</pre>

<h2>Step 5: Salida de getTarifas()</h2>
<pre>
<?php
$t = getTarifas($db);
print_r($t);
?>
</pre>
