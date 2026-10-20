/* ============================================================
   KineFlow - Lógica principal (v5.1)
   ============================================================ */

// CONFIGURACIÓN: Pegá acá la URL de tu Google Apps Script (termina en /exec)
let SHEET_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbwt40aoZ1tDfFtT3VFBr864pti20QzQYG4YXWzwK2Uwdndc-IKDL2Z1wquVt9pAUwzO/exec"; 

let PROF = null;
let ultimoHistorial = [];
let sesionesCache = [];
let fichasMap = {};
let vistaActual = 'pacientes', modoConsulta = false, editando = false, claveActual = null, filtroPac = 'activos', tabActual = 'hoy', recienGuardada = null;
let sheetSoportaSesiones = false;
const VISTAS = ['pacientes', 'nuevo', 'consulta', 'paciente', 'mas'];

// ===== Utilidades Base =====
function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])); }
function numONull(v) { if (v === '' || v === null || v === undefined) return null; const n = +v; return isNaN(n) ? null : n; }
function segundos(f) { const t = new Date(f).getTime(); return isNaN(t) ? 0 : Math.floor(t / 1000); }
function claveP(id, pat) { return norm(String(id || '').trim()) + '|' + pat; }

function toast(m, isError) {
  const t = document.getElementById('toast'); if (!t) return;
  t.textContent = m;
  t.className = 'toast show' + (isError ? ' error' : '');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { t.className = 'toast'; }, 2800);
}

function confeti(n) {
  const em = ['🎉', '✨', '💪', '🌟', '🎊', '🏆'], box = document.createElement('div');
  box.className = 'confeti'; box.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < (n || 26); i++) {
    const s = document.createElement('span'); s.textContent = em[i % em.length];
    s.style.left = (Math.random() * 100) + 'vw';
    s.style.animationDelay = (Math.random() * .5) + 's';
    box.appendChild(s);
  }
  document.body.appendChild(box); setTimeout(() => box.remove(), 2600);
}

// ===== Variables de localStorage =====
function kPac() { return 'kine_pacientes_' + (PROF ? PROF.hash.slice(0, 16) : 'sin'); }
function kSes() { return 'kine_sesiones_' + (PROF ? PROF.hash.slice(0, 16) : 'sin'); }
function kCola() { return 'kine_cola_' + (PROF ? PROF.hash.slice(0, 16) : 'sin'); }

function leerPacientesLS() { try { return JSON.parse(localStorage.getItem(kPac()) || '[]'); } catch (e) { return []; } }
function escribirPacientesLS(arr) {
  try { localStorage.setItem(kPac(), JSON.stringify(arr)); }
  catch (e) { toast('⚠ No se pudo guardar: almacenamiento lleno.', true); }
}
function leerSesLS() { try { return JSON.parse(localStorage.getItem(kSes()) || '[]'); } catch (e) { return []; } }
function escribirSesLS(arr) {
  try { localStorage.setItem(kSes(), JSON.stringify(arr)); }
  catch (e) { toast('⚠ No se pudo guardar la sesión: almacenamiento lleno.', true); }
}

function colaLeer() { try { return JSON.parse(localStorage.getItem(kCola()) || '[]'); } catch (e) { return []; } }
function colaEscribir(a) { try { localStorage.setItem(kCola(), JSON.stringify(a)); } catch (e) { } pintarPendientes(); }

function normSesion(s) {
  return {
    tipo: 'sesion', clave: claveP(s.idPaciente, s.patologia), idPaciente: s.idPaciente, patologia: s.patologia,
    sesion: +s.sesion, fecha: s.fecha, evaAntes: numONull(s.evaAntes), evaDespues: numONull(s.evaDespues),
    evaReposo: numONull(s.evaReposo), evaMovimiento: numONull(s.evaMovimiento), medidaObj: s.medidaObj || '',
    asistio: s.asistio !== false, notas: s.notas || '', hechos: Array.isArray(s.hechos) ? s.hechos : String(s.hechos || '').split(';').filter(Boolean),
    profesional: s.profesional, kinesiologo: s.kinesiologo
  };
}
function mezclarFichas(a, b) {
  const vistos = {}, out = [];
  a.concat(b).forEach(p => {
    const k = claveP(p.idPaciente, p.patologia) + '@' + segundos(p.fecha);
    if (!vistos[k]) { vistos[k] = 1; out.push(p); }
  });
  return out;
}
function mezclarSesiones(a, b) {
  const mapa = {};
  a.concat(b).map(normSesion).forEach(s => {
    const k = s.clave + '#' + s.sesion;
    if (!mapa[k] || segundos(s.fecha) >= segundos(mapa[k].fecha)) mapa[k] = s;
  });
  return Object.keys(mapa).map(k => mapa[k]);
}
function sesionesDe(id, pat) {
  const c = claveP(id, pat);
  return sesionesCache.filter(s => s.clave === c).sort((x, y) => x.sesion - y.sesion);
}

