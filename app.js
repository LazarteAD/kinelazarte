let SHEET_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbwt40aoZ1tDfFtT3VFBr864pti20QzQYG4YXWzwK2Uwdndc-IKDL2Z1wquVt9pAUwzO/exec"; 

let PROF = null;
let ultimoHistorial = [];
let sesionesCache = [];
let fichasMap = {};
let vistaActual = 'pacientes', modoConsulta = false, editando = false, claveActual = null, filtroPac = 'activos', tabActual = 'hoy', recienGuardada = null;
const VISTAS = ['pacientes', 'nuevo', 'consulta', 'paciente', 'mas'];

function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])); }
function numONull(v) { if (v === '' || v === null || v === undefined) return null; const n = +v; return isNaN(n) ? null : n; }
function segundos(f) { const t = new Date(f).getTime(); return isNaN(t) ? 0 : Math.floor(t / 1000); }
function claveP(id, pat) { return norm(String(id || '').trim()) + '|' + pat; }

function toast(m, isError) {
  const t = document.getElementById('toast'); if (!t) return;
  t.textContent = m; t.className = 'toast show' + (isError ? ' error' : '');
  clearTimeout(toast._t); toast._t = setTimeout(() => { t.className = 'toast'; }, 2800);
}

function confeti(n) {
  const em = ['🎉', '✨', '💪', '🌟', '🎊', '🏆'], box = document.createElement('div');
  box.className = 'confeti'; box.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < (n || 26); i++) {
    const s = document.createElement('span'); s.textContent = em[i % em.length];
    s.style.left = (Math.random() * 100) + 'vw'; s.style.animationDelay = (Math.random() * .5) + 's';
    box.appendChild(s);
  }
  document.body.appendChild(box); setTimeout(() => box.remove(), 2600);
}

function kPac() { return 'kine_pacientes_' + (PROF ? PROF.hash.slice(0, 16) : 'sin'); }
function kSes() { return 'kine_sesiones_' + (PROF ? PROF.hash.slice(0, 16) : 'sin'); }
function kCola() { return 'kine_cola_' + (PROF ? PROF.hash.slice(0, 16) : 'sin'); }

function leerPacientesLS() { try { return JSON.parse(localStorage.getItem(kPac()) || '[]'); } catch (e) { return []; } }
function escribirPacientesLS(arr) { try { localStorage.setItem(kPac(), JSON.stringify(arr)); } catch (e) { toast('⚠ Error al guardar.', true); } }
function leerSesLS() { try { return JSON.parse(localStorage.getItem(kSes()) || '[]'); } catch (e) { return []; } }
function escribirSesLS(arr) { try { localStorage.setItem(kSes(), JSON.stringify(arr)); } catch (e) { toast('⚠ Error al guardar sesión.', true); } }

function colaLeer() { try { return JSON.parse(localStorage.getItem(kCola()) || '[]'); } catch (e) { return []; } }
function colaEscribir(a) { try { localStorage.setItem(kCola(), JSON.stringify(a)); } catch (e) { } pintarPendientes(); }

function normSesion(s) {
  return { tipo: 'sesion', clave: claveP(s.idPaciente, s.patologia), idPaciente: s.idPaciente, patologia: s.patologia, sesion: +s.sesion, fecha: s.fecha, evaReposo: numONull(s.evaReposo), evaMovimiento: numONull(s.evaMovimiento), medidaObj: s.medidaObj || '', notas: s.notas || '', hechos: s.hechos || [], profesional: s.profesional, kinesiologo: s.kinesiologo };
}
function mezclarFichas(a, b) {
  const vistos = {}, out = [];
  a.concat(b).forEach(p => { const k = claveP(p.idPaciente, p.patologia) + '@' + segundos(p.fecha); if (!vistos[k]) { vistos[k] = 1; out.push(p); } });
  return out;
}
function mezclarSesiones(a, b) {
  const mapa = {};
  a.concat(b).map(normSesion).forEach(s => { const k = s.clave + '#' + s.sesion; if (!mapa[k] || segundos(s.fecha) >= segundos(mapa[k].fecha)) mapa[k] = s; });
  return Object.keys(mapa).map(k => mapa[k]);
}
function sesionesDe(id, pat) { const c = claveP(id, pat); return sesionesCache.filter(s => s.clave === c).sort((x, y) => x.sesion - y.sesion); }

function qProf() { return PROF ? ('prof=' + encodeURIComponent(PROF.hash) + '&nombre=' + encodeURIComponent(PROF.nombre)) : ''; }
function conPerfil(o) { if (PROF) { o.profesional = PROF.hash; o.kinesiologo = PROF.nombre; } return o; }

