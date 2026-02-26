<?php
// Script de reparación: normaliza codigo_barras por id (6 dígitos) para vehiculos activos
require_once 'php/config.php';
auth();
$db = getDB();

// Solo permitir ejecución por admin en entorno local
if ($_SESSION['rol'] !== 'admin') { echo "Acceso denegado"; exit; }

echo "<h2>Normalizando códigos de barras</h2>";

$q = "SELECT id, codigo_barras FROM vehiculos WHERE estado='activo'";
$r = $db->query($q);
$updated = 0;
while ($row = $r->fetch_assoc()) {
    $id = (int)$row['id'];
    $code = str_pad($id, 6, '0', STR_PAD_LEFT);
    if ($row['codigo_barras'] !== $code) {
        $db->query("UPDATE vehiculos SET codigo_barras='" . $db->real_escape_string($code) . "' WHERE id=$id");
        $updated++;
        echo "Actualizado ID $id -> $code<br>";
    }
}
echo "<br>Completado. Registros actualizados: $updated";

?>
