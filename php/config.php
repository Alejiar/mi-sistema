<?php
// ============================================================
// PARKSYSTEM v2 - Configuración y helpers
// ============================================================
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'parksystem');

function getDB() {
    static $c = null;
    if ($c === null) {
        $c = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
        $c->set_charset('utf8mb4');
        if ($c->connect_error) die(json_encode(['error' => 'BD: '.$c->connect_error]));
    }
    return $c;
}

if (session_status() === PHP_SESSION_NONE) session_start();

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

function auth() {
    if (!isset($_SESSION['uid'])) { http_response_code(401); die(json_encode(['error'=>'Sesión inválida'])); }
}
function adminOnly() {
    auth();
    if ($_SESSION['rol'] !== 'admin') { http_response_code(403); die(json_encode(['error'=>'Solo administrador'])); }
}
function inp() { return json_decode(file_get_contents('php://input'), true) ?? []; }

function getCfg($db) {
    $r = $db->query("SELECT clave, valor FROM configuracion");
    $c = [];
    while ($row = $r->fetch_assoc()) $c[$row['clave']] = $row['valor'];
    return $c;
}

function migrateTableStructure($db) {
    // Asegura que la tabla tarifas pueda almacenar la modalidad 'horas'
    $db->query("ALTER TABLE tarifas CHANGE COLUMN modalidad modalidad ENUM('dia','noche','24horas','horas','mensualidad') NOT NULL");
    // Asegura que el enum de vehiculos en la tabla vehiculos también tenga 'horas'
    $db->query("ALTER TABLE vehiculos CHANGE COLUMN modalidad modalidad ENUM('dia','noche','24horas','horas','mensualidad') DEFAULT 'dia'");
}

function getTarifas($db) {
    // Migración de estructura primero
    migrateTableStructure($db);
    
    // Asegurar que existan todas las modalidades de tarifa básicas
    ensureTarifas($db);

    $r = $db->query("SELECT * FROM tarifas ORDER BY tipo_vehiculo, modalidad");
    if (!$r) return [];
    $t = [];
    while ($row = $r->fetch_assoc()) {
        if (!isset($t[$row['tipo_vehiculo']])) $t[$row['tipo_vehiculo']] = [];
        $t[$row['tipo_vehiculo']][$row['modalidad']] = $row;
    }
    return $t;
}

function ensureTarifas($db) {
    // Garantizar que todas las tarifas existan - usar UPDATE para existentes, INSERT para nuevas
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
        // ON DUPLICATE KEY UPDATE asegura que existan todas las tarifas con valores correctos
        $st = $db->prepare("INSERT INTO tarifas (tipo_vehiculo, modalidad, precio_hora, precio_fraccion, precio_mensualidad) 
                            VALUES (?,?,?,?,?)
                            ON DUPLICATE KEY UPDATE precio_hora=VALUES(precio_hora), precio_fraccion=VALUES(precio_fraccion), precio_mensualidad=VALUES(precio_mensualidad)");
        $st->bind_param("ssiii", $tipo, $mod, $ph, $pf, $pm);
        $st->execute();
    }
}

/**
 * Calcula el cobro correctamente:
 * - Mínimo 1 hora
 * - Por cada hora completa se cobra precio_hora
 * - Si los minutos restantes superan el tiempo de gracia, se suma precio_fraccion
 */
function calcularCobro($minutos, $tipo, $modalidad, $tarifas, $gracia) {
    $gracia = (int)$gracia;
    
    // Buscar tarifa exacta
    if (isset($tarifas[$tipo]) && isset($tarifas[$tipo][$modalidad])) {
        $t = $tarifas[$tipo][$modalidad];
    } else if (isset($tarifas[$tipo]['dia'])) {
        $t = $tarifas[$tipo]['dia'];
    } else {
        return ['horas'=>0,'fraccion'=>false,'subtotal'=>0,'tarifa_hora'=>0,'tarifa_fraccion'=>0,'minutos_extra'=>0];
    }

    // modalidades fijas: precio sin importar tiempo
    if (in_array($modalidad, ['dia','noche','24horas'])) {
        $ph = (float)$t['precio_hora'];
        return ['horas'=>0,'fraccion'=>false,'subtotal'=>$ph,'tarifa_hora'=>$ph,'tarifa_fraccion'=>0,'minutos_extra'=>0];
    }

    // calculo por horas para modalidad "horas"
    $ph = (float)$t['precio_hora'];
    $pf = (float)$t['precio_fraccion'];

    if ($minutos <= 0) $minutos = 1;

    $horas = (int)floor($minutos / 60);
    $resto = $minutos % 60;

    // Mínimo cobrar 1 hora
    if ($horas < 1) $horas = 1;

    $subtotal = $horas * $ph;
    $fraccion = false;

    // Solo cobrar fracción si los minutos restantes superan el tiempo de gracia
    if ($horas >= 1 && $resto > $gracia) {
        $subtotal += $pf;
        $fraccion = true;
    }

    return [
        'horas'          => $horas,
        'fraccion'       => $fraccion,
        'subtotal'       => $subtotal,
        'tarifa_hora'    => $ph,
        'tarifa_fraccion'=> $pf,
        'minutos_extra'  => $resto
    ];
}
?>