// ===== Conexión Google Sheets =====
function qProf() { return PROF ? ('prof=' + encodeURIComponent(PROF.hash) + '&nombre=' + encodeURIComponent(PROF.nombre)) : ''; }
function conPerfil(o) { if (PROF) { o.profesional = PROF.hash; o.kinesiologo = PROF.nombre; } return o; }

async function postSheet(o) {
  if (!SHEET_WEBAPP_URL || SHEET_WEBAPP_URL.indexOf('PEGA_ACA') >= 0) return { ok: false, error: 'Falta configurar la URL.' };
  try {
    const r = await fetch(SHEET_WEBAPP_URL, { method: 'POST', body: JSON.stringify(o) });
    return await r.json();
  } catch (e) { return { ok: false, error: 'network' }; }
}

async function enviarSheet(reg) {
  if (!SHEET_WEBAPP_URL || SHEET_WEBAPP_URL.indexOf('PEGA_ACA') >= 0 || !PROF || PROF.demo) return true;
  let d = await postSheet(reg);
  if (d && d.ok) return true;
  if (d && d.error === 'cuenta inexistente') {
    await postSheet({ tipo: 'cuenta', profesional: PROF.hash, kinesiologo: PROF.nombre });
    d = await postSheet(reg); return !!(d && d.ok);
  }
  return false;
}

async function enviarOEncolar(reg) {
  const ok = await enviarSheet(reg);
  if (!ok) { const c = colaLeer(); c.push(reg); colaEscribir(c.slice(-3000)); }
  return ok;
}

let vaciando = false;
async function vaciarCola() {
  if (vaciando || !PROF || PROF.demo || !SHEET_WEBAPP_URL || SHEET_WEBAPP_URL.indexOf('PEGA_ACA') >= 0) return;
  const inicial = colaLeer(); if (!inicial.length) return;
  vaciando = true;
  try {
    const enviadosSet = new Set(); let cortar = false;
    for (let i = 0; i < inicial.length; i++) {
      if (cortar) break;
      const ok = await enviarSheet(inicial[i]);
      if (ok) enviadosSet.add(JSON.stringify(inicial[i]));
      else cortar = !navigator.onLine;
    }
    const actual = colaLeer();
    const restantes = actual.filter(r => !enviadosSet.has(JSON.stringify(r)));
    colaEscribir(restantes);
    if (!restantes.length) {
      const st = document.getElementById('dbStatus');
      if (st) st.textContent = 'Conectado a Google Sheets ✓ — fichas y sesiones se guardan en tu planilla.';
    }
    const enviadosCount = actual.length - restantes.length;
    if (enviadosCount > 0) toast('☁️ Se enviaron ' + enviadosCount + ' registros pendientes');
  } finally { vaciando = false; }
}
window.addEventListener('online', () => vaciarCola());

async function initLocal() {
  const status = document.getElementById('dbStatus');
  const fLoc = leerPacientesLS(), sLoc = leerSesLS();
  ultimoHistorial = fLoc.slice();
  sesionesCache = sLoc.map(normSesion);
  if (SHEET_WEBAPP_URL && SHEET_WEBAPP_URL.indexOf('PEGA_ACA') < 0) {
    if (status) status.textContent = 'Conectando con Google Sheets…';
    try {
      const resp = await fetch(SHEET_WEBAPP_URL + '?' + qProf());
      const datos = await resp.json();
      let fRem = [], sRem = null;
      if (datos.version >= 2) { fRem = (datos.pacientes || []); sRem = (datos.sesiones || []); sheetSoportaSesiones = true; }
      if (datos.version >= 2 && datos.existe) {
        ultimoHistorial = mezclarFichas(leerPacientesLS(), fRem);
        if (sRem) sesionesCache = mezclarSesiones(leerSesLS(), sRem);
      }
      if (datos.version >= 2 && !datos.existe && !datos.limite) {
        try { await postSheet({ tipo: 'cuenta', profesional: PROF.hash, kinesiologo: PROF.nombre }); } catch (x) { }
      }
      if (status) status.textContent = 'Conectado a Google Sheets ✓';
    } catch (e) {
      if (status) status.textContent = 'No se pudo conectar. Usando guardado local.';
    }
  } else {
    if (status) status.textContent = 'Guardado local (no configurado Sheets).';
  }
  pintarHistorial();
}

