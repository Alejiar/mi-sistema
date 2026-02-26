<?php
require_once 'config.php';
auth();
$i = inp(); $a = $_GET['action'] ?? $i['action'] ?? '';
$db = getDB();

// ---- Setup: crear tabla cajas si no existe ----
$db->query("CREATE TABLE IF NOT EXISTS cajas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  operador_id INT,
  operador_nombre VARCHAR(100),
  hora_apertura DATETIME DEFAULT CURRENT_TIMESTAMP,
  hora_cierre DATETIME NULL,
  total_salidas INT DEFAULT 0,
  ingresos_efectivo DECIMAL(12,2) DEFAULT 0,
  ingresos_tarjeta DECIMAL(12,2) DEFAULT 0,
  ingresos_transferencia DECIMAL(12,2) DEFAULT 0,
  total_ingresos DECIMAL(12,2) DEFAULT 0,
  estado ENUM('abierta','cerrada') DEFAULT 'abierta'
)");

// ---- Agregar caja_id a vehiculos si no existe ----
$colCheck = $db->query("SELECT COUNT(*) cnt FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='vehiculos' AND COLUMN_NAME='caja_id'");
if ((int)$colCheck->fetch_assoc()['cnt'] === 0) {
    $db->query("ALTER TABLE vehiculos ADD COLUMN caja_id INT NULL");
}

