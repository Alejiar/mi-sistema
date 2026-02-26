<?php
// Script de prueba para verificar que getTarifas() está obteniendo 'horas'
require 'php/config.php';

$t = getTarifas($db);

echo "<h2>Estado de Tarifas en Sistema:</h2>";
echo "<pre>";
echo json_encode($t, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
echo "</pre>";

echo "<h2>Verificación por tipo:</h2>";
foreach ($t as $tipo => $tarifas) {
    echo "<strong>$tipo:</strong><br>";
    foreach ($tarifas as $modal => $data) {
        echo "  $modal: precio_hora=" . $data['precio_hora'] . ", precio_fraccion=" . $data['precio_fraccion'] . "<br>";
    }
}
?>