function pintarPendientes() {
  const n = PROF ? colaLeer().length : 0, pill = document.getElementById('syncPill'), txt = document.getElementById('syncTxt');
  if (!pill || !txt) return;
  if (n > 0) { pill.className = 'sync'; txt.textContent = '☁️ ' + n + ' sin enviar'; }
  else { pill.className = 'sync ok'; txt.textContent = 'Sincronizado'; }
}

// ===== Login =====
function loginHTML(msg, extra) {
  return '<div class="lg-card"><div class="lg-logo">🩺</div><h1>KineFlow</h1><p class="lg-sub">Historia clínica kinésica</p>' +
    '<label for="lgNombre">Tu nombre</label><input type="text" id="lgNombre" placeholder="Ej: Adrián Lazarte" autocomplete="off">' +
    '<label for="lgCodigo">Tu código personal (mín. 6 caracteres)</label><input type="password" id="lgCodigo" autocomplete="off" placeholder="Elegí uno y recordalo">' +
    '<div class="lg-msg" id="lgMsg" role="status">' + (msg || '') + '</div>' +
    '<button type="button" class="btn-main" id="lgEntrar">Entrar 👉</button>' +
    (extra || '') + '<div class="lg-or">o</div><button type="button" class="btn-sec" id="lgDemo">🎬 Ver demostración</button>' +
    '<p class="lg-nota">Con el mismo nombre y código entrás desde cualquier dispositivo.</p></div>';
}

function mostrarLogin(msg, extra) {
  const el = document.getElementById('login'); if (!el) return;
  el.innerHTML = loginHTML(msg, extra); el.hidden = false;
  document.body.classList.add('sin-login');
}

async function hashPerfil(nombre, codigo) {
  if (!(window.crypto && crypto.subtle)) throw new Error('nocrypto');
  const enc = new TextEncoder();
  const km = await crypto.subtle.importKey('raw', enc.encode(String(codigo).trim()), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode('kineflow-v5|' + norm(String(nombre).trim())), iterations: 150000 }, km, 128);
  return [...new Uint8Array(bits)].map(x => x.toString(16).padStart(2, '0')).join('');
}

function perfilesGuardar(p) {
  try { localStorage.setItem('kine_perfil_activo', JSON.stringify({ nombre: p.nombre, hash: p.hash })); } catch (e) { }
}

async function intentarEntrar(crear) {
  const nombre = document.getElementById('lgNombre').value.trim().replace(/\s+/g, ' ');
  const codigo = document.getElementById('lgCodigo').value;
  if (nombre.length < 2) { mostrarLogin('Escribí tu nombre.'); return; }
  if (codigo.trim().length < 6) { mostrarLogin('El código necesita al menos 6 caracteres.'); return; }
  let hash; try { hash = await hashPerfil(nombre, codigo); } catch (e) { mostrarLogin('Navegador no compatible.'); return; }
  const p = { nombre: nombre, hash: hash };
  activarPerfil(p);
}

function activarPerfil(p) {
  PROF = p;
  if (p.demo) { SHEET_WEBAPP_URL = ''; sembrarDemo(); }
  else { perfilesGuardar(p); }
  document.getElementById('login').hidden = true; document.body.classList.remove('sin-login');
  const n = document.getElementById('cuentaNombre'); if (n) n.textContent = p.nombre;
  initLocal().then(() => { pintarPendientes(); vaciarCola(); });
}

function iniciarPerfil() {
  let a = null; try { a = JSON.parse(localStorage.getItem('kine_perfil_activo') || 'null'); } catch (e) { }
  if (a && a.hash && a.nombre) { activarPerfil(a); }
  else { mostrarLogin(''); }
}

function cerrarSesion() { try { localStorage.removeItem('kine_perfil_activo'); } catch (e) { } location.reload(); }
function borrarLocal() {
  if (!confirm('Se borran de ESTE dispositivo los pacientes de ' + PROF.nombre + '. ¿Seguro?')) return;
  try { localStorage.removeItem(kPac()); localStorage.removeItem(kSes()); localStorage.removeItem('kine_perfil_activo'); } catch (e) { }
  location.reload();
}