async function postSheet(o) {
  if (!SHEET_WEBAPP_URL || SHEET_WEBAPP_URL.indexOf('PEGA_ACA') >= 0) return { ok: false, error: 'Falta URL.' };
  try { const r = await fetch(SHEET_WEBAPP_URL, { method: 'POST', body: JSON.stringify(o) }); return await r.json(); } catch (e) { return { ok: false, error: 'network' }; }
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
async function enviarOEncolar(reg) { const ok = await enviarSheet(reg); if (!ok) { const c = colaLeer(); c.push(reg); colaEscribir(c.slice(-3000)); } return ok; }

let vaciando = false;
async function vaciarCola() {
  if (vaciando || !PROF || PROF.demo || !SHEET_WEBAPP_URL) return;
  const inicial = colaLeer(); if (!inicial.length) return;
  vaciando = true;
  try {
    const enviadosSet = new Set(); let cortar = false;
    for (let i = 0; i < inicial.length; i++) {
      if (cortar) break;
      const ok = await enviarSheet(inicial[i]);
      if (ok) enviadosSet.add(JSON.stringify(inicial[i])); else cortar = !navigator.onLine;
    }
    const actual = colaLeer();
    const restantes = actual.filter(r => !enviadosSet.has(JSON.stringify(r)));
    colaEscribir(restantes);
  } finally { vaciando = false; }
}
window.addEventListener('online', () => vaciarCola());

async function initLocal() {
  const status = document.getElementById('dbStatus');
  const fLoc = leerPacientesLS(), sLoc = leerSesLS();
  ultimoHistorial = fLoc.slice(); sesionesCache = sLoc.map(normSesion);
  if (SHEET_WEBAPP_URL && SHEET_WEBAPP_URL.indexOf('PEGA_ACA') < 0) {
    if (status) status.textContent = 'Conectando…';
    try {
      const resp = await fetch(SHEET_WEBAPP_URL + '?' + qProf());
      const datos = await resp.json();
      let fRem = [], sRem = null;
      if (datos.version >= 2) { fRem = (datos.pacientes || []); sRem = (datos.sesiones || []); }
      if (datos.version >= 2 && datos.existe) {
        ultimoHistorial = mezclarFichas(leerPacientesLS(), fRem);
        if (sRem) sesionesCache = mezclarSesiones(leerSesLS(), sRem);
      }
      if (status) status.textContent = 'Sincronizado ✓';
    } catch (e) { if (status) status.textContent = 'Modo local (sin conexión)'; }
  } else { if (status) status.textContent = 'Modo local'; }
  pintarHistorial();
}

function pintarPendientes() {
  const n = PROF ? colaLeer().length : 0, pill = document.getElementById('syncPill'), txt = document.getElementById('syncTxt');
  if (!pill || !txt) return;
  if (n > 0) { pill.className = 'sync'; txt.textContent = '☁️ ' + n + ' sin enviar'; }
  else { pill.className = 'sync ok'; txt.textContent = 'Sincronizado'; }
}

function loginHTML(msg) {
  return '<div class="lg-card"><div class="lg-logo">🩺</div><h1>KineFlow</h1><p class="lg-sub">Historia clínica kinésica</p>' +
    '<label>Tu nombre</label><input type="text" id="lgNombre" placeholder="Ej: Adrián Lazarte">' +
    '<label>Tu código personal</label><input type="password" id="lgCodigo" placeholder="Mín. 6 caracteres">' +
    '<div class="lg-msg" id="lgMsg">' + (msg || '') + '</div>' +
    '<button type="button" class="btn-main" id="lgEntrar">Entrar 👉</button>' +
    '<div class="lg-or">o</div><button type="button" class="btn-sec" id="lgDemo">🎬 Ver demostración</button></div>';
}

function mostrarLogin(msg) { const el = document.getElementById('login'); if (!el) return; el.innerHTML = loginHTML(msg); el.hidden = false; document.body.classList.add('sin-login'); }

async function hashPerfil(nombre, codigo) {
  const enc = new TextEncoder();
  const km = await crypto.subtle.importKey('raw', enc.encode(String(codigo).trim()), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode('kineflow|' + norm(String(nombre).trim())), iterations: 150000 }, km, 128);
  return [...new Uint8Array(bits)].map(x => x.toString(16).padStart(2, '0')).join('');
}

