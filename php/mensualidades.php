<?php
require_once 'config.php';
auth();
$i=inp(); $a=$_GET['action']??$i['action']??'';
$db=getDB();

// Auto-actualizar estados
$db->query("UPDATE mensualidades SET estado='pendiente' WHERE fecha_vencimiento<=CURDATE() AND estado='activo'");
$db->query("UPDATE mensualidades SET estado='vencido' WHERE fecha_vencimiento<DATE_SUB(CURDATE(),INTERVAL 5 DAY) AND estado='pendiente'");

switch($a){
case 'listar':
    $r=$db->query("SELECT * FROM mensualidades ORDER BY FIELD(estado,'pendiente','vencido','activo'), fecha_vencimiento ASC");
    $list=[]; while($row=$r->fetch_assoc()) $list[]=$row;
    echo json_encode(['ok'=>true,'mensualidades'=>$list]);
    break;

case 'crear':
    adminOnly();
    $placa=strtoupper(trim($i['placa']??''));
    $nombre=trim($i['nombre']??'');
    $tel=trim($i['telefono']??'');
    if(strlen($placa)!==6){echo json_encode(['error'=>'Placa inválida']);break;}
    if(!$nombre){echo json_encode(['error'=>'Nombre requerido']);break;}

    $tipo=is_numeric(substr($placa,-1))?'carro':'moto';
    $tarifas=getTarifas($db);
    $monto=(float)($tarifas[$tipo]['mensualidad']['precio_mensualidad']??0);

    $st=$db->prepare("SELECT id FROM mensualidades WHERE placa=? AND estado IN ('activo','pendiente')");
    $st->bind_param("s",$placa); $st->execute();
    if($st->get_result()->num_rows>0){echo json_encode(['error'=>"$placa ya tiene mensualidad activa"]);break;}

    $inicio=date('Y-m-d');
    $fin=date('Y-m-d',strtotime('+1 month'));
    $st=$db->prepare("INSERT INTO mensualidades (placa,tipo_vehiculo,nombre_cliente,telefono,fecha_inicio,fecha_vencimiento,monto,estado) VALUES (?,?,?,?,?,?,?,'activo')");
    $st->bind_param("ssssssd",$placa,$tipo,$nombre,$tel,$inicio,$fin,$monto);
    $st->execute();
    echo json_encode(['ok'=>true,'monto'=>$monto,'vencimiento'=>$fin,'tipo'=>$tipo]);
    break;

case 'pagar':
    $id=(int)($i['id']??0);
    $metodo=$i['metodo']??'efectivo';
    $uid=$_SESSION['uid'];
    $st=$db->prepare("SELECT * FROM mensualidades WHERE id=?");
    $st->bind_param("i",$id); $st->execute();
    $m=$st->get_result()->fetch_assoc();
    if(!$m){echo json_encode(['error'=>'No encontrada']);break;}

    // Renovar desde la fecha de vencimiento actual
    $nuevo_venc=date('Y-m-d',strtotime('+1 month',strtotime($m['fecha_vencimiento'])));
    $nuevo_inicio=date('Y-m-d');
    $st=$db->prepare("UPDATE mensualidades SET estado='activo',fecha_inicio=?,fecha_vencimiento=? WHERE id=?");
    $st->bind_param("ssi",$nuevo_inicio,$nuevo_venc,$id); $st->execute();

    $st=$db->prepare("INSERT INTO pagos_mensualidad (mensualidad_id,monto,metodo_pago,operador_id) VALUES (?,?,?,?)");
    $st->bind_param("idsi",$id,$m['monto'],$metodo,$uid); $st->execute();

    $cfg=getCfg($db);
    echo json_encode(['ok'=>true,'nuevo_vencimiento'=>$nuevo_venc,'monto'=>$m['monto'],'config'=>$cfg,
        'mensualidad'=>array_merge($m,['estado'=>'activo','fecha_vencimiento'=>$nuevo_venc])]);
    break;

case 'eliminar':
    adminOnly();
    $id=(int)($i['id']??0);
    $st=$db->prepare("SELECT estado FROM mensualidades WHERE id=?");
    $st->bind_param("i",$id); $st->execute();
    $m=$st->get_result()->fetch_assoc();
    if($m&&$m['estado']==='activo'){echo json_encode(['error'=>'No se puede eliminar una mensualidad activa']);break;}
    $db->query("DELETE FROM mensualidades WHERE id=$id");
    echo json_encode(['ok'=>true]);
    break;

case 'verificar':
    $placa=strtoupper(trim($_GET['placa']??''));
    $st=$db->prepare("SELECT * FROM mensualidades WHERE placa=? AND estado IN ('activo','pendiente') LIMIT 1");
    $st->bind_param("s",$placa); $st->execute();
    $m=$st->get_result()->fetch_assoc();
    echo json_encode(['ok'=>true,'tiene'=>(bool)$m,'mensualidad'=>$m]);
    break;
}
?>