// ===== Navegación y UI =====
function irVista(v, noHist) {
  vistaActual = v;
  VISTAS.forEach(x => document.getElementById('v-' + x).hidden = (x !== v));
  document.querySelectorAll('.bn').forEach(b => b.classList.toggle('on', b.dataset.go === (v === 'paciente' ? 'pacientes' : v)));
  const picker = document.getElementById('pickerCard');
  if (v === 'nuevo') document.getElementById('slotNuevo').appendChild(picker);
  if (v === 'consulta') document.getElementById('slotConsulta').appendChild(picker);
  document.getElementById('pickerTitulo').textContent = v === 'consulta' ? '¿Qué patología querés consultar?' : 'Diagnóstico';
  if (v === 'pacientes') pintarHistorial();
  if (v === 'nuevo' || v === 'consulta') listarSugerencias();
  if (!noHist) { try { history.pushState({ v: v }, '', '#' + v); } catch (e) { } }
  window.scrollTo(0, 0);
}

function limpiarForm() {
  ['idPaciente', 'edad', 'peso', 'altura', 'buscador'].forEach(i => document.getElementById(i).value = '');
  document.getElementById('actividad').value = 'sedentario';
  document.querySelectorAll('#comorb input,#medic input,#rojas input,#amarillas input,#azules input,#negras input').forEach(i => i.checked = false);
  document.getElementById('patologia').value = '';
  document.getElementById('zona').value = ''; document.getElementById('tipo').value = '';
  document.getElementById('seleccionActual').textContent = 'Ninguna patología elegida';
  document.getElementById('msgNuevo').textContent = '';
}

function nuevoPaciente() {
  limpiarForm(); editando = false; modoConsulta = false; claveActual = null; recienGuardada = null;
  document.getElementById('tituloNuevo').textContent = 'Paciente nuevo';
  document.getElementById('guardar').textContent = 'Guardar y abrir paciente';
  document.getElementById('wizardPaso1').hidden = false; document.getElementById('wizardPaso2').hidden = true;
  irVista('nuevo');
}

function iniciaConsulta() { limpiarForm(); modoConsulta = true; claveActual = null; irVista('consulta'); }

function onPatologiaElegida() {
  const k = document.getElementById('patologia').value;
  const st = document.getElementById('seleccionActual');
  st.textContent = (k && DB[k]) ? 'Seleccionada: ' + DB[k].nombre : 'Ninguna patología elegida';
  if (vistaActual === 'consulta' && k && DB[k]) { modoConsulta = true; renderPaciente('eval'); irVista('paciente'); }
}

function abrirPaciente(clave, tab) {
  const p = fichasMap[clave]; if (!p) return;
  aplicarFicha(p); modoConsulta = false; claveActual = clave; recienGuardada = null;
  renderPaciente(tab || 'hoy'); irVista('paciente');
}

function ctxPaciente() {
  const g = i => document.getElementById(i);
  const marcado = idc => [...document.querySelectorAll('#' + idc + ' input:checked')].map(i => i.value);
  const edad = +g('edad').value || 0, peso = +g('peso').value || 0, altura = (+g('altura').value || 0) / 100;
  const c = { edad, peso, altura, actividad: g('actividad').value, patKey: g('patologia').value,
    id: modoConsulta ? '' : g('idPaciente').value.trim(),
    comorb: marcado('comorb'), medic: marcado('medic'), rojas: marcado('rojas'), amarillas: marcado('amarillas'), azules: marcado('azules'), negras: marcado('negras'),
    esNeuro: g('antecedenteNeuro').checked };
  c.imc = altura > 0 ? peso / (altura * altura) : null;
  c.esMayor = edad >= 65;
  c.pac = { comorb: c.comorb, medic: c.medic, rojas: c.rojas };
  c.d = DB[c.patKey];
  return c;
}

