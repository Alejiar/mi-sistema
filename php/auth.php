<?php
require_once 'config.php';
$i = inp(); $a = $_GET['action'] ?? $i['action'] ?? '';
switch($a) {
    case 'login':
        $db = getDB();
        $u = trim($i['usuario'] ?? ''); $p = $i['password'] ?? '';
        $st = $db->prepare("SELECT id,nombre,usuario,password,rol FROM usuarios WHERE usuario=? AND activo=1");
        $st->bind_param("s",$u); $st->execute();
        $row = $st->get_result()->fetch_assoc();
        if ($row && password_verify($p, $row['password'])) {
            $_SESSION['uid']=$row['id']; $_SESSION['nombre']=$row['nombre'];
            $_SESSION['usuario']=$row['usuario']; $_SESSION['rol']=$row['rol'];
            echo json_encode(['ok'=>true,'nombre'=>$row['nombre'],'rol'=>$row['rol']]);
        } else echo json_encode(['error'=>'Usuario o contraseña incorrectos']);
        break;
    case 'logout': session_destroy(); echo json_encode(['ok'=>true]); break;
    case 'check':
        echo json_encode(isset($_SESSION['uid'])
            ? ['logueado'=>true,'nombre'=>$_SESSION['nombre'],'rol'=>$_SESSION['rol']]
            : ['logueado'=>false]);
        break;
}
?>
