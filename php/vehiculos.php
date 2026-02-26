<?php
require_once 'config.php';
auth();
$i = inp(); $a = $_GET['action'] ?? $i['action'] ?? '';
$db = getDB();

switch($a) {

// ---- ENTRADA ----
case 'entrada':
    $placa = strtoupper(trim($i['placa'] ?? ''));
    $cas   = $i['casillero_id'] ?? null;
    $modal = $i['modalidad'] ?? 'dia';

    if (strlen($placa) !== 6) { echo json_encode(['error'=>'Placa debe tener 6 caracteres']); break; }

    $tipo = is_numeric(substr($placa,-1)) ? 'carro' : 'moto';

    // Ya está adentro?
    $st = $db->prepare("SELECT id FROM vehiculos WHERE placa=? AND estado='activo'");
    $st->bind_param("s",$placa); $st->execute();
    if ($st->get_result()->num_rows > 0) { echo json_encode(['error'=>"$placa ya está en el parqueadero"]); break; }

    // ¿Mensualidad?
    $st = $db->prepare("SELECT * FROM mensualidades WHERE placa=? AND estado IN ('activo','pendiente') ORDER BY fecha_vencimiento DESC LIMIT 1");
    $st->bind_param("s",$placa); $st->execute();
    $mens = $st->get_result()->fetch_assoc();

    $cfg     = getCfg($db);
    $tarifas = getTarifas($db);
    
    // Obtener tarifa según tipo y modalidad - debug
    $th = 0;
    $tf = 0;
    if (!$mens) {
        // Verificar que la tarifa exacta exista
        if (isset($tarifas[$tipo]) && isset($tarifas[$tipo][$modal])) {
            $th = (float)$tarifas[$tipo][$modal]['precio_hora'];
            $tf = (float)$tarifas[$tipo][$modal]['precio_fraccion'];
        } else if (isset($tarifas[$tipo]['dia'])) {
            // fallback a día solo si no existe la modalidad
            $th = (float)$tarifas[$tipo]['dia']['precio_hora'];
            $tf = (float)$tarifas[$tipo]['dia']['precio_fraccion'];
        }
    }

    $hora   = date('Y-m-d H:i:s');
    // generar un código corto numérico usando el siguiente id disponible
    // insertamos primero sin código, luego actualizamos con id formateado
    $uid    = $_SESSION['uid'];
    $esM    = $mens ? 1 : 0;
    $mId    = $mens ? $mens['id'] : null;

    $st = $db->prepare("INSERT INTO vehiculos (placa,tipo,modalidad,casillero_id,hora_entrada,tarifa_hora,tarifa_fraccion,operador_entrada_id,estado,es_mensualidad,mensualidad_id) VALUES (?,?,?,?,?,?,?,?,'activo',?,?)");
    $st->bind_param("sssisddisi",$placa,$tipo,$modal,$cas,$hora,$th,$tf,$uid,$esM,$mId);
    $st->execute();
    $vid = $db->insert_id;
    // El código de barras contiene la placa para que el lector llene directamente el campo
    $codigo = $placa;
    $db->query("UPDATE vehiculos SET codigo_barras='$codigo' WHERE id=$vid");

    if ($cas) $db->query("UPDATE casilleros SET ocupado=1 WHERE id=$cas");

    $resp = ['ok'=>true,'vehiculo_id'=>$vid,'placa'=>$placa,'tipo'=>$tipo,'modalidad'=>$modal,
             'hora_entrada'=>$hora,'codigo_barras'=>$codigo,'tarifa_hora'=>$th,'tarifa_fraccion'=>$tf,
             'casillero_id'=>$cas,'config'=>$cfg,'es_mensualidad'=>(bool)$mens];
    if ($mens) $resp['alert_mens'] = "VEHÍCULO DE MENSUALIDAD — {$mens['nombre_cliente']} — Vence: {$mens['fecha_vencimiento']} — Estado: {$mens['estado']}";
    echo json_encode($resp);
    break;

// ---- BUSCAR ACTIVO ----
case 'buscar':
    $q = strtoupper(trim($_GET['q'] ?? $i['q'] ?? ''));
    $st = $db->prepare("SELECT v.*, c.numero AS cas_num FROM vehiculos v LEFT JOIN casilleros c ON v.casillero_id=c.id WHERE (v.placa=? OR v.codigo_barras=?) AND v.estado='activo' LIMIT 1");
    $st->bind_param("ss",$q,$q); $st->execute();
    $v = $st->get_result()->fetch_assoc();
    if (!$v) { echo json_encode(['error'=>'Vehículo no encontrado o ya salió']); break; }

    $cfg  = getCfg($db);
    $now  = new DateTime();
    $ent  = new DateTime($v['hora_entrada']);
    $diff = $now->diff($ent);
    $min  = ($diff->days*1440)+($diff->h*60)+$diff->i;
    if ($min < 1) $min = 1;

    $calculo = ['horas'=>0,'fraccion'=>false,'subtotal'=>0,'tarifa_hora'=>0,'tarifa_fraccion'=>0,'minutos_extra'=>0];
    if (!$v['es_mensualidad']) {
        $tarifas = getTarifas($db);
        // Usar la tarifa actual del sistema según tipo y modalidad
        $calculo = calcularCobro($min, $v['tipo'], $v['modalidad'], $tarifas, $cfg['tiempo_gracia']);
    }

    $convs = [];
    $r = $db->query("SELECT * FROM convenios WHERE activo=1 ORDER BY nombre");
    while ($row=$r->fetch_assoc()) $convs[]=$row;

    echo json_encode(['ok'=>true,'vehiculo'=>$v,'minutos'=>$min,'calculo'=>$calculo,'convenios'=>$convs,'config'=>$cfg]);
    break;

// ---- SALIDA ----
case 'salida':
    $vid     = (int)($i['vehiculo_id'] ?? 0);
    $tsal    = $i['tipo_salida'] ?? 'normal';
    $convId  = $i['convenio_id'] ?? null;
    $metodo  = $i['metodo_pago'] ?? 'efectivo';

    $st = $db->prepare("SELECT v.*, c.numero AS cas_num FROM vehiculos v LEFT JOIN casilleros c ON v.casillero_id=c.id WHERE v.id=? AND v.estado='activo'");
    $st->bind_param("i",$vid); $st->execute();
    $v = $st->get_result()->fetch_assoc();
    if (!$v) { echo json_encode(['error'=>'No encontrado']); break; }

    $cfg  = getCfg($db);
    $now  = new DateTime();
    $ent  = new DateTime($v['hora_entrada']);
    $diff = $now->diff($ent);
    $min  = ($diff->days*1440)+($diff->h*60)+$diff->i;
    if ($min < 1) $min = 1;

    $total    = 0;
    $descuento= 0;
    $calculo  = ['horas'=>0,'fraccion'=>false,'subtotal'=>0,'tarifa_hora'=>0,'tarifa_fraccion'=>0,'minutos_extra'=>0];

    if (!$v['es_mensualidad']) {
        $tarifas = getTarifas($db);
        // Usar tarifa actual del sistema según modalidad
        $calculo = calcularCobro($min, $v['tipo'], $v['modalidad'], $tarifas, $cfg['tiempo_gracia']);
        $total   = $calculo['subtotal'];

        if ($tsal === 'convenio' && $convId) {
            $st2 = $db->prepare("SELECT * FROM convenios WHERE id=? AND activo=1");
            $st2->bind_param("i",$convId); $st2->execute();
            $conv = $st2->get_result()->fetch_assoc();
            if ($conv) {
                if ($conv['tipo']==='horas_gratis')    $descuento = (float)$conv['valor'] * $calculo['tarifa_hora'];
                elseif ($conv['tipo']==='descuento_fijo') $descuento = (float)$conv['valor'];
                elseif ($conv['tipo']==='porcentaje')  $descuento = $total * ((float)$conv['valor']/100);
                $total = max(0, $total - $descuento);
            }
        }
    }

    $hsal = $now->format('Y-m-d H:i:s');
    $uid  = $_SESSION['uid'];
    $hc   = (int)$calculo['horas'];
    $fc   = $calculo['fraccion'] ? 1 : 0;
    $sub  = (float)$calculo['subtotal'];

    // Obtener caja activa para asociar el pago al turno actual
    $cajaId = null;
    $cr = $db->query("SELECT id FROM cajas WHERE estado='abierta' ORDER BY id DESC LIMIT 1");
    if ($cr && $cd = $cr->fetch_assoc()) $cajaId = (int)$cd['id'];

    // Convertir tipos correctamente para bind_param
    $convId = $convId ? (int)$convId : null;
    $descuento = (float)$descuento;
    $total = (float)$total;

    $st = $db->prepare("UPDATE vehiculos SET hora_salida=?,tiempo_minutos=?,horas_cobradas=?,fraccion_cobrada=?,subtotal=?,descuento=?,total=?,convenio_id=?,tipo_salida=?,metodo_pago=?,operador_salida_id=?,caja_id=?,estado='finalizado' WHERE id=?");
    $st->bind_param("siiiidddisiii",$hsal,$min,$hc,$fc,$sub,$descuento,$total,$convId,$tsal,$metodo,$uid,$cajaId,$vid);
    if (!$st->execute()) {
        echo json_encode(['error'=>'Error al actualizar: '.$db->error]);
        break;
    }

    if ($v['casillero_id']) $db->query("UPDATE casilleros SET ocupado=0 WHERE id={$v['casillero_id']}");

    echo json_encode(['ok'=>true,'placa'=>$v['placa'],'tipo'=>$v['tipo'],'modalidad'=>$v['modalidad'],
        'es_mensualidad'=>(bool)$v['es_mensualidad'],'hora_entrada'=>$v['hora_entrada'],'hora_salida'=>$hsal,
        'minutos'=>$min,'calculo'=>$calculo,'descuento'=>$descuento,'total'=>$total,'metodo_pago'=>$metodo,
        'casillero'=>$v['cas_num'],'codigo_barras'=>$v['codigo_barras'],'config'=>$cfg]);
    break;

// ---- ACTIVOS ----
case 'activos':
    $r = $db->query("SELECT v.*, c.numero AS cas_num FROM vehiculos v LEFT JOIN casilleros c ON v.casillero_id=c.id WHERE v.estado='activo' ORDER BY v.hora_entrada DESC");
    $list=[]; $now=new DateTime();
    while($row=$r->fetch_assoc()){
        $e=new DateTime($row['hora_entrada']); $d=$now->diff($e);
        $row['minutos']=($d->days*1440)+($d->h*60)+$d->i;
        $list[]=$row;
    }
    echo json_encode(['ok'=>true,'vehiculos'=>$list]);
    break;

// ---- HISTORIAL ----
case 'historial':
    $desde = $_GET['desde'] ?? $i['desde'] ?? date('Y-m-d');
    $hasta = $_GET['hasta'] ?? $i['hasta'] ?? date('Y-m-d');
    $placa = strtoupper(trim($_GET['placa'] ?? $i['placa'] ?? ''));

    $sql = "SELECT v.*, c.numero AS cas_num, u1.nombre AS op_ent, u2.nombre AS op_sal, cv.nombre AS conv_nom
            FROM vehiculos v
            LEFT JOIN casilleros c ON v.casillero_id=c.id
            LEFT JOIN usuarios u1 ON v.operador_entrada_id=u1.id
            LEFT JOIN usuarios u2 ON v.operador_salida_id=u2.id
            LEFT JOIN convenios cv ON v.convenio_id=cv.id
            WHERE DATE(v.hora_entrada) BETWEEN ? AND ?";
    $params=[$desde,$hasta]; $types="ss";
    if($placa){ $sql.=" AND v.placa LIKE ?"; $params[]="%$placa%"; $types.="s"; }
    $sql.=" ORDER BY v.hora_entrada DESC LIMIT 1000";

    $st=$db->prepare($sql); $st->bind_param($types,...$params); $st->execute();
    $rows=[]; $res=$st->get_result();
    while($row=$res->fetch_assoc()) $rows[]=$row;
    echo json_encode(['ok'=>true,'registros'=>$rows]);
    break;

// ---- VER RECIBO POR ID ----
case 'recibo':
    $vid   = (int)($_GET['id'] ?? 0);
    $cod   = $_GET['codigo'] ?? '';
    if ($vid) {
        $st=$db->prepare("SELECT v.*,c.numero AS cas_num FROM vehiculos v LEFT JOIN casilleros c ON v.casillero_id=c.id WHERE v.id=?");
        $st->bind_param("i",$vid);
    } else {
        $st=$db->prepare("SELECT v.*,c.numero AS cas_num FROM vehiculos v LEFT JOIN casilleros c ON v.casillero_id=c.id WHERE v.placa=? OR v.codigo_barras=? ORDER BY v.hora_entrada DESC LIMIT 1");
        $st->bind_param("ss",$cod,$cod);
    }
    $st->execute(); $v=$st->get_result()->fetch_assoc();
    if(!$v){echo json_encode(['error'=>'No encontrado']); break;}
    $cfg=getCfg($db);
    echo json_encode(['ok'=>true,'vehiculo'=>$v,'config'=>$cfg]);
    break;

// ---- CASILLEROS ----
case 'casilleros':
    $r=$db->query("SELECT * FROM casilleros ORDER BY numero");
    $list=[]; while($row=$r->fetch_assoc()) $list[]=$row;
    echo json_encode(['ok'=>true,'casilleros'=>$list]);
    break;

// ---- CONVENIOS ----
case 'convenios':
    $r=$db->query("SELECT * FROM convenios WHERE activo=1 ORDER BY nombre");
    $list=[]; while($row=$r->fetch_assoc()) $list[]=$row;
    echo json_encode(['ok'=>true,'convenios'=>$list]);
    break;

// ---- DASHBOARD ----
case 'dashboard':
    $hoy = date('Y-m-d');

    // Activos
    $r=$db->query("SELECT tipo,COUNT(*) n FROM vehiculos WHERE estado='activo' GROUP BY tipo");
    $act=['carro'=>0,'moto'=>0]; while($row=$r->fetch_assoc()) $act[$row['tipo']]=(int)$row['n'];

    // Stats hoy
    $st=$db->prepare("SELECT COUNT(*) tot, COALESCE(SUM(total),0) ing, COALESCE(AVG(tiempo_minutos),0) prom,
        SUM(tipo='carro') carros, SUM(tipo='moto') motos
        FROM vehiculos WHERE estado='finalizado' AND DATE(hora_entrada)=?");
    $st->bind_param("s",$hoy); $st->execute();
    $stats=$st->get_result()->fetch_assoc();

    // Por modalidad activos
    $r=$db->query("SELECT modalidad,tipo,GROUP_CONCAT(placa SEPARATOR ',') placas,COUNT(*) n FROM vehiculos WHERE estado='activo' GROUP BY modalidad,tipo");
    $modal=[]; while($row=$r->fetch_assoc()) $modal[]=$row;

    // Ingresos 7 días
    $r=$db->query("SELECT DATE(hora_entrada) dia, COALESCE(SUM(total),0) total FROM vehiculos WHERE estado='finalizado' AND hora_entrada>=DATE_SUB(NOW(),INTERVAL 7 DAY) GROUP BY DATE(hora_entrada) ORDER BY dia");
    $ing7=[]; while($row=$r->fetch_assoc()) $ing7[]=$row;

    // Espacios: usar configuración
    $cfg=getCfg($db);
    $totCarro=(int)($cfg['espacios_carro']??20);
    $totMoto=(int)($cfg['espacios_moto']??10);
    $ocupCarro=(int)$act['carro'];
    $ocupMoto=(int)$act['moto'];

    // Últimas entradas
    $r=$db->query("SELECT placa,tipo,modalidad,hora_entrada FROM vehiculos WHERE estado='activo' ORDER BY hora_entrada DESC LIMIT 8");
    $ult=[]; while($row=$r->fetch_assoc()) $ult[]=$row;

    // Pagos hoy por método
    $st=$db->prepare("SELECT metodo_pago, COALESCE(SUM(total),0) tot FROM vehiculos WHERE estado='finalizado' AND DATE(hora_salida)=? GROUP BY metodo_pago");
    $st->bind_param("s",$hoy); $st->execute();
    $pagos=[]; $rp=$st->get_result(); while($row=$rp->fetch_assoc()) $pagos[$row['metodo_pago']]=$row['tot'];

    echo json_encode(['ok'=>true,'activos'=>$act,'stats'=>$stats,'por_modalidad'=>$modal,
        'ingresos_7dias'=>$ing7,'espacios'=>['tot_carro'=>$totCarro,'tot_moto'=>$totMoto,'ocp_carro'=>$ocupCarro,'ocp_moto'=>$ocupMoto],
        'ultimas'=>$ult,'pagos_hoy'=>$pagos,'config'=>$cfg]);
    break;
}
?>