// ===== Renderizado de Vistas =====
function headerHTML(c) {
  const consulta = modoConsulta || !c.id;
  const ss = consulta ? [] : sesionesDe(c.id, c.patKey);
  const ult = ss.length ? Math.max.apply(null, ss.map(s => s.sesion)) : 0;
  const ficha = fichasMap[claveP(c.id, c.patKey)] || {};
  const alta = ficha.estado === 'alta';
  
  let sub = c.d.nombre; const extra = [];
  if (c.edad) extra.push(c.edad + ' años');
  if (c.imc !== null) extra.push('IMC ' + c.imc.toFixed(1));
  if (extra.length) sub += ' · ' + extra.join(' · ');
  
  let h = '<div class="ph-top"><div class="ph-id">' + (consulta ? '<span class="av" style="background:#e6f0fa;color:#1d4f7a">🔎</span>' : '<span class="av" style="background:var(--primary);color:#fff">' + esc(c.id.substring(0,2).toUpperCase()) + '</span>') + 
    '<div><div class="ph-nom">' + (consulta ? 'Consulta rápida' : esc(c.id)) + '</div><div class="ph-dx">' + esc(sub) + '</div></div></div><div>';
  if (!consulta) h += alta ? '<span class="badge ok">🎓 De alta</span>' : '<span class="badge">' + ult + '/10 sesiones</span>';
  h += '</div></div>';
  if (!consulta) h += '<div class="prog" style="margin-top:10px;"><i style="width:' + (ult * 10) + '%"></i></div>';
  if (c.rojas.length) h += '<div style="margin-top:8px;"><span class="badge warn">⚠ Bandera roja: priorizar derivación</span></div>';
  
  h += '<div class="ph-btns">';
  h += consulta ? '<button type="button" data-act="volverConsulta">← Otra patología</button>' : '<button type="button" data-act="volver">← Pacientes</button>';
  if (!consulta) {
    h += '<button type="button" data-act="alta">' + (alta ? 'Reactivar' : 'Dar de alta') + '</button>';
  }
  h += '</div>';
  return h;
}

function evalHTML(c) {
  const d = c.d; let html = '';
  if (c.rojas.length) html += '<div class="res-block alerta"><h3>⚠ Bandera roja detectada</h3><p>Se marcaron indicadores de alarma. Priorizar derivación médica.</p></div>';
  if (d.aviso) html += '<div class="res-block alerta"><h3>Precauciones de seguridad</h3><p>' + d.aviso + '</p></div>';
  if (c.imc !== null) {
    const cat = c.imc < 18.5 ? 'bajo peso' : c.imc < 25 ? 'normal' : c.imc < 30 ? 'sobrepeso' : 'obesidad';
    html += '<div class="res-block"><h3>Datos antropométricos</h3><p>IMC estimado: <span class="imc-pill">' + c.imc.toFixed(1) + ' kg/m² — ' + cat + '</span></p></div>';
  }
  const esc_ = d.escala && ESCALAS[d.escala];
  html += '<div class="res-block"><h3>' + d.nombre + ' — test clínico</h3>' + (TIPOS[d.tipo] ? '<p class="sub" style="margin:0 0 6px;">' + TIPOS[d.tipo] + '</p>' : '') +
    '<p><b>' + d.testN + '.</b> ' + d.testD + '</p>' +
    (d.testExtra ? '<p style="margin-top:8px;"><b>' + d.testExtra.n + '.</b> ' + d.testExtra.d + '</p>' : '') +
    (esc_ ? '<p style="margin-top:8px;color:var(--muted);"><b>' + esc_.n + ':</b> ' + esc_.d + '</p>' : '') + '</div>';
  html += '<div class="res-block"><h3>Agentes físicos</h3>' +
    ((d.agentes && d.agentes.length) ? d.agentes.map(k => {
      const a = AGENTES[k]; if (!a) return '';
      const m = a.redC.some(cx => c.comorb.includes(cx)) || a.redM.some(mx => c.medic.includes(mx)) || (a.redF && a.redF.some(fx => c.rojas.includes(fx))) ? 'contra' : '';
      return '<div class="agente ' + m + '"><b>' + a.n + '</b><br><span class="dosis">' + (m ? '⚠ NO USAR. ' : '') + a.d + '</span></div>';
    }).join('') : '<p style="color:var(--muted);">Sin agentes físicos priorizados. Eje en ejercicio.</p>') + '</div>';
  return html;
}

function evaGridHTML(target, sel) {
  let h = '<div class="eva-grid" data-target="' + target + '">';
  for (let i = 0; i <= 10; i++) h += '<button type="button" class="eva-btn e' + i + (sel === i ? ' on' : '') + '" data-v="' + i + '">' + i + '</button>';
  return h + '</div>';
}

