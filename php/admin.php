<?php
require_once 'config.php';
auth();
$i=inp(); $a=$_GET['action']??$i['action']??'';
$db=getDB();

switch($a){

case 'get_config':
    // ensure tarifas exist (incluye modalidad "horas")
    require_once 'config.php';
    ensureTarifas($db);

    $r=$db->query("SELECT clave,valor FROM configuracion ORDER BY clave");
    $cfg=[]; while($row=$r->fetch_assoc()) $cfg[$row['clave']]=$row['valor'];
    $r2=$db->query("SELECT * FROM tarifas ORDER BY tipo_vehiculo,modalidad");
    $tar=[]; while($row=$r2->fetch_assoc()) $tar[]=$row;
    $r3=$db->query("SELECT * FROM convenios ORDER BY nombre");
    $conv=[]; while($row=$r3->fetch_assoc()) $conv[]=$row;
    $r4=$db->query("SELECT id,nombre,usuario,rol,activo FROM usuarios ORDER BY nombre");
    $usr=[]; while($row=$r4->fetch_assoc()) $usr[]=$row;
    echo json_encode(['ok'=>true,'config'=>$cfg,'tarifas'=>$tar,'convenios'=>$conv,'usuarios'=>$usr]);
    break;

case 'save_config':
    adminOnly();
    foreach($i['configs']??[] as $k=>$v){
        $st=$db->prepare("INSERT INTO configuracion (clave,valor) VALUES (?,?) ON DUPLICATE KEY UPDATE valor=?");
        $st->bind_param("sss",$k,$v,$v); $st->execute();
    }
    echo json_encode(['ok'=>true]);
    break;

case 'save_tarifa':
    adminOnly();
    $id=(int)($i['id']??0);
    $ph=(float)($i['precio_hora']??0);
    $pf=(float)($i['precio_fraccion']??0);
    $pm=(float)($i['precio_mensualidad']??0);
    $st=$db->prepare("UPDATE tarifas SET precio_hora=?,precio_fraccion=?,precio_mensualidad=? WHERE id=?");
    $st->bind_param("dddi",$ph,$pf,$pm,$id); $st->execute();
    echo json_encode(['ok'=>true]);
    break;

case 'save_convenio':
    adminOnly();
    $id=(int)($i['id']??0);
    $nom=$i['nombre']??''; $tipo=$i['tipo']??''; $val=(float)($i['valor']??0);
    if($id){
        $st=$db->prepare("UPDATE convenios SET nombre=?,tipo=?,valor=? WHERE id=?");
        $st->bind_param("ssdi",$nom,$tipo,$val,$id);
    } else {
        $st=$db->prepare("INSERT INTO convenios (nombre,tipo,valor) VALUES (?,?,?)");
        $st->bind_param("ssd",$nom,$tipo,$val);
    }
    $st->execute(); echo json_encode(['ok'=>true]);
    break;

case 'toggle_convenio':
    adminOnly();
    $id=(int)($i['id']??0);
    $db->query("UPDATE convenios SET activo=NOT activo WHERE id=$id");
    echo json_encode(['ok'=>true]);
    break;

case 'del_convenio':
    adminOnly();
    $id=(int)($i['id']??0);
    $db->query("DELETE FROM convenios WHERE id=$id");
    echo json_encode(['ok'=>true]);
    break;

case 'save_usuario':
    adminOnly();
    $id=(int)($i['id']??0); $nom=$i['nombre']??''; $usr=$i['usuario']??''; $rol=$i['rol']??'operador'; $pas=$i['password']??'';
    if($id){
        if($pas){ $h=password_hash($pas,PASSWORD_DEFAULT); $st=$db->prepare("UPDATE usuarios SET nombre=?,usuario=?,rol=?,password=? WHERE id=?"); $st->bind_param("ssssi",$nom,$usr,$rol,$h,$id); }
        else { $st=$db->prepare("UPDATE usuarios SET nombre=?,usuario=?,rol=? WHERE id=?"); $st->bind_param("sssi",$nom,$usr,$rol,$id); }
    } else {
        if(!$pas){echo json_encode(['error'=>'Contraseña requerida']);break;}
        $h=password_hash($pas,PASSWORD_DEFAULT);
        $st=$db->prepare("INSERT INTO usuarios (nombre,usuario,password,rol) VALUES (?,?,?,?)");
        $st->bind_param("ssss",$nom,$usr,$h,$rol);
    }
    if($st->execute()) echo json_encode(['ok'=>true]);
    else echo json_encode(['error'=>'Usuario ya existe']);
    break;

case 'toggle_usuario':
    adminOnly();
    $id=(int)($i['id']??0);
    if($id==$_SESSION['uid']){echo json_encode(['error'=>'No puedes desactivarte']);break;}
    $db->query("UPDATE usuarios SET activo=NOT activo WHERE id=$id");
    echo json_encode(['ok'=>true]);
    break;

case 'reporte':
    adminOnly();
    $periodo=$_GET['periodo']??'dia'; $fecha=$_GET['fecha']??date('Y-m-d');
    switch($periodo){
        case 'dia':    $w="DATE(hora_entrada)='$fecha'"; break;
        case 'semana': $w="YEARWEEK(hora_entrada,1)=YEARWEEK('$fecha',1)"; break;
        case 'mes':    $w="YEAR(hora_entrada)=YEAR('$fecha') AND MONTH(hora_entrada)=MONTH('$fecha')"; break;
        case 'anio':   $w="YEAR(hora_entrada)=YEAR('$fecha')"; break;
        default:       $w="DATE(hora_entrada)='$fecha'";
    }
    $st=$db->query("SELECT COUNT(*) tot, COALESCE(SUM(total),0) ing, COALESCE(AVG(tiempo_minutos),0) prom,
        SUM(tipo='carro') carros, SUM(tipo='moto') motos, COALESCE(SUM(descuento),0) desc_total
        FROM vehiculos WHERE estado='finalizado' AND $w");
    $totales=$st->fetch_assoc();
    $r=$db->query("SELECT modalidad,COUNT(*) n,COALESCE(SUM(total),0) ing FROM vehiculos WHERE estado='finalizado' AND $w GROUP BY modalidad");
    $modal=[]; while($row=$r->fetch_assoc()) $modal[]=$row;
    $r=$db->query("SELECT metodo_pago,COUNT(*) n,COALESCE(SUM(total),0) ing FROM vehiculos WHERE estado='finalizado' AND $w GROUP BY metodo_pago");
    $metodos=[]; while($row=$r->fetch_assoc()) $metodos[]=$row;
    $g=$periodo==='dia'?'HOUR(hora_entrada)':'DATE(hora_entrada)';
    $r=$db->query("SELECT $g lbl,COALESCE(SUM(total),0) total,COUNT(*) n FROM vehiculos WHERE estado='finalizado' AND $w GROUP BY $g ORDER BY $g");
    $serie=[]; while($row=$r->fetch_assoc()) $serie[]=$row;
    echo json_encode(['ok'=>true,'totales'=>$totales,'por_modalidad'=>$modal,'por_metodo'=>$metodos,'serie'=>$serie]);
    break;

case 'export_csv':
    adminOnly();
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename=reporte_'.date('Ymd').'.csv');
    $desde=$_GET['desde']??date('Y-m-d'); $hasta=$_GET['hasta']??date('Y-m-d');
    $r=$db->query("SELECT placa,tipo,modalidad,hora_entrada,hora_salida,tiempo_minutos,subtotal,descuento,total,metodo_pago,tipo_salida FROM vehiculos WHERE DATE(hora_entrada) BETWEEN '$desde' AND '$hasta' AND estado='finalizado' ORDER BY hora_entrada DESC");
    $out=fopen('php://output','w');
    fputcsv($out,['Placa','Tipo','Modalidad','Entrada','Salida','Minutos','Subtotal','Descuento','Total','Metodo','Tipo Salida']);
    while($row=$r->fetch_assoc()) fputcsv($out,$row);
    fclose($out); exit;
    break;
}
?>
