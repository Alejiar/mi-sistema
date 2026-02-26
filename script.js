// ============================================================
// ESTADO
// ============================================================
const API = 'php/';
let SES = null, actD = [], mensD = [], cfgD = {}, tarD = [], chIng = null, chRep = null;
let timerActivos = null;

const $=id=>document.getElementById(id);
const api=async(f,a,d={})=>{try{const r=await fetch(`${API}${f}?action=${a}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:a,...d})});return r.json()}catch(e){return{error:'Error de conexión'}}};
const get=async(f,a,p='')=>{try{const r=await fetch(`${API}${f}?action=${a}${p}`);return r.json()}catch(e){return{error:'Error'}}};
const fmt=n=>'$'+Number(n||0).toLocaleString('es-CO');
const fft=s=>s?new Date(s).toLocaleString('es-CO'):'-';
const fmin=m=>{const h=Math.floor(m/60),mn=m%60;return h>0?`${h}h ${mn}m`:`${mn}m`};
const hoy=()=>new Date().toISOString().split('T')[0];
function alerta(id,msg,t='error'){const e=$(id);if(!e)return;e.innerHTML=msg?`<div class="al a${t[0]}">${msg}</div>`:'';if(t!=='error'&&msg)setTimeout(()=>e.innerHTML='',4000)}
function openM(id){$(id).classList.add('show')}
function closeM(id){$(id).classList.remove('show')}

// ============================================================
// LOGIN
// ============================================================
$('lp').addEventListener('keydown',e=>{if(e.key==='Enter')doLogin()});
async function doLogin(){
  const res=await api('auth.php','login',{usuario:$('lu').value,password:$('lp').value});
  if(res.error){alerta('la',res.error);return}
  SES=res;
  $('snombre').textContent=res.nombre;$('srol').textContent=res.rol==='admin'?'Administrador':'Operador';
  $('sav').textContent=res.nombre[0].toUpperCase();
  if(res.rol!=='admin') document.querySelectorAll('.admin-only').forEach(e=>e.style.display='none');
  $('ls').style.display='none';$('app').style.display='flex';$('app').style.flexDirection='column';
  initApp();
}
async function doLogout(){await api('auth.php','logout');location.reload()}

// ============================================================
// INIT
// ============================================================
function initApp(){
  startClock();
  $('dfecha').textContent=new Date().toLocaleDateString('es-CO',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
  $('hd').value=hoy();$('hh').value=hoy();$('rf').value=hoy();$('pf').value=hoy();
  loadDash();loadActivos();loadCaja();updMensBadge();setInterval(updMensBadge,60000);
}

// ============================================================
// RELOJ
// ============================================================
function startClock(){
  const t=()=>{const s=new Date().toLocaleTimeString('es-CO');$('clk').textContent=s;$('eclk')&&($('eclk').textContent=new Date().toLocaleString('es-CO'))};
  t();setInterval(t,1000);
}

// ============================================================
// NAV
// ============================================================
function sp(p,el){
  document.querySelectorAll('.pg').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.ni').forEach(x=>x.classList.remove('active'));
  $(`pg-${p}`).classList.add('active');
  if(el)el.classList.add('active');
  $('tbpg').textContent=el?el.textContent.trim():p;
  const loaders={
    dashboard:loadDash,
    es:()=>{loadActivos();setTimeout(()=>{$('sb-inp')&&$('sb-inp').focus()},300)},
    historial:()=>{$('hd').value=hoy();$('hh').value=hoy();loadHist()},
    mensualidades:loadMens,
    pagos:loadPagos,
    reportes:()=>{$('rf').value=hoy();loadRep()},
    caja:loadCaja,
    config:loadCfg
  };
  if(loaders[p])loaders[p]();
}

function scfg(t,el){
  ['general','tarifas','convenios','recibos','usuarios'].forEach(x=>$(`cfg-${x}`).style.display='none');
  $(`cfg-${t}`).style.display='block';
  document.querySelectorAll('#pg-config .tab').forEach(x=>x.classList.remove('active'));
  el.classList.add('active');
}

// ============================================================
// DASHBOARD
// ============================================================
async function loadDash(){
  const res=await get('vehiculos.php','dashboard');
  if(!res.ok)return;
  $('d-c').textContent=res.activos.carro||0;
  $('d-m').textContent=res.activos.moto||0;
  $('d-ing').textContent=fmt(res.stats.ing);
  $('d-prom').textContent=fmin(Math.round(res.stats.prom||0));

  // Modalidades
  const mmap={dia:[],noche:[],'24horas':[]};
  (res.por_modalidad||[]).forEach(x=>{
    if(mmap[x.modalidad]!==undefined)(x.placas||'').split(',').forEach(p=>p&&mmap[x.modalidad].push({p,t:x.tipo}));
  });
  ['dia','noche','24horas'].forEach(m=>{
    const id={dia:'dm-dia',noche:'dm-noche','24horas':'dm-24h'}[m];
    const items=mmap[m];
    $(id).innerHTML=items.length?items.map(x=>`<div style="display:flex;gap:6px;align-items:center;margin-bottom:4px"><span class="chip">${x.p}</span><span class="badge ${x.t==='carro'?'bc':'bm'}">${x.t}</span></div>`).join(''):'<span style="color:var(--txt3)">Sin vehículos</span>';
  });
  $('dm-mens').innerHTML='<span style="color:var(--txt3);font-size:.8rem">Ver Mensualidades</span>';

  // Ocupación
  const esp=res.espacios||{};
  const updOcp=(tipo,ocp,tot,bId,tId,pId,clr)=>{
    const pct=tot?Math.round(ocp/tot*100):0;
    $(tId).textContent=`${ocp}/${tot}`;$(pId).textContent=`${pct}%`;
    $(bId).style.width=`${pct}%`;$(bId).style.background=clr;
  };
  updOcp('c',esp.ocp_carro||0,esp.tot_carro||0,'bar-c','occ-c','pct-c','var(--blue)');
  updOcp('m',esp.ocp_moto||0,esp.tot_moto||0,'bar-m','occ-m','pct-m','var(--pur)');

  // Chart ingresos
  const i7=res.ingresos_7dias||[];
  const lbl7=i7.map(r=>new Date(r.dia+'T12:00').toLocaleDateString('es-CO',{weekday:'short'}));
  const dat7=i7.map(r=>r.total);
  if(chIng)chIng.destroy();
  chIng=new Chart($('ch-ing'),{type:'bar',data:{labels:lbl7,datasets:[{label:'Ingresos',data:dat7,backgroundColor:'#2563eb',borderRadius:5}]},options:{plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{callback:v=>fmt(v)}},x:{grid:{display:false}}},responsive:true,maintainAspectRatio:false}});

  // Últimas
  $('d-rec').innerHTML=(res.ultimas||[]).map(v=>`<tr>
    <td><span class="chip">${v.placa}</span></td>
    <td><span class="badge ${v.tipo==='carro'?'bc':'bm'}">${v.tipo}</span></td>
    <td><span class="badge bgr">${v.modalidad}</span></td>
    <td style="font-size:.8rem;color:var(--txt2)">${new Date(v.hora_entrada).toLocaleTimeString('es-CO')}</td>
    <td><button class="btn bs bsm" onclick="irSal('${v.placa}')">Salida</button></td>
  </tr>`).join('')||'<tr><td colspan="5"><div class="es">Sin actividad hoy</div></td></tr>';

  // Actualizar contadores entrada
  $('ec-act')&&($('ec-act').textContent=res.activos.carro||0);
  $('em-act')&&($('em-act').textContent=res.activos.moto||0);
}

// ============================================================
// ENTRADA
// ============================================================
async function onPlaca(el){
  const v=el.value.toUpperCase();el.value=v;
  const pill=$('etpill');
  if(v.length<6){pill.className='tpill tn';pill.textContent='Ingrese la placa';$('ecas-sec').style.display='none';return}
  // Verificar mensualidad
  const mr=await get('mensualidades.php','verificar',`&placa=${v}`);
  if(mr.tiene){
    pill.className='tpill tme';
    pill.textContent=`MENSUALIDAD — ${mr.mensualidad.nombre_cliente} (${mr.mensualidad.estado})`;
    $('ecas-sec').style.display='none';return;
  }
  const tipo=isNaN(parseInt(v.slice(-1)))?'moto':'carro';
  pill.className=`tpill t${tipo==='carro'?'c':'m'}`;
  pill.textContent=tipo==='carro'?'Carro detectado':'Moto detectada — Asignar casillero requerido';
  if(tipo==='moto'){$('ecas-sec').style.display='block';loadCasilleros();}
  else{$('ecas-sec').style.display='none';$('ecas-id').value='';}
}

async function loadCasilleros(){
  const res=await get('vehiculos.php','casilleros');
  if(!res.ok)return;
  const sel=$('ecas-id').value;
  $('ecas-grid').innerHTML=res.casilleros.map(c=>{
    const cls=c.id==sel?'cai cas':'cai '+(c.ocupado?'cao':'cal');
    return `<div class="${cls}" onclick="selCas(${c.id},${c.ocupado})">${c.numero}</div>`;
  }).join('');
}
function selCas(id,ocp){if(ocp)return;$('ecas-id').value=id;loadCasilleros()}

async function doEntrada(){
  const placa=$('ep').value.toUpperCase();
  const cas=$('ecas-id').value||null;
  const modal=$('emod').value;
  if(placa.length!==6){alerta('ea','La placa debe tener 6 caracteres');return}
  const res=await api('vehiculos.php','entrada',{placa,casillero_id:cas?parseInt(cas):null,modalidad:modal});
  if(res.error){alerta('ea',res.error);return}
  if(res.es_mensualidad){alerta('ea',`⚠️ ${res.alert_mens}`,'warning')}
  else{alerta('ea',`Vehículo ${placa} registrado`,'success')}
  showReciboEnt(res);
  loadActivos();$('ec-act')&&($('ec-act').textContent=(parseInt($('ec-act').textContent||0)+(res.tipo==='carro'?1:0)));
  $('ep').value='';$('etpill').className='tpill tn';$('etpill').textContent='Ingrese la placa';
  $('ecas-sec').style.display='none';$('ecas-id').value='';
}

// ============================================================
// SALIDA
// ============================================================
async function doBuscar(){
  const q=$('sb-inp').value.toUpperCase();if(!q)return;
  const res=await get('vehiculos.php','buscar',`&q=${encodeURIComponent(q)}`);
  if(res.error){alerta('sa',res.error);$('sc-info').style.display='none';return}
  const v=res.vehiculo,c=res.calculo;
  const modMap={dia:'Día',noche:'Noche','24horas':'24 Horas',horas:'Horas'};
  $('sc-info').style.display='block';
  $('sc-tit').textContent=`Cobro: ${v.placa}`;
  const convOpts=(res.convenios||[]).map(x=>`<option value="${x.id}">${x.nombre}</option>`).join('');
  $('sc-body').innerHTML=`
    <div style="margin-bottom:12px">
      <span class="chip" style="font-size:.95rem">${v.placa}</span>
      <span class="badge ${v.tipo==='carro'?'bc':'bm'}" style="margin-left:6px">${v.tipo}</span>
      <span class="badge bgr" style="margin-left:4px">${modMap[v.modalidad]||v.modalidad}</span>
      ${v.cas_num?`<span class="badge byl" style="margin-left:4px">Casillero #${v.cas_num}</span>`:''}
      ${v.es_mensualidad?'<span class="badge bgn" style="margin-left:4px">Mensualidad</span>':''}
    </div>
    <div style="font-size:.8rem;color:var(--txt2)">Entrada: ${fft(v.hora_entrada)}</div>
    <div style="font-size:1.6rem;font-weight:800;color:var(--blue);margin:6px 0">${fmin(res.minutos)}</div>
    ${v.es_mensualidad?`<div class="al ai">Vehículo de mensualidad — sin cobro por hora</div>`:`
    <div style="background:var(--bg);border-radius:8px;padding:12px;margin-bottom:12px;font-size:.83rem">
      <div style="display:flex;justify-content:space-between;margin-bottom:5px;padding-bottom:5px;border-bottom:1px solid var(--brd)">
        <span style="color:var(--txt2)"><strong>${c.horas}</strong> hora(s)</span>
        <span style="text-align:right"><span style="color:var(--txt2)">@ ${fmt(c.tarifa_hora)}/hora</span><br><strong>${fmt(c.horas*c.tarifa_hora)}</strong></span>
      </div>
      ${c.fraccion?`<div style="display:flex;justify-content:space-between;margin-bottom:5px;padding-top:5px">
        <span style="color:var(--txt2)">Fracción <small>(${c.minutos_extra} min)</small></span>
        <span style="text-align:right"><strong>${fmt(c.tarifa_fraccion)}</strong></span>
      </div>`:''}
      <div style="display:flex;justify-content:space-between;border-top:1px solid var(--brd);padding-top:6px;font-weight:700;margin-top:5px">
        <span>TOTAL</span>
        <span style="color:var(--green);font-size:1.1rem">${fmt(c.subtotal)}</span>
      </div>
    </div>`}
    <div class="tabs">
      <div class="tab active" onclick="sst('normal',this)">Salida normal</div>
      ${!v.es_mensualidad?`<div class="tab" onclick="sst('convenio',this)">Convenio</div>`:''}
    </div>
    <div id="st-normal">
      <div class="fg"><label class="fl">Método de pago</label>
        <select id="smet" class="fc"><option value="efectivo">Efectivo</option><option value="tarjeta">Tarjeta</option><option value="transferencia">Transferencia</option></select>
      </div>
      <button class="btn bg bbl blg" onclick="doSalida(${v.id},'normal',null)">
        ${v.es_mensualidad?'Registrar Salida (sin cobro)':fmt(c.subtotal)+' — Cobrar y Salida'}
      </button>
    </div>
    <div id="st-convenio" style="display:none">
      <div class="fg"><label class="fl">Convenio</label><select id="scv" class="fc">${convOpts}</select></div>
      <div class="fg"><label class="fl">Método de pago</label>
        <select id="smet2" class="fc"><option value="efectivo">Efectivo</option><option value="tarjeta">Tarjeta</option><option value="transferencia">Transferencia</option></select>
      </div>
      <button class="btn bp bbl blg" onclick="doSalidaConv(${v.id})">Aplicar convenio y salida</button>
    </div>
  `;
}

function sst(t,el){
  $('st-normal').style.display=t==='normal'?'block':'none';
  $('st-convenio')&&($('st-convenio').style.display=t==='convenio'?'block':'none');
  document.querySelectorAll('#sc-body .tab').forEach(x=>x.classList.remove('active'));el.classList.add('active');
}

async function doSalida(vid,tipo,conv){
  const met=($('smet')||$('smet2'))?.value||'efectivo';
  const res=await api('vehiculos.php','salida',{vehiculo_id:vid,tipo_salida:tipo,convenio_id:conv,metodo_pago:met});
  if(res.error){alerta('sa',res.error);return}
  alerta('sa','Salida registrada','success');
  $('sb-inp').value='';$('sc-info').style.display='none';
  showReciboSal(res);loadActivos();
}
async function doSalidaConv(vid){
  const conv=$('scv').value,met=$('smet2').value;
  const res=await api('vehiculos.php','salida',{vehiculo_id:vid,tipo_salida:'convenio',convenio_id:conv,metodo_pago:met});
  if(res.error){alerta('sa',res.error);return}
  alerta('sa','Salida con convenio registrada','success');
  $('sb-inp').value='';$('sc-info').style.display='none';
  showReciboSal(res);loadActivos();
}

function irSal(p){
  const navEl=document.querySelector('[data-p="es"]');
  sp('es',navEl);
  $('sb-inp').value=p;
  doBuscar();
}

// ============================================================
// ACTIVOS (con timer en tiempo real)
// ============================================================
async function loadActivos(){
  const res=await get('vehiculos.php','activos');
  actD=res.vehiculos||[];
  renderAct(actD);
  const total=actD.length;
  const nc=actD.filter(v=>v.tipo==='carro').length,nm=actD.filter(v=>v.tipo==='moto').length;
  $('ec-act')&&($('ec-act').textContent=nc);$('em-act')&&($('em-act').textContent=nm);
  $('d-c')&&($('d-c').textContent=nc);$('d-m')&&($('d-m').textContent=nm);
  $('act-badge')&&($('act-badge').textContent=`${total} activo${total!==1?'s':''}`);
  $('es-resumen')&&($('es-resumen').textContent=`${nc} carro${nc!==1?'s':''}, ${nm} moto${nm!==1?'s':''} en parqueadero`);
  startTimerActivos();
}

function renderAct(d){
  $('act-tb').innerHTML=d.length?d.map(v=>`<tr data-entrada="${v.hora_entrada}">
    <td><span class="chip">${v.placa}</span></td>
    <td><span class="badge ${v.tipo==='carro'?'bc':'bm'}">${v.tipo}</span></td>
    <td><span class="badge bgr">${v.modalidad}</span></td>
    <td style="font-size:.8rem">${new Date(v.hora_entrada).toLocaleTimeString('es-CO')}</td>
    <td class="td-tiempo" style="color:var(--blue);font-weight:700">${fmin(v.minutos)}</td>
    <td>${v.cas_num?`#${v.cas_num}`:'-'}</td>
    <td><span class="badge bgn">Activo</span></td>
    <td style="display:flex;gap:5px">
      <button class="btn bs bsm" onclick="verReciboAct('${v.placa}')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      </button>
      <button class="btn bp bsm" onclick="irSal('${v.placa}')">Salida</button>
    </td>
  </tr>`).join(''):'<tr><td colspan="8"><div class="es"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/></svg>Sin vehículos activos</div></td></tr>';
}

function filtAct(q){renderAct(actD.filter(v=>v.placa.includes(q.toUpperCase())))}

function startTimerActivos(){
  if(timerActivos)clearInterval(timerActivos);
  timerActivos=setInterval(updateTiempos,60000);
}

function updateTiempos(){
  const now=new Date();
  document.querySelectorAll('#act-tb tr[data-entrada]').forEach(tr=>{
    const ent=new Date(tr.dataset.entrada);
    const min=Math.floor((now-ent)/60000);
    const td=tr.querySelector('.td-tiempo');
    if(td)td.textContent=fmin(min);
  });
}

async function verReciboAct(placa){
  const res=await get('vehiculos.php','recibo',`&codigo=${placa}`);
  if(res.ok)showReciboEnt({...res.vehiculo,config:res.config});
}

// ============================================================
// HISTORIAL
// ============================================================
async function loadHist(){
  const res=await get('vehiculos.php','historial',`&desde=${$('hd').value}&hasta=${$('hh').value}&placa=${$('hp').value}`);
  const rows=res.registros||[];
  $('hist-tb').innerHTML=rows.length?rows.map(v=>`<tr>
    <td><span class="chip">${v.placa}</span></td>
    <td><span class="badge ${v.tipo==='carro'?'bc':'bm'}">${v.tipo}</span></td>
    <td><span class="badge bgr">${v.modalidad}</span></td>
    <td style="font-size:.78rem">${fft(v.hora_entrada)}</td>
    <td style="font-size:.78rem">${v.hora_salida?fft(v.hora_salida):'<span class="badge bgn">Activo</span>'}</td>
    <td>${v.tiempo_minutos?fmin(v.tiempo_minutos):'-'}</td>
    <td style="color:var(--green);font-weight:700">${v.total?fmt(v.total):'-'}</td>
    <td>${v.estado==='activo'?'<span class="badge bgn">Activo</span>':'<span class="badge bgr">Finalizado</span>'}</td>
    <td><button class="btn bs bsm" onclick="verReciboHist(${v.id})">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
    </button></td>
  </tr>`).join(''):'<tr><td colspan="9"><div class="es"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16"/></svg>Sin registros para el rango seleccionado</div></td></tr>';
}

async function verReciboHist(id){
  const res=await get('vehiculos.php','recibo',`&id=${id}`);
  if(!res.ok)return;
  const v=res.vehiculo;
  // Si tiene hora de salida (o estado finalizado) → recibo de pago; si no → tiquete de entrada
  if(v.hora_salida && v.estado!=='activo'){
    showReciboSal({placa:v.placa,tipo:v.tipo,modalidad:v.modalidad,hora_entrada:v.hora_entrada,hora_salida:v.hora_salida,minutos:v.tiempo_minutos||0,calculo:{horas:v.horas_cobradas,fraccion:!!v.fraccion_cobrada,tarifa_hora:v.tarifa_hora,tarifa_fraccion:v.tarifa_fraccion,subtotal:v.subtotal,minutos_extra:0},descuento:v.descuento,total:v.total,metodo_pago:v.metodo_pago,casillero:v.cas_num,codigo_barras:v.codigo_barras,config:res.config});
  } else {
    showReciboEnt({...v,config:res.config});
  }
}

// ============================================================
// MENSUALIDADES
// ============================================================
async function loadMens(){
  const res=await get('mensualidades.php','listar');
  mensD=res.mensualidades||[];renderMens(mensD);
  $('mn-a').textContent=mensD.filter(m=>m.estado==='activo').length;
  $('mn-p').textContent=mensD.filter(m=>m.estado==='pendiente').length;
  $('mn-v').textContent=mensD.filter(m=>m.estado==='vencido').length;
}
function renderMens(d){
  const eb={activo:'bgn',pendiente:'byl',vencido:'brd'};
  $('mens-tb').innerHTML=d.length?d.map(m=>`<tr>
    <td><span class="chip">${m.placa}</span></td>
    <td><span class="badge ${m.tipo_vehiculo==='carro'?'bc':'bm'}">${m.tipo_vehiculo}</span></td>
    <td style="font-weight:600">${m.nombre_cliente}</td>
    <td style="color:var(--txt2)">${m.telefono||'-'}</td>
    <td style="font-size:.82rem">${m.fecha_vencimiento}</td>
    <td style="color:var(--blue);font-weight:700">${fmt(m.monto)}</td>
    <td><span class="badge ${eb[m.estado]||'bgr'}">${m.estado.toUpperCase()}</span></td>
    <td style="display:flex;gap:5px">
      <button class="btn bg bsm" onclick="abrirPago(${m.id},'${m.nombre_cliente}',${m.monto},'${m.estado}')">Pago</button>
      ${m.estado!=='activo'?`<button class="btn br bsm" onclick="delMens(${m.id})">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
      </button>`:''}
    </td>
  </tr>`).join(''):'<tr><td colspan="8"><div class="es">Sin mensualidades</div></td></tr>';
}
function filtMens(q){renderMens(mensD.filter(m=>m.placa.includes(q.toUpperCase())||m.nombre_cliente.toLowerCase().includes(q.toLowerCase())))}

async function crearMens(){
  const p=$('nmp').value.toUpperCase(),n=$('nmn').value,t=$('nmt').value;
  if(p.length!==6){alerta('nm-al','Placa inválida');return}
  if(!n){alerta('nm-al','Nombre requerido');return}
  const res=await api('mensualidades.php','crear',{placa:p,nombre:n,telefono:t});
  if(res.error){alerta('nm-al',res.error);return}
  closeM('m-nueva');loadMens();
  $('nmp').value='';$('nmn').value='';$('nmt').value='';
}

function abrirPago(id,nom,monto,estado){
  $('pmid').value=id;
  $('pm-info').innerHTML=`<div class="al ai"><strong>${nom}</strong><br>Monto: <strong>${fmt(monto)}</strong></div>`;
  openM('m-pago');
}
async function pagarMens(){
  const res=await api('mensualidades.php','pagar',{id:$('pmid').value,metodo:$('pmmet').value});
  if(res.error){alert(res.error);return}
  closeM('m-pago');loadMens();showReciboMens(res);
}
async function delMens(id){
  if(!confirm('¿Eliminar esta mensualidad?'))return;
  const res=await api('mensualidades.php','eliminar',{id});
  if(res.error){alert(res.error);return}
  loadMens();
}
async function updMensBadge(){
  const res=await get('mensualidades.php','listar');
  const n=(res.mensualidades||[]).filter(m=>m.estado!=='activo').length;
  $('bmens').textContent=n;
}

// ============================================================
// PAGOS
// ============================================================
async function loadPagos(){
  const f=$('pf').value;
  const res=await get('vehiculos.php','historial',`&desde=${f}&hasta=${f}`);
  const rows=(res.registros||[]).filter(r=>r.estado==='finalizado');
  let ef=0,tar=0,tra=0;
  rows.forEach(r=>{if(r.metodo_pago==='efectivo')ef+=parseFloat(r.total||0);else if(r.metodo_pago==='tarjeta')tar+=parseFloat(r.total||0);else tra+=parseFloat(r.total||0)});
  $('pef').textContent=fmt(ef);$('ptar').textContent=fmt(tar);$('ptra').textContent=fmt(tra);
  $('pag-tb').innerHTML=rows.map(v=>`<tr>
    <td><span class="chip">${v.placa}</span></td>
    <td><span class="badge ${v.tipo==='carro'?'bc':'bm'}">${v.tipo}</span></td>
    <td>${v.tiempo_minutos?fmin(v.tiempo_minutos):'-'}</td>
    <td style="color:var(--green);font-weight:700">${fmt(v.total)}</td>
    <td><span class="badge bgr">${v.metodo_pago||'-'}</span></td>
    <td style="font-size:.8rem;color:var(--txt2)">${fft(v.hora_salida)}</td>
  </tr>`).join('')||'<tr><td colspan="6"><div class="es">Sin pagos este día</div></td></tr>';
}

// ============================================================
// REPORTES
// ============================================================
async function loadRep(){
  const f=$('rf').value,p=$('rp').value;
  const res=await get('admin.php','reporte',`&fecha=${f}&periodo=${p}`);
  if(!res.ok)return;
  const t=res.totales;
  $('rep-stats').innerHTML=`
    <div class="sc" style="display:flex;align-items:center;gap:12px"><div class="si" style="background:var(--blue-l)"><svg viewBox="0 0 24 24" fill="none" stroke="var(--blue)" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/></svg></div><div><div class="sl">Total vehículos</div><div class="sv">${t.tot||0}</div></div></div>
    <div class="sc" style="display:flex;align-items:center;gap:12px"><div class="si" style="background:var(--green-l)"><svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6"/></svg></div><div><div class="sl">Ingresos</div><div class="sv">${fmt(t.ing)}</div></div></div>
    <div class="sc" style="display:flex;align-items:center;gap:12px"><div class="si" style="background:var(--pur-l)"><svg viewBox="0 0 24 24" fill="none" stroke="var(--pur)" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg></div><div><div class="sl">Carros / Motos</div><div class="sv">${t.carros||0} / ${t.motos||0}</div></div></div>
    <div class="sc" style="display:flex;align-items:center;gap:12px"><div class="si" style="background:var(--yel-l)"><svg viewBox="0 0 24 24" fill="none" stroke="var(--yel)" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div><div><div class="sl">Tiempo prom.</div><div class="sv">${fmin(Math.round(t.prom||0))}</div></div></div>
  `;
  const serie=res.serie||[];
  if(chRep)chRep.destroy();
  chRep=new Chart($('ch-rep'),{type:'line',data:{labels:serie.map(s=>s.lbl),datasets:[{label:'Ingresos',data:serie.map(s=>s.total),borderColor:'#2563eb',backgroundColor:'rgba(37,99,235,.08)',fill:true,tension:.4,borderWidth:2,pointRadius:3}]},options:{plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{callback:v=>fmt(v)}},x:{grid:{display:false}}},responsive:true,maintainAspectRatio:false}});
  $('rep-modal').innerHTML=(res.por_modalidad||[]).map(m=>`<div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--brd)"><span class="badge bgr">${m.modalidad}</span><span>${m.n} veh.</span><span style="color:var(--green);font-weight:700">${fmt(m.ing)}</span></div>`).join('')||'<div class="es">Sin datos</div>';
}
function expCSV(){const d=$('hd')?.value||hoy(),h=$('hh')?.value||hoy();window.open(`${API}admin.php?action=export_csv&desde=${d}&hasta=${h}`,'_blank')}

// ============================================================
// CAJA / TURNO
// ============================================================
async function loadCaja(){
  const res=await get('caja.php','estado');
  if(!res.ok)return;
  const c=res.caja,s=res.stats;
  $('cj-ef')&&($('cj-ef').textContent=fmt(s.ef||0));
  $('cj-tar')&&($('cj-tar').textContent=fmt(s.tar||0));
  $('cj-tra')&&($('cj-tra').textContent=fmt(s.tra||0));
  $('cj-ing')&&($('cj-ing').textContent=fmt(s.ing||0));
  $('cj-sal')&&($('cj-sal').textContent=s.tot||0);
  $('caja-banner')&&($('caja-banner').innerHTML=`Turno activo desde <strong>${fft(c.hora_apertura)}</strong> — Operador: <strong>${c.operador_nombre||'—'}</strong> — Vehículos en parqueadero: <strong>${res.activos}</strong>`);
  $('caja-sub')&&($('caja-sub').textContent=`Turno #${c.id} · Iniciado ${fft(c.hora_apertura)}`);
  if($('cj-tb')){
    $('cj-tb').innerHTML=(res.ultimas||[]).length?res.ultimas.map(v=>`<tr>
      <td><span class="chip">${v.placa}</span></td>
      <td><span class="badge ${v.tipo==='carro'?'bc':'bm'}">${v.tipo}</span></td>
      <td><span class="badge bgr">${v.modalidad}</span></td>
      <td style="font-size:.78rem">${fft(v.hora_salida)}</td>
      <td>${v.tiempo_minutos?fmin(v.tiempo_minutos):'-'}</td>
      <td style="color:var(--green);font-weight:700">${fmt(v.total)}</td>
      <td><span class="badge bgr">${v.metodo_pago||'-'}</span></td>
    </tr>`).join(''):'<tr><td colspan="7"><div class="es">Sin transacciones en este turno</div></td></tr>';
  }
  loadCajaHist();
}

async function loadCajaHist(){
  const res=await get('caja.php','historial');
  if(!res.ok||!$('cj-hist'))return;
  const list=res.cajas||[];
  $('cj-hist').innerHTML=list.length?list.map(c=>`
    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--brd);flex-wrap:wrap;gap:6px">
      <div>
        <div style="font-weight:600;font-size:.85rem">Turno #${c.id} — ${c.operador_nombre||'—'}</div>
        <div style="font-size:.75rem;color:var(--txt2)">${fft(c.hora_apertura)} → ${fft(c.hora_cierre)}</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <span style="font-weight:700;color:var(--green)">${fmt(c.total_ingresos)}</span>
        <span style="font-size:.75rem;color:var(--txt2)">${c.total_salidas} salidas</span>
        <button class="btn bs bsm" onclick="verDetalleCaja(${c.id})">Ver detalle</button>
      </div>
    </div>`).join(''):'<div class="es">Sin cierres anteriores</div>';
}

async function cerrarCaja(){
  if(!confirm('¿Cerrar el turno actual? Se abrirá uno nuevo automáticamente.'))return;
  const res=await api('caja.php','cerrar',{});
  if(res.error){alert(res.error);return}
  showReciboCaja(res);
  loadCaja();
}

function showReciboCaja(data){
  const c=data.caja_cerrada;
  const s=data.stats;
  const nombre=data.config?data.config.nombre_parqueadero:(cfgD.nombre_parqueadero||'PARQUEADERO');
  const nit=data.config?data.config.nit:(cfgD.nit||'');
  let h='';
  h+=`<div class="rtit">${nombre}</div>`;
  if(nit)h+=`<div class="rct">NIT: ${nit}</div>`;
  h+=`<hr class="rsep">`;
  h+=`<div class="rtit">*** CIERRE DE TURNO ***</div>`;
  h+=`<hr class="rsep">`;
  h+=`<div class="rrow"><span>Turno #:</span><span>${c.id}</span></div>`;
  h+=`<div class="rrow"><span>Operador:</span><span>${c.operador_nombre||'—'}</span></div>`;
  h+=`<div class="rrow"><span>Apertura:</span><span>${fft(c.hora_apertura)}</span></div>`;
  h+=`<div class="rrow"><span>Cierre:</span><span>${fft(data.hora_cierre)}</span></div>`;
  h+=`<hr class="rsep">`;
  h+=`<div class="rrow"><span>Total salidas:</span><span>${s.tot||0}</span></div>`;
  h+=`<div class="rrow"><span>Efectivo:</span><span>${fmt(s.ef||0)}</span></div>`;
  h+=`<div class="rrow"><span>Tarjeta:</span><span>${fmt(s.tar||0)}</span></div>`;
  h+=`<div class="rrow"><span>Transferencia:</span><span>${fmt(s.tra||0)}</span></div>`;
  h+=`<hr class="rsep">`;
  h+=`<div class="rtot">${fmt(s.ing||0)}</div>`;
  h+=`<div class="rct">TOTAL DEL TURNO</div>`;
  if(data.vehiculos_activos>0)h+=`<div class="rct" style="margin-top:6px;font-size:.8rem;color:#b45309">${data.vehiculos_activos} vehículo(s) aún dentro del parqueadero</div>`;
  h+=`<hr class="rsep">`;
  h+=`<div class="rct" style="font-size:10px">Nuevo turno iniciado automáticamente</div>`;
  $('rhtml').innerHTML=h;
  $('rp-wrap').style.width='300px';
  $('ro').classList.add('show');
}

async function verDetalleCaja(id){
  const res=await get('caja.php','detalle',`&id=${id}`);
  if(!res.ok)return;
  const c=res.caja,txs=res.transacciones||[];
  const nombre=res.config?res.config.nombre_parqueadero:(cfgD.nombre_parqueadero||'PARQUEADERO');
  let h='';
  h+=`<div class="rtit">${nombre}</div>`;
  h+=`<hr class="rsep">`;
  h+=`<div class="rtit">*** DETALLE DE TURNO ***</div>`;
  h+=`<hr class="rsep">`;
  h+=`<div class="rrow"><span>Turno #:</span><span>${c.id}</span></div>`;
  h+=`<div class="rrow"><span>Operador:</span><span>${c.operador_nombre||'—'}</span></div>`;
  h+=`<div class="rrow"><span>Apertura:</span><span>${fft(c.hora_apertura)}</span></div>`;
  h+=`<div class="rrow"><span>Cierre:</span><span>${fft(c.hora_cierre)}</span></div>`;
  h+=`<hr class="rsep">`;
  h+=`<div class="rrow"><span>Total salidas:</span><span>${c.total_salidas}</span></div>`;
  h+=`<div class="rrow"><span>Efectivo:</span><span>${fmt(c.ingresos_efectivo)}</span></div>`;
  h+=`<div class="rrow"><span>Tarjeta:</span><span>${fmt(c.ingresos_tarjeta)}</span></div>`;
  h+=`<div class="rrow"><span>Transferencia:</span><span>${fmt(c.ingresos_transferencia)}</span></div>`;
  h+=`<hr class="rsep">`;
  h+=`<div class="rtot">${fmt(c.total_ingresos)}</div>`;
  h+=`<div class="rct">TOTAL DEL TURNO</div>`;
  if(txs.length){
    h+=`<hr class="rsep"><div class="rct" style="font-weight:700;margin-bottom:4px">TRANSACCIONES (${txs.length})</div>`;
    txs.forEach(t=>{
      h+=`<div class="rrow" style="font-size:.78rem"><span>${t.placa} · ${new Date(t.hora_salida).toLocaleTimeString('es-CO')}</span><span>${fmt(t.total)}</span></div>`;
    });
  }
  $('rhtml').innerHTML=h;
  $('rp-wrap').style.width='300px';
  $('ro').classList.add('show');
}

// ============================================================
// CONFIGURACIÓN
// ============================================================
async function loadCfg(){
  const res=await get('admin.php','get_config');
  if(!res.ok)return;
  cfgD=res.config||{};tarD=res.tarifas||[];
  const c=cfgD;
  $('cn').value=c.nombre_parqueadero||'';$('cnit').value=c.nit||'';
  $('cdir').value=c.direccion||'';$('ctel').value=c.telefono||'';
  $('cgr').value=c.tiempo_gracia||'10';$('cgr2').value=c.tiempo_gracia||'10';
  $('cec').value=c.espacios_carro||'20';$('cem').value=c.espacios_moto||'10';
  $('ccas').value=res.tarifas?'30':'30';
  // Recibos
  $('rlogo').value=c.logo_url||'';$('rnombre').value=c.nombre_parqueadero||'';
  $('rnit').value=c.nit||'';$('rdir').value=c.direccion||'';$('rtel').value=c.telefono||'';
  $('rpie').value=c.recibo_pie||'';$('renc').value=c.recibo_encabezado||'';
  $('rmn').checked=c.recibo_mostrar_nit==='1';$('rmd').checked=c.recibo_mostrar_dir==='1';
  $('rmt').checked=c.recibo_mostrar_tel==='1';$('rmb').checked=c.recibo_mostrar_barcode==='1';
  $('rancho').value=c.ancho_recibo||'80';
  if(c.logo_url)$('logo-prev').innerHTML=`<img src="${c.logo_url}" style="max-height:50px;border-radius:6px;object-fit:contain">`;
  // Preview logo en tiempo real
  $('rlogo').oninput=function(){$('logo-prev').innerHTML=this.value?`<img src="${this.value}" style="max-height:50px;border-radius:6px;object-fit:contain" onerror="this.style.display='none'">`:''}
  renderTarifas(tarD);
  renderConvs(res.convenios||[]);
  renderUsrs(res.usuarios||[]);
}

async function saveConfig(){
  const configs={
    nombre_parqueadero:$('cn').value,nit:$('cnit').value,
    direccion:$('cdir').value,telefono:$('ctel').value,
    tiempo_gracia:$('cgr').value||$('cgr2').value,
    espacios_carro:$('cec').value,espacios_moto:$('cem').value,
    logo_url:$('rlogo').value,ancho_recibo:$('rancho').value,
    recibo_pie:$('rpie').value,recibo_encabezado:$('renc').value,
    recibo_mostrar_nit:$('rmn').checked?'1':'0',
    recibo_mostrar_dir:$('rmd').checked?'1':'0',
    recibo_mostrar_tel:$('rmt').checked?'1':'0',
    recibo_mostrar_barcode:$('rmb').checked?'1':'0',
  };
  await api('admin.php','save_config',{configs});
  await saveTarifas();
  alerta('cfg-al','Configuración guardada correctamente','success');
  cfgD={...cfgD,...configs};
}

// ============================================================
// TARIFAS
// ============================================================
function renderTarifas(tar){
  // Agrupar por tipo_vehiculo
  const grupos={carro:[],moto:[]};
  tar.forEach(t=>grupos[t.tipo_vehiculo]&&grupos[t.tipo_vehiculo].push(t));
  const mnames={dia:'Día',noche:'Noche','24horas':'24 Horas',mensualidad:'Mensualidad'};
  $('tar-grid').innerHTML=['carro','moto'].map(tipo=>`
    <div class="card">
      <div class="ct2">${tipo==='carro'?'Carro':'Moto'}</div>
      ${grupos[tipo].map(t=>`
        <div style="border-bottom:1px solid var(--brd);padding:12px 0" data-tid="${t.id}">
          <div style="font-weight:600;margin-bottom:8px;font-size:.85rem">${mnames[t.modalidad]||t.modalidad}</div>
          ${t.modalidad!=='mensualidad'?`
          <div class="g2">
            <div class="fg" style="margin:0"><label class="fl">Precio ${t.modalidad==='horas'?'por hora':'(fijo por ingreso)'}</label><input type="number" class="fc tf-h" value="${t.precio_hora}" data-id="${t.id}"></div>
            ${t.modalidad==='horas'?`<div class="fg" style="margin:0"><label class="fl">Fracción</label><input type="number" class="fc tf-f" value="${t.precio_fraccion}" data-id="${t.id}"></div>`:''}
          </div>`:`
          <div class="fg" style="margin:0"><label class="fl">Precio mensualidad</label><input type="number" class="fc tf-m" value="${t.precio_mensualidad}" data-id="${t.id}"></div>
          `}
        </div>`).join('')}
    </div>`).join('');
}

async function saveTarifas(){
  const blocks=document.querySelectorAll('[data-tid]');
  await Promise.all([...blocks].map(b=>{
    const id=b.dataset.tid;
    const ph=b.querySelector('.tf-h')?.value||0;
    const pf=b.querySelector('.tf-f')?.value||0;
    const pm=b.querySelector('.tf-m')?.value||0;
    return api('admin.php','save_tarifa',{id,precio_hora:ph,precio_fraccion:pf,precio_mensualidad:pm});
  }));
}

// ============================================================
// CONVENIOS
// ============================================================
function updConvLbl(){const l={horas_gratis:'Número de horas',descuento_fijo:'Monto en pesos ($)',porcentaje:'Porcentaje (%)'};$('cvl').textContent=l[$('cvt').value]||'Valor'}
function renderConvs(d){
  const tipos={horas_gratis:'Horas gratis',descuento_fijo:'Desc. fijo',porcentaje:'Porcentaje'};
  $('conv-list').innerHTML=d.map(c=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid var(--brd)">
    <div><div style="font-weight:600;font-size:.85rem">${c.nombre}</div><div style="font-size:.75rem;color:var(--txt2)">${tipos[c.tipo]}: ${c.tipo==='porcentaje'?c.valor+'%':fmt(c.valor)}</div></div>
    <div style="display:flex;gap:5px">
      <button class="btn bsm ${c.activo?'by':'bg'}" onclick="toggleConv(${c.id})">${c.activo?'Inactivo':'Activo'}</button>
      <button class="btn br bsm" onclick="delConv(${c.id})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg></button>
    </div>
  </div>`).join('')||'<div class="es">Sin convenios</div>';
}
async function saveConv(){
  const res=await api('admin.php','save_convenio',{nombre:$('cvn').value,tipo:$('cvt').value,valor:$('cvv').value});
  if(res.ok){$('cvn').value='';$('cvv').value='';loadCfg()}else alerta('conv-al',res.error);
}
async function toggleConv(id){await api('admin.php','toggle_convenio',{id});loadCfg()}
async function delConv(id){if(confirm('¿Eliminar?')){await api('admin.php','del_convenio',{id});loadCfg()}}

// ============================================================
// USUARIOS
// ============================================================
function renderUsrs(d){
  $('usr-list').innerHTML=d.map(u=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid var(--brd)">
    <div style="display:flex;align-items:center;gap:8px">
      <div class="av" style="width:28px;height:28px;font-size:.75rem">${u.nombre[0]}</div>
      <div><div style="font-weight:600;font-size:.85rem">${u.nombre}</div><div style="font-size:.72rem;color:var(--txt2)">@${u.usuario} · ${u.rol}</div></div>
    </div>
    <button class="btn bsm ${u.activo?'by':'bg'}" onclick="toggleUsr(${u.id})">${u.activo?'Desact.':'Activ.'}</button>
  </div>`).join('');
}
async function saveUsr(){
  const res=await api('admin.php','save_usuario',{nombre:$('un').value,usuario:$('uu').value,password:$('up').value,rol:$('ur').value});
  if(res.error){alerta('usr-al',res.error);return}
  alerta('usr-al','Usuario creado','success');$('un').value='';$('uu').value='';$('up').value='';loadCfg();
}
async function toggleUsr(id){await api('admin.php','toggle_usuario',{id});loadCfg()}

async function updateCasilleros(n){
  // Insertar casilleros hasta n
  const db_n=parseInt(n);if(!db_n||db_n<1)return;
  // Se gestiona desde SQL directo - informar al admin
}

// ============================================================
// RECIBOS
// ============================================================
function getCfgRecibo(){
  return{
    nombre:cfgD.nombre_parqueadero||'PARQUEADERO',nit:cfgD.nit||'',dir:cfgD.direccion||'',tel:cfgD.telefono||'',
    logo:cfgD.logo_url||'',pie:cfgD.recibo_pie||'',enc:cfgD.recibo_encabezado||'',
    mn:cfgD.recibo_mostrar_nit==='1',md:cfgD.recibo_mostrar_dir==='1',
    mt:cfgD.recibo_mostrar_tel==='1',mb:cfgD.recibo_mostrar_barcode==='1',
    ancho:parseInt(cfgD.ancho_recibo||80)
  };
}

function buildRecibo(datos,tipo){
  const cfg=datos.config?{
    nombre:datos.config.nombre_parqueadero,nit:datos.config.nit,dir:datos.config.direccion,tel:datos.config.telefono,
    logo:datos.config.logo_url,pie:datos.config.recibo_pie,enc:datos.config.recibo_encabezado||'',
    mn:datos.config.recibo_mostrar_nit==='1',md:datos.config.recibo_mostrar_dir==='1',
    mt:datos.config.recibo_mostrar_tel==='1',mb:datos.config.recibo_mostrar_barcode==='1',
    ancho:parseInt(datos.config.ancho_recibo||80)
  }:getCfgRecibo();

  // Ancho fijo para papel 58mm (54mm área imprimible con márgenes de 2mm c/u)
  const mmw='54mm';
  const bid='bc'+Date.now();
  let h='';

  // ── ENCABEZADO ──
  if(cfg.logo)h+=`<div class="rct" style="margin-bottom:4px"><img src="${cfg.logo}" style="max-width:100%;max-height:44px;object-fit:contain"></div>`;
  h+=`<div class="rtit">${cfg.nombre}</div>`;
  if(cfg.mn&&cfg.nit) h+=`<div class="rct"><b>NIT: ${cfg.nit}</b></div>`;
  if(cfg.md&&cfg.dir) h+=`<div class="rct"><b>${cfg.dir}</b></div>`;
  if(cfg.mt&&cfg.tel) h+=`<div class="rct"><b>Tel: ${cfg.tel}</b></div>`;
  if(cfg.enc)         h+=`<div class="rct"><b>${cfg.enc}</b></div>`;

  if(tipo==='entrada'){
    // ── TIQUETE DE ENTRADA ──
    h+=`<div style="margin:4px 0"></div>`;
    h+=`<div class="rtit">TIQUETE DE ENTRADA</div>`;
    h+=`<div style="margin:3px 0"></div>`;
    h+=`<div class="rrow"><b>Placa: ${datos.placa}</b></div>`;
    h+=`<div class="rrow"><b>Tipo: ${(datos.tipo||'').toUpperCase()}</b></div>`;
    h+=`<div class="rrow"><b>Modalidad: ${datos.modalidad||'dia'}</b></div>`;
    if(datos.casillero_id||datos.casillero)
      h+=`<div class="rrow"><b>Casillero: #${datos.casillero_id||datos.casillero}</b></div>`;
    h+=`<div class="rrow"><b>Entrada: ${new Date(datos.hora_entrada).toLocaleString('es-CO')}</b></div>`;
    if(datos.tarifa_hora)
      h+=`<div class="rrow"><b>Tarifa/hora: ${fmt(datos.tarifa_hora)}</b></div>`;
    if(datos.tarifa_fraccion)
      h+=`<div class="rrow"><b>Fraccion: ${fmt(datos.tarifa_fraccion)}</b></div>`;
    // CÓDIGO DE BARRAS — solo en tiquete de entrada (para escanear al salir)
    if(cfg.mb&&datos.codigo_barras){
      h+=`<div style="margin:8px 0 4px 0;text-align:center">`;
      h+=`<svg id="${bid}" style="display:block;margin:0 auto;max-width:100%"></svg>`;
      h+=`<div class="rct" style="font-size:11px;font-weight:bold;letter-spacing:4px;margin-top:4px">${datos.codigo_barras}</div>`;
      h+=`</div>`;
    }

  } else if(tipo==='salida'){
    // ── RECIBO DE PAGO (sin código de barras) ──
    h+=`<div style="margin:4px 0"></div>`;
    h+=`<div class="rtit">RECIBO DE PAGO</div>`;
    h+=`<div style="margin:3px 0"></div>`;
    h+=`<div class="rrow"><b>Placa: ${datos.placa}</b></div>`;
    h+=`<div class="rrow"><b>Tipo: ${(datos.tipo||'').toUpperCase()}</b></div>`;
    h+=`<div class="rrow"><b>Modalidad: ${datos.modalidad||''}</b></div>`;
    h+=`<div class="rrow"><b>Entrada: ${new Date(datos.hora_entrada).toLocaleString('es-CO')}</b></div>`;
    h+=`<div class="rrow"><b>Salida: ${new Date(datos.hora_salida).toLocaleString('es-CO')}</b></div>`;
    h+=`<div class="rrow"><b>Tiempo: ${fmin(datos.minutos||0)}</b></div>`;
    h+=`<div style="margin:4px 0"></div>`;
    if(datos.es_mensualidad){
      h+=`<div class="rct"><b>MENSUALIDAD - SIN COBRO</b></div>`;
    } else if(datos.calculo){
      h+=`<div class="rrow"><b>${datos.calculo.horas} hora(s) x ${fmt(datos.calculo.tarifa_hora)}: ${fmt(datos.calculo.horas*(datos.calculo.tarifa_hora||0))}</b></div>`;
      if(datos.calculo.fraccion)
        h+=`<div class="rrow"><b>Fraccion: ${fmt(datos.calculo.tarifa_fraccion)}</b></div>`;
      if(datos.descuento>0)
        h+=`<div class="rrow"><b>Descuento: -${fmt(datos.descuento)}</b></div>`;
    }
    h+=`<div style="margin:4px 0"></div>`;
    h+=`<div class="rtot"><b>${fmt(datos.total)}</b></div>`;
    h+=`<div class="rct"><b>Pago: ${(datos.metodo_pago||'efectivo').toUpperCase()}</b></div>`;

  } else if(tipo==='mensualidad'){
    // ── PAGO MENSUALIDAD ──
    h+=`<div style="margin:4px 0"></div>`;
    h+=`<div class="rtit">PAGO MENSUALIDAD</div>`;
    h+=`<div style="margin:3px 0"></div>`;
    if(datos.mensualidad){
      h+=`<div class="rrow"><b>Placa: ${datos.mensualidad.placa}</b></div>`;
      h+=`<div class="rrow"><b>Cliente: ${datos.mensualidad.nombre_cliente}</b></div>`;
    }
    h+=`<div class="rrow"><b>Monto: ${fmt(datos.monto)}</b></div>`;
    h+=`<div class="rrow"><b>Nuevo venc.: ${datos.nuevo_vencimiento}</b></div>`;
    h+=`<div class="rrow"><b>Fecha pago: ${new Date().toLocaleString('es-CO')}</b></div>`;
  }

  if(cfg.pie)h+=`<div class="rct" style="margin-top:5px;font-size:10px"><b>${cfg.pie}</b></div>`;

  // El código de barras solo se renderiza para tiquete de entrada
  return{html:h,bid,codigo:(tipo==='entrada'?datos.codigo_barras:null),ancho:mmw};
}

function showR(datos,tipo){
  const{html,bid,codigo,ancho}=buildRecibo(datos,tipo);
  $('rhtml').innerHTML=html;
  $('rp-wrap').style.width=ancho;
  $('ro').classList.add('show');
  if(codigo){
    setTimeout(()=>{
      try{
        // CODE39: máxima compatibilidad con lectores como Jaltech POS
        // El contenido del barcode es la placa (ej: ABC123)
        JsBarcode('#'+bid, codigo, {
          format:'CODE39',
          width:1.5,
          height:45,
          displayValue:false,
          margin:8,
          lineColor:'#000000',
          background:'#FFFFFF'
        });
      }catch(e){}
    },100);
  }
}
function showReciboEnt(d){showR(d,'entrada')}
function showReciboSal(d){showR(d,'salida')}
function showReciboMens(d){showR(d,'mensualidad')}
function closeR(){$('ro').classList.remove('show')}

function printR(){
  const html=$('rhtml').innerHTML;
  // Ventana de previsualización con ancho representativo de 58mm
  const w=window.open('','_blank','width=380,height=700,left=100,top=50');
  w.document.write(`<html><head><title>Recibo</title>
  <style>
  /* ──────────────────────────────────────────────────
     IMPRESORA TÉRMICA 58mm — escala 110% en diálogo
     Área imprimible real: ~52mm (58mm - 3mm margen c/u)
     Con escala 110% en el diálogo: 52/1.1 ≈ 47mm útiles
     Se usa 46mm de ancho de contenido para no recortar
  ────────────────────────────────────────────────── */
  @page {
    size: 58mm auto;
    margin: 2mm 3mm;
  }
  * { box-sizing: border-box; }
  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 9.5pt;
    font-weight: bold;
    width: 46mm;
    margin: 0;
    padding: 0;
    color: #000;
    line-height: 1.45;
  }
  b { font-weight: bold; }
  .rct  { text-align: center; font-weight: bold; }
  .rsep { text-align: center; margin: 5px 0; font-weight: bold; letter-spacing: 0; }
  .rrow { display: block; margin: 2px 0; font-weight: bold; word-break: break-word; }
  .rtit { font-size: 10pt; font-weight: bold; text-align: center; margin: 4px 0; }
  .rtot { font-size: 16pt; font-weight: bold; text-align: center; margin: 6px 0; letter-spacing: 1px; }
  svg   { display: block; margin: 8px auto; max-width: 100%; }
  img   { max-width: 100%; height: auto; object-fit: contain; display: block; margin: 0 auto; }
  div[style*="margin:10px 0"] { margin: 8px 0 !important; }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></scr`+`ipt>
  </head><body>${html}<script>
  // CODE39 con barras más delgadas para caber en 46mm útiles a escala 110%
  document.querySelectorAll('svg[id^="bc"]').forEach(function(el){
    try{
      var siguiente = el.nextElementSibling;
      var codigo = siguiente ? siguiente.textContent.trim() : '';
      if(codigo){
        JsBarcode(el, codigo, {
          format:       'CODE39',
          width:        1.5,
          height:       45,
          displayValue: false,
          margin:       8,
          lineColor:    '#000000',
          background:   '#FFFFFF'
        });
      }
    }catch(e){}
  });
  setTimeout(function(){ window.print(); window.close(); }, 700);
  </scr`+`ipt></body></html>`);
  w.document.close();
}

function prevRecibo(){
  const tmpCfg={nombre_parqueadero:$('rnombre').value||cfgD.nombre_parqueadero,nit:$('rnit').value,direccion:$('rdir').value,telefono:$('rtel').value,logo_url:$('rlogo').value,recibo_pie:$('rpie').value,recibo_encabezado:$('renc').value,recibo_mostrar_nit:$('rmn').checked?'1':'0',recibo_mostrar_dir:$('rmd').checked?'1':'0',recibo_mostrar_tel:$('rmt').checked?'1':'0',recibo_mostrar_barcode:$('rmb').checked?'1':'0',ancho_recibo:$('rancho').value};
  showR({placa:'ABC123',tipo:'carro',modalidad:'dia',hora_entrada:new Date().toISOString(),hora_salida:new Date().toISOString(),minutos:75,calculo:{horas:1,fraccion:true,tarifa_hora:3000,tarifa_fraccion:1500,subtotal:4500,minutos_extra:15},descuento:0,total:4500,metodo_pago:'efectivo',codigo_barras:'ABC123',config:tmpCfg},'salida');
}