function hoyHTML(c) {
  const d = c.d, ss = sesionesDe(c.id, c.patKey);
  const ult = ss.length ? Math.max.apply(null, ss.map(s => s.sesion)) : 0;
  const completo = ult >= 10, n = Math.min(ult + 1, 10), meta = SES_META[n - 1];
  
  let h = '';
  if (recienGuardada && recienGuardada.clave === claveP(c.id, c.patKey)) {
    h += '<div class="card" style="border-color:#a9d6b9;background:#f0f8f3;"><b>🎉 Sesión ' + recienGuardada.n + ' guardada.</b></div>';
  }
  
  h += '<div class="card hoy-card"><h2 style="border:none;padding:0;font-size:.95rem;">Sesión ' + n + ' de 10 · ' + meta.fase + '</h2>' +
     '<p style="margin:4px 0 8px;"><b>Objetivo:</b> ' + meta.meta + '</p>';
     
  h += '<div class="bl"><span class="tm">0-15m</span><span class="tx"><b>Evaluación y preparación.</b> ' + meta.eval + '</span></div>';
  
  const ejs = meta.plan;
  ejs.forEach((ej, i) => {
    h += '<div class="bl"><span class="tm">15-40m</span><input type="checkbox" class="chk-hecho" value="ejercicio ' + (i+1) + '" checked><span class="tx"><b>Ejercicio ' + (i+1) + ':</b> Movilidad y control según plan.<br><span class="sub">' + meta.dosis + '</span></span></div>';
  });
  
  h += '<div class="bl"><span class="tm">40-50m</span><span class="tx"><b>Cierre.</b> Enfriamiento, educación y tarea para casa.</span></div>';
  h += '<p class="sub" style="margin-top:8px;">' + CRITERIO + '</p></div>';
  
  h += '<div class="card"><h2 style="border:none;padding:0;font-size:.95rem;">Registrar la sesión</h2>';
  h += '<label>Dolor al llegar (NRS)</label><input type="number" id="evaAntes" hidden>' + evaGridHTML('evaAntes', null);
  h += '<label>Dolor al terminar (NRS)</label><input type="number" id="evaDespues" hidden>' + evaGridHTML('evaDespues', null);
  h += '<label for="notaSesion">Notas</label><textarea id="notaSesion" rows="2"></textarea>';
  
  h += '<div class="barra-accion"><button type="button" class="btn-main btn-guardar-ses">Guardar sesión</button></div><div id="msgSesion" class="sub"></div></div>';
  return h;
}

function evolTabHTML(c) {
  const ss = sesionesDe(c.id, c.patKey);
  if (!ss.length) return '<div class="card"><p class="sub">Todavía no hay sesiones registradas.</p></div>';
  let h = '<div class="card"><h2 style="border:none;padding:0;font-size:.95rem;">Historial de sesiones</h2><table class="evt"><tr><th>N°</th><th>Fecha</th><th>Dolor</th><th>Notas</th></tr>';
  ss.forEach(s => {
    h += '<tr><td>' + s.sesion + '</td><td>' + new Date(s.fecha).toLocaleDateString() + '</td><td>' + (s.evaAntes!=null?s.evaAntes:'-') + ' → ' + (s.evaDespues!=null?s.evaDespues:'-') + '</td><td>' + esc(s.notas||'') + '</td></tr>';
  });
  return h + '</table></div>';
}

function planListaHTML(c) {
  const d = c.d, ss = c.id ? sesionesDe(c.id, c.patKey) : [], porN = {};
  ss.forEach(s => porN[s.sesion] = s);
  const ult = ss.length ? Math.max.apply(null, ss.map(s => s.sesion)) : 0, hoy = Math.min(ult + 1, 10);
  
  let h = '<p class="sub">Plan de 10 sesiones.</p>';
  for (let n = 1; n <= 10; n++) {
    const s = porN[n], meta = SES_META[n - 1];
    const estado = s ? 'hecha' : (n === hoy && c.id && ult < 10) ? 'hoy' : 'futura', tag = estado === 'hecha' ? 'Hecha ✓' : estado === 'hoy' ? 'Hoy' : 'Próxima';
    h += '<details class="ses ' + estado + '"><summary><span class="ses-n">Sesión ' + n + '</span><span class="ses-fase">' + meta.fase + '</span><span class="ses-tag ' + estado + '">' + tag + '</span></summary><div class="ses-body">';
    h += '<p><b>Objetivo:</b> ' + meta.meta + '</p>';
    h += '<p class="sub">' + meta.dosis + '</p>';
    h += '</div></details>';
  }
  return h;
}

function irTab(t) {
  tabActual = t;
  ['hoy', 'evol', 'eval', 'plan', 'ref'].forEach(x => document.getElementById('tab' + x.charAt(0).toUpperCase() + x.slice(1)).hidden = (x !== t));
  document.querySelectorAll('#tabsPac .tab').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
  window.scrollTo(0, 0);
}