async function intentarEntrar() {
  const nombre = document.getElementById('lgNombre').value.trim(), codigo = document.getElementById('lgCodigo').value;
  if (nombre.length < 2 || codigo.length < 6) { mostrarLogin('Revisá nombre y código.'); return; }
  const hash = await hashPerfil(nombre, codigo);
  activarPerfil({ nombre: nombre, hash: hash });
}

function activarPerfil(p) {
  PROF = p;
  if (p.demo) SHEET_WEBAPP_URL = '';
  else try { localStorage.setItem('kine_perfil_activo', JSON.stringify(p)); } catch(e){}
  document.getElementById('login').hidden = true; document.body.classList.remove('sin-login');
  const n = document.getElementById('cuentaNombre'); if (n) n.textContent = p.nombre;
  initLocal().then(() => { pintarPendientes(); vaciarCola(); });
}

function iniciarPerfil() {
  let a = null; try { a = JSON.parse(localStorage.getItem('kine_perfil_activo') || 'null'); } catch (e) { }
  if (a && a.hash) activarPerfil(a); else mostrarLogin('');
}

document.getElementById('login').addEventListener('click', function (e) {
  if (e.target.closest('#lgEntrar')) intentarEntrar();
  if (e.target.closest('#lgDemo')) activarPerfil({ nombre: 'Demo', hash: 'd0000000000000000000000000000000', demo: true });
});

// --- NAVEGACIÓN Y RENDERIZADO ---
function irVista(v, noHist) {
  vistaActual = v;
  VISTAS.forEach(x => { const el = document.getElementById('v-' + x); if (el) el.hidden = (x !== v); });
  document.querySelectorAll('.bn').forEach(b => b.classList.toggle('on', b.dataset.go === (v === 'paciente' ? 'pacientes' : v)));
  if (v === 'pacientes') pintarHistorial();
  if (v === 'nuevo') document.getElementById('slotNuevo').appendChild(document.getElementById('pickerCard'));
  if (v === 'consulta') document.getElementById('slotConsulta').appendChild(document.getElementById('pickerCard'));
  if (!noHist) { try { history.pushState({ v: v }, '', '#' + v); } catch (e) { } }
  window.scrollTo(0, 0);
}

document.querySelectorAll('.bn').forEach(b => {
  b.addEventListener('click', () => {
    const g = b.dataset.go;
    if (g === 'nuevo') { limpiarForm(); editando = false; modoConsulta = false; irVista('nuevo'); }
    else if (g === 'consulta') { limpiarForm(); modoConsulta = true; irVista('consulta'); }
    else irVista(g);
  });
});

function reconstruirMapa() {
  fichasMap = {};
  ultimoHistorial.slice().sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).forEach(p => {
    const c = claveP(p.idPaciente, p.patologia); if (!fichasMap[c]) fichasMap[c] = p;
  });
  sesionesCache.forEach(s => { if (!fichasMap[s.clave]) fichasMap[s.clave] = { idPaciente: s.idPaciente, patologia: s.patologia, fecha: s.fecha }; });
}

function pintarHistorial() {
  reconstruirMapa();
  const cont = document.getElementById('listaPac'); if (!cont) return;
  let casos = Object.keys(fichasMap).map(c => {
    const p = fichasMap[c], ss = sesionesCache.filter(s => s.clave === c);
    const ult = ss.length ? Math.max.apply(null, ss.map(s => s.sesion)) : 0;
    return { clave: c, p: p, ss: ss, ult: ult, alta: p.estado === 'alta', t: new Date(p.fecha).getTime() };
  }).sort((a, b) => b.t - a.t);

  if (!casos.length) { cont.innerHTML = '<div class="vacio"><b>No hay pacientes aún.</b></div>'; return; }

  cont.innerHTML = casos.map(x => {
    const d = DB[x.p.patologia] || {nombre: x.p.patologia};
    return '<div class="pcard"><div class="pc-top"><div class="pc-id"><div class="av">👤</div><div><div class="pc-nom">' + esc(x.p.idPaciente) + '</div><div class="pc-dx">' + esc(d.nombre) + '</div></div></div></div>' +
      '<div class="pc-btns"><button class="go" onclick="abrirPaciente(\'' + x.clave + '\')">Abrir</button></div></div>';
  }).join('');
}

function limpiarForm() {
  ['idPaciente', 'edad', 'peso', 'altura', 'buscador'].forEach(i => { const el = document.getElementById(i); if (el) el.value = ''; });
  document.getElementById('seleccionActual').textContent = 'Ninguna patología elegida';
  document.getElementById('wizardPaso1').hidden = false; document.getElementById('wizardPaso2').hidden = true;
  const sel = document.getElementById('patologia'); if(sel) sel.value = '';
}