// ---- Helpers ----
function getCajaActual($db) {
    $r = $db->query("SELECT c.*, u.nombre AS operador_nombre
        FROM cajas c LEFT JOIN usuarios u ON c.operador_id = u.id
        WHERE c.estado = 'abierta' ORDER BY c.id DESC LIMIT 1");
    return $r ? $r->fetch_assoc() : null;
}

function abrirNuevaCaja($db, $uid) {
    $r = $db->query("SELECT nombre FROM usuarios WHERE id=$uid");
    $nom = $r ? ($r->fetch_assoc()['nombre'] ?? '') : '';
    $nom = $db->real_escape_string($nom);
    $db->query("INSERT INTO cajas (operador_id, operador_nombre, hora_apertura, estado) VALUES ($uid, '$nom', NOW(), 'abierta')");
    return $db->insert_id;
}

function statsCaja($db, $cid) {
    $st = $db->prepare("SELECT COUNT(*) tot,
        COALESCE(SUM(total),0) ing,
        COALESCE(SUM(CASE WHEN metodo_pago='efectivo' THEN total ELSE 0 END),0) ef,
        COALESCE(SUM(CASE WHEN metodo_pago='tarjeta' THEN total ELSE 0 END),0) tar,
        COALESCE(SUM(CASE WHEN metodo_pago='transferencia' THEN total ELSE 0 END),0) tra
        FROM vehiculos WHERE caja_id=? AND estado='finalizado'");
    $st->bind_param("i", $cid); $st->execute();
    return $st->get_result()->fetch_assoc();
}

// ---- Asegurar que siempre haya una caja abierta ----
function ensureCaja($db) {
    global $_SESSION;
    $caja = getCajaActual($db);
    if (!$caja) {
        $uid = (int)$_SESSION['uid'];
        $cajaId = abrirNuevaCaja($db, $uid);
        $r = $db->query("SELECT c.*, u.nombre AS operador_nombre
            FROM cajas c LEFT JOIN usuarios u ON c.operador_id=u.id WHERE c.id=$cajaId");
        $caja = $r->fetch_assoc();
    }
    return $caja;
}

// ============================================================
switch($a) {

// ---- ESTADO DE CAJA ACTUAL ----
case 'estado':
    $caja = ensureCaja($db);
    $cid  = (int)$caja['id'];
    $stats = statsCaja($db, $cid);

    // Vehiculos activos en este momento
    $r2 = $db->query("SELECT COUNT(*) n FROM vehiculos WHERE estado='activo'");
    $activos = (int)$r2->fetch_assoc()['n'];

    // Últimas transacciones de esta caja (últimas 8)
    $st2 = $db->prepare("SELECT placa, tipo, modalidad, hora_salida, tiempo_minutos, total, metodo_pago
        FROM vehiculos WHERE caja_id=? AND estado='finalizado' ORDER BY hora_salida DESC LIMIT 8");
    $st2->bind_param("i", $cid); $st2->execute();
    $ultimas = [];
    $res = $st2->get_result();
    while ($row = $res->fetch_assoc()) $ultimas[] = $row;

    echo json_encode(['ok'=>true,'caja'=>$caja,'stats'=>$stats,'activos'=>$activos,'ultimas'=>$ultimas]);
    break;

// ---- CERRAR CAJA ----
case 'cerrar':
    $caja = getCajaActual($db);
    if (!$caja) { echo json_encode(['error'=>'No hay caja abierta']); break; }

    $cid = (int)$caja['id'];
    $stats = statsCaja($db, $cid);

    // Lista completa de transacciones
    $st2 = $db->prepare("SELECT placa, tipo, modalidad, hora_entrada, hora_salida, tiempo_minutos, total, metodo_pago
        FROM vehiculos WHERE caja_id=? AND estado='finalizado' ORDER BY hora_salida DESC");
    $st2->bind_param("i", $cid); $st2->execute();
    $txList = [];
    $res = $st2->get_result();
    while ($row = $res->fetch_assoc()) $txList[] = $row;

    // Cuántos siguen adentro
    $r3 = $db->query("SELECT COUNT(*) n FROM vehiculos WHERE estado='activo'");
    $activos = (int)$r3->fetch_assoc()['n'];

    // Cerrar caja
    $hcierre = date('Y-m-d H:i:s');
    $tot = (int)$stats['tot'];
    $ef  = (float)$stats['ef'];
    $tar = (float)$stats['tar'];
    $tra = (float)$stats['tra'];
    $ing = (float)$stats['ing'];
    $db->query("UPDATE cajas SET
        hora_cierre='$hcierre',
        total_salidas=$tot,
        ingresos_efectivo=$ef,
        ingresos_tarjeta=$tar,
        ingresos_transferencia=$tra,
        total_ingresos=$ing,
        estado='cerrada'
        WHERE id=$cid");

    // Abrir nueva caja
    $uid = (int)$_SESSION['uid'];
    $newId = abrirNuevaCaja($db, $uid);

    $cfg = getCfg($db);
    echo json_encode([
        'ok' => true,
        'caja_cerrada' => $caja,
        'stats' => $stats,
        'transacciones' => $txList,
        'vehiculos_activos' => $activos,
        'hora_cierre' => $hcierre,
        'nueva_caja_id' => $newId,
        'config' => $cfg
    ]);
    break;

// ---- HISTORIAL DE CAJAS CERRADAS ----
case 'historial':
    $r = $db->query("SELECT c.*, u.nombre AS operador_nombre
        FROM cajas c LEFT JOIN usuarios u ON c.operador_id=u.id
        WHERE c.estado='cerrada' ORDER BY c.hora_cierre DESC LIMIT 50");
    $list = [];
    while ($row = $r->fetch_assoc()) $list[] = $row;
    echo json_encode(['ok'=>true,'cajas'=>$list]);
    break;

// ---- DETALLE DE CAJA ----
case 'detalle':
    $cid = (int)($_GET['id'] ?? $i['id'] ?? 0);
    if (!$cid) { echo json_encode(['error'=>'ID requerido']); break; }
    $r = $db->query("SELECT c.*, u.nombre AS operador_nombre
        FROM cajas c LEFT JOIN usuarios u ON c.operador_id=u.id WHERE c.id=$cid");
    $caja = $r->fetch_assoc();
    if (!$caja) { echo json_encode(['error'=>'No encontrada']); break; }

    $st = $db->prepare("SELECT placa, tipo, modalidad, hora_entrada, hora_salida, tiempo_minutos, total, metodo_pago
        FROM vehiculos WHERE caja_id=? AND estado='finalizado' ORDER BY hora_salida DESC");
    $st->bind_param("i", $cid); $st->execute();
    $txList = [];
    $res = $st->get_result();
    while ($row = $res->fetch_assoc()) $txList[] = $row;

    $cfg = getCfg($db);
    echo json_encode(['ok'=>true,'caja'=>$caja,'transacciones'=>$txList,'config'=>$cfg]);
    break;
}
?>