function renderPaciente(tab) {
  const c = ctxPaciente(), d = c.d;
  if (!d) { toast('Elegí una patología'); return; }
  const consulta = modoConsulta || !c.id;
  
  document.getElementById('pacHeader').innerHTML = headerHTML(c);
  document.getElementById('tabEval').innerHTML = evalHTML(c);
  document.getElementById('tabRef').innerHTML = '<div class="card"><p>Consultar evidencia en PubMed para <b>' + d.nombre + '</b>.</p><button class="btn-main" onclick="window.open(\'https://pubmed.ncbi.nlm.nih.gov/?term=' + encodeURIComponent(d.nombre) + '\')">Buscar en PubMed</button></div>';
  document.getElementById('tabPlan').innerHTML = planListaHTML(c);
  document.querySelector('#tabsPac [data-tab="hoy"]').hidden = consulta;
  document.querySelector('#tabsPac [data-tab="evol"]').hidden = consulta;
  
  if (!consulta) {
    document.getElementById('tabHoy').innerHTML = hoyHTML(c);
    document.getElementById('tabEvol').innerHTML = evolTabHTML(c);
  }
  let t = tab || tabActual; if (consulta && (t === 'hoy' || t === 'evol')) t = 'eval';
  irTab(t);
}

// ===== Listado de Pacientes =====
function reconstruirMapa() {
  fichasMap = {};
  ultimoHistorial.slice().sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).forEach(p => {
    const c = claveP(p.idPaciente, p.patologia);
    if (!fichasMap[c]) fichasMap[c] = p;
  });
  sesionesCache.forEach(s => { if (!fichasMap[s.clave]) fichasMap[s.clave] = { idPaciente: s.idPaciente, patologia: s.patologia, fecha: s.fecha }; });
}

function pintarHistorial() {
  reconstruirMapa();
  const busca = norm(document.getElementById('buscaPac').value.trim());
  let casos = Object.keys(fichasMap).map(c => {
    const p = fichasMap[c], ss = sesionesCache.filter(s => s.clave === c);
    const ult = ss.length ? Math.max.apply(null, ss.map(s => s.sesion)) : 0;
    return { clave: c, p, ss, ult, alta: p.estado === 'alta' };
  }).filter(x => {
    if (filtroPac === 'activos' && x.alta) return false;
    if (filtroPac === 'alta' && !x.alta) return false;
    if (busca) { const hay = norm(x.p.idPaciente + ' ' + x.p.patologia); return busca.split(/\s+/).every(w => hay.includes(w)); }
    return true;
  });
  
  const cont = document.getElementById('listaPac');
  if (!casos.length) { cont.innerHTML = '<div class="vacio"><div class="big">🧑‍⚕️</div><b>No hay pacientes.</b></div>'; return; }
  
  cont.innerHTML = casos.map(x => {
    const d = DB[x.p.patologia], nom = d ? d.nombre : x.p.patologia;
    return '<div class="pcard"><div class="pc-top"><div class="pc-id"><span class="av">' + esc(x.p.idPaciente.substring(0,2).toUpperCase()) + '</span><div><div class="pc-nom">' + esc(x.p.idPaciente) + '</div><div class="pc-dx">' + esc(nom) + '</div></div></div><div class="pc-side">' + (x.alta ? '<span class="badge ok">Alta</span>' : '') + '</div></div>' +
      '<div class="pc-meta"><span>' + x.ult + '/10</span><div class="prog"><i style="width:' + (x.ult*10) + '%"></i></div></div>' +
      '<div class="pc-btns"><button class="go" data-act="sesion" data-clave="' + esc(x.clave) + '">' + (x.ult>=10?'Ver paciente':'Sesión '+(x.ult+1)) + '</button><button class="ev" data-act="evol" data-clave="' + esc(x.clave) + '">Evolución</button></div></div>';
  }).join('');
}

// ===== Guardado =====
function aplicarFicha(p) {
  document.getElementById('idPaciente').value = p.idPaciente || '';
  ['edad', 'peso', 'altura'].forEach(k => document.getElementById(k).value = p[k] || '');
  document.getElementById('patologia').value = p.patologia || '';
  document.getElementById('seleccionActual').textContent = DB[p.patologia] ? 'Seleccionada: ' + DB[p.patologia].nombre : '';
}