// --- SELECTOR DE PATOLOGÍAS ---
function poblarSelects() {
  const selP = document.getElementById('patologia'), usados = {};
  if(!selP) return;
  selP.innerHTML = '<option value="">— elegir —</option>';
  Object.keys(ZONAS).forEach(z => {
    const g = document.createElement('optgroup'); g.label = z;
    ZONAS[z].forEach(k => { if (DB[k] && !usados[k]) { usados[k] = 1; const o = document.createElement('option'); o.value = k; o.textContent = DB[k].nombre; g.appendChild(o); } });
    if (g.children.length) selP.appendChild(g);
  });
  const selZ = document.getElementById('zona'), selT = document.getElementById('tipo');
  if(selZ && selZ.options.length === 1) Object.keys(ZONAS).forEach(z => { const o = document.createElement('option'); o.value = z; o.textContent = z; selZ.appendChild(o); });
  if(selT && selT.options.length === 1) Object.keys(TIPOS).forEach(t => { const o = document.createElement('option'); o.value = t; o.textContent = TIPOS[t]; selT.appendChild(o); });
}

document.getElementById('patologia')?.addEventListener('change', function() {
  const k = this.value;
  document.getElementById('seleccionActual').textContent = (k && DB[k]) ? 'Seleccionada: ' + DB[k].nombre : 'Ninguna patología elegida';
  if(modoConsulta && k) { abrirConsulta(k); }
});

document.getElementById('wizardSiguiente')?.addEventListener('click', () => {
  if (!document.getElementById('idPaciente').value.trim() || !document.getElementById('patologia').value) { toast('Faltan datos', true); return; }
  document.getElementById('wizardPaso1').hidden = true; document.getElementById('wizardPaso2').hidden = false;
});
document.getElementById('wizardAtras')?.addEventListener('click', () => { document.getElementById('wizardPaso1').hidden = false; document.getElementById('wizardPaso2').hidden = true; });
document.getElementById('guardar')?.addEventListener('click', () => {
  const id = document.getElementById('idPaciente').value.trim(), pat = document.getElementById('patologia').value;
  const p = conPerfil({ idPaciente: id, patologia: pat, fecha: new Date().toISOString(), estado: 'activo' });
  const arr = leerPacientesLS(); arr.unshift(p); escribirPacientesLS(arr);
  enviarOEncolar(p); toast('Guardado'); abrirPaciente(claveP(id, pat));
});

window.abrirPaciente = function(clave) {
  claveActual = clave; const p = fichasMap[clave]; if (!p) return;
  document.getElementById('idPaciente').value = p.idPaciente; document.getElementById('patologia').value = p.patologia;
  renderPaciente('hoy'); irVista('paciente');
};

function renderPaciente(tab) {
  const p = fichasMap[claveActual]; if (!p) return;
  const d = DB[p.patologia] || {nombre:p.patologia, testN:'-', testD:''};
  document.getElementById('pacHeader').innerHTML = '<div class="ph-nom">' + esc(p.idPaciente) + '</div><div class="ph-dx">' + esc(d.nombre) + '</div>';
  document.getElementById('tabEval').innerHTML = '<div class="card"><h2>Test</h2><p><b>' + d.testN + '</b><br>' + d.testD + '</p></div>';
  document.getElementById('tabHoy').innerHTML = '<div class="card"><h2>Registrar Sesión</h2><button class="btn-main" onclick="toast(\'Simulado\')">Guardar</button></div>';
  document.querySelectorAll('#tabsPac .tab').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  ['hoy','evol','eval','plan','ref'].forEach(t => { const el = document.getElementById('tab' + t.charAt(0).toUpperCase() + t.slice(1)); if (el) el.hidden = (t !== tab); });
}

function abrirConsulta(k) {
  const d = DB[k]; if(!d) return;
  document.getElementById('pacHeader').innerHTML = '<div class="ph-nom">Consulta Rápida</div><div class="ph-dx">' + esc(d.nombre) + '</div>';
  document.getElementById('tabEval').innerHTML = '<div class="card"><h2>Test</h2><p><b>' + d.testN + '</b><br>' + d.testD + '</p></div>';
  irVista('paciente');
}

document.querySelectorAll('#tabsPac .tab').forEach(b => b.addEventListener('click', () => renderPaciente(b.dataset.tab)));

document.addEventListener('DOMContentLoaded', () => {
  poblarSelects();
  iniciarPerfil();
});