async function guardarSesion() {
  const c = ctxPaciente(), id = c.id, pat = c.patKey;
  const antes = numONull(document.getElementById('evaAntes').value), despues = numONull(document.getElementById('evaDespues').value);
  if (antes === null || despues === null) { toast('Faltan los valores de dolor', true); return; }
  const nota = document.getElementById('notaSesion').value.trim();
  
  const reg = conPerfil(normSesion({ idPaciente: id, patologia: pat, sesion: Math.min(sesionesDe(id, pat).length + 1, 10), fecha: new Date().toISOString(), evaAntes: antes, evaDespues: despues, notas: nota, hechos: ['agente', 'ejercicio 1'] }));
  
  const arr = leerSesLS().filter(s => !(s.clave === reg.clave && s.sesion === reg.sesion)); arr.push(reg); escribirSesLS(arr);
  sesionesCache = mezclarSesiones(sesionesCache, [reg]);
  
  toast('Sesión guardada ✓');
  if (SHEET_WEBAPP_URL && SHEET_WEBAPP_URL.indexOf('PEGA_ACA') < 0) enviarOEncolar(reg);
  
  renderPaciente('hoy'); pintarHistorial();
}

document.getElementById('guardar').addEventListener('click', () => {
  const id = document.getElementById('idPaciente').value.trim(), pat = document.getElementById('patologia').value;
  if (!id || !pat) { toast('Completá nombre y diagnóstico', true); return; }
  const reg = conPerfil({ idPaciente: id, patologia: pat, edad: document.getElementById('edad').value, peso: document.getElementById('peso').value, altura: document.getElementById('altura').value, estado: 'activo', fecha: new Date().toISOString() });
  const arr = leerPacientesLS(); arr.push(reg); escribirPacientesLS(arr);
  ultimoHistorial.push(reg);
  toast('Paciente guardado ✓');
  if (SHEET_WEBAPP_URL && SHEET_WEBAPP_URL.indexOf('PEGA_ACA') < 0) enviarOEncolar(reg);
  abrirPaciente(claveP(id, pat), 'hoy');
});

// ===== Event Listeners Globales =====
document.addEventListener('click', e => {
  const t = e.target;
  if (t.closest('.bn')) {
    const g = t.closest('.bn').dataset.go;
    if (g === 'nuevo') nuevoPaciente(); else if (g === 'consulta') iniciaConsulta(); else irVista(g);
    return;
  }
  if (t.closest('#filtroPac .chip')) {
    filtroPac = t.closest('.chip').dataset.f;
    document.querySelectorAll('#filtroPac .chip').forEach(b => b.classList.toggle('on', b === t.closest('.chip')));
    pintarHistorial(); return;
  }
  if (t.closest('.pcard button')) {
    abrirPaciente(t.closest('button').dataset.clave, t.closest('button').dataset.act === 'evol' ? 'evol' : 'hoy'); return;
  }
  if (t.closest('.ph-btns button')) {
    const a = t.closest('button').dataset.act;
    if (a === 'volver') irVista('pacientes');
    else if (a === 'volverConsulta') iniciaConsulta();
    return;
  }
  if (t.closest('#tabsPac .tab')) { irTab(t.closest('.tab').dataset.tab); return; }
  if (t.closest('.eva-btn')) {
    const grid = t.closest('.eva-grid'), inp = document.getElementById(grid.dataset.target);
    inp.value = t.closest('.eva-btn').dataset.v;
    grid.querySelectorAll('.eva-btn').forEach(b => b.classList.toggle('on', b === t.closest('.eva-btn')));
    return;
  }
  if (t.closest('.btn-guardar-ses')) { guardarSesion(); return; }
  if (t.closest('#lgEntrar')) { intentarEntrar(); return; }
  if (t.closest('#lgDemo')) { activarPerfil({ nombre: 'Demo', hash: 'd0000000000000000000000000000000', demo: true }); return; }
  if (t.closest('#btnSalir')) { cerrarSesion(); return; }
  if (t.closest('#btnBorrar')) { borrarLocal(); return; }
  if (t.closest('#wizardSiguiente')) { document.getElementById('wizardPaso1').hidden = true; document.getElementById('wizardPaso2').hidden = false; return; }
  if (t.closest('#wizardAtras')) { document.getElementById('wizardPaso1').hidden = false; document.getElementById('wizardPaso2').hidden = true; return; }
});

document.getElementById('buscaPac').addEventListener('input', () => setTimeout(pintarHistorial, 150));
document.getElementById('patologia').addEventListener('change', onPatologiaElegida);

// ===== Arranque =====
iniciarPerfil();
