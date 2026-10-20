/* ============================================================
   KineFlow - Lógica principal
   ============================================================ */
let SHEET_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbwt40aoZ1tDfFtT3VFBr864pti20QzQYG4YXWzwK2Uwdndc-IKDL2Z1wquVt9pAUwzO/exec"; // <-- ACÁ VA TU URL DE APPS SCRIPT

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

function loginHTML(msg, extra) {
  return '<div class="lg-card"><div class="lg-logo">🩺</div><h1>KineFlow</h1><p class="lg-sub">Historia clínica kinésica</p>' +
    '<label for="lgNombre">Tu nombre</label><input type="text" id="lgNombre" placeholder="Ej: Adrián Lazarte" autocomplete="off">' +
    '<label for="lgCodigo">Tu código personal (mín. 6 caracteres)</label><input type="password" id="lgCodigo" autocomplete="off" placeholder="Elegí uno y recordalo">' +
    '<div class="lg-msg" id="lgMsg" role="status">' + (msg || '') + '</div>' +
    '<button type="button" class="btn-main" id="lgEntrar">Entrar 👉</button>' +
    (extra || '') + '<div class="lg-or">o</div><button type="button" class="btn-sec" id="lgDemo">🎬 Ver demostración</button>' +
    '<p class="lg-nota">Con el mismo nombre y código entrás desde cualquier dispositivo. Si olvidás el código, no se puede recuperar.</p></div>';
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

function activarPerfil(p) {
  PROF = p;
  if (p.demo) { SHEET_WEBAPP_URL = ''; sembrarDemo(); }
  else { try { localStorage.setItem('kine_perfil_activo', JSON.stringify({ nombre: p.nombre, hash: p.hash })); } catch (e) { } }
  document.getElementById('login').hidden = true; document.body.classList.remove('sin-login');
  const n = document.getElementById('cuentaNombre'); if (n) n.textContent = p.nombre;
  initLocal().then(() => { pintarPendientes(); vaciarCola(); });
}

async function intentarEntrar() {
  const nombre = document.getElementById('lgNombre').value.trim().replace(/\s+/g, ' ');
  const codigo = document.getElementById('lgCodigo').value;
  if (nombre.length < 2) { mostrarLogin('Escribí tu nombre.'); return; }
  if (codigo.trim().length < 6) { mostrarLogin('El código necesita al menos 6 caracteres.'); return; }
  let hash; try { hash = await hashPerfil(nombre, codigo); } catch (e) { mostrarLogin('Navegador no compatible.'); return; }
  activarPerfil({ nombre: nombre, hash: hash });
}

function iniciarPerfil() {
  let a = null; try { a = JSON.parse(localStorage.getItem('kine_perfil_activo') || 'null'); } catch (e) { }
  if (a && a.hash && a.nombre) { activarPerfil(a); return; }
  mostrarLogin('');
}

document.getElementById('login').addEventListener('click', function (e) {
  if (e.target.closest('#lgEntrar')) intentarEntrar();
  if (e.target.closest('#lgDemo')) { activarPerfil({ nombre: 'Demo', hash: 'd' + '0'.repeat(31), demo: true }); }
});
document.getElementById('login').addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.id === 'lgCodigo') intentarEntrar(); });

function irVista(v, noHist) {
  vistaActual = v;
  VISTAS.forEach(x => { const el = document.getElementById('v-' + x); if (el) el.hidden = (x !== v); });
  document.querySelectorAll('.bn').forEach(b => b.classList.toggle('on', b.dataset.go === (v === 'paciente' ? 'pacientes' : v)));
  
  const picker = document.getElementById('pickerCard');
  if (v === 'nuevo') document.getElementById('slotNuevo').appendChild(picker);
  if (v === 'consulta') document.getElementById('slotConsulta').appendChild(picker);
  const tit = document.getElementById('pickerTitulo'); if (tit) tit.textContent = v === 'consulta' ? '¿Qué patología querés consultar?' : 'Diagnóstico';

  if (v === 'pacientes') pintarHistorial();
  if (v === 'nuevo' || v === 'consulta') listarSugerencias();
  
  if (!noHist) { try { history.pushState({ v: v }, '', '#' + v); } catch (e) { } }
  window.scrollTo(0, 0);
}

window.addEventListener('popstate', function (e) {
  const v = (e.state && e.state.v) || 'pacientes';
  irVista(v === 'paciente' && !claveActual && !modoConsulta ? 'pacientes' : v, true);
});

document.querySelectorAll('.bn').forEach(b => {
  b.addEventListener('click', () => {
    const g = b.dataset.go;
    if (g === 'nuevo') nuevoPaciente();
    else if (g === 'consulta') iniciaConsulta();
    else irVista(g);
  });
});

function poblarSelects() {
  const selP = document.getElementById('patologia'), usados = {};
  if (!selP) return;
  selP.innerHTML = '<option value="">— elegir —</option>';
  Object.keys(ZONAS).forEach(z => {
    const g = document.createElement('optgroup'); g.label = z;
    ZONAS[z].forEach(k => {
      if (DB[k] && !usados[k]) { usados[k] = 1; const o = document.createElement('option'); o.value = k; o.textContent = DB[k].nombre; g.appendChild(o); }
    });
    if (g.children.length) selP.appendChild(g);
  });
  const resto = Object.keys(DB).filter(k => !usados[k]);
  if (resto.length) {
    const g = document.createElement('optgroup'); g.label = "Otras";
    resto.forEach(k => { const o = document.createElement('option'); o.value = k; o.textContent = DB[k].nombre; g.appendChild(o); });
    selP.appendChild(g);
  }
  const selZ = document.getElementById('zona');
  if (selZ) { selZ.innerHTML = '<option value="">Todas</option>'; Object.keys(ZONAS).forEach(z => { const o = document.createElement('option'); o.value = z; o.textContent = z; selZ.appendChild(o); }); }
  const selT = document.getElementById('tipo');
  if (selT) { selT.innerHTML = '<option value="">Todos</option>'; Object.keys(TIPOS).forEach(t => { const o = document.createElement('option'); o.value = t; o.textContent = TIPOS[t]; selT.appendChild(o); }); }
}

function listarSugerencias() {
  const qInput = document.getElementById('buscador'), zInput = document.getElementById('zona'), tInput = document.getElementById('tipo'), cont = document.getElementById('sugerencias');
  if (!qInput || !cont) return;
  const q = norm(qInput.value.trim()), z = zInput.value, t = tInput.value;
  let keys = z ? (ZONAS[z] || []).slice() : Object.keys(DB);
  keys = keys.filter(k => DB[k]);
  if (t) keys = keys.filter(k => DB[k].tipo === t);
  if (q) {
    const palabras = q.split(/\s+/).filter(Boolean);
    keys = keys.filter(k => {
      const d = DB[k], hay = norm(d.nombre + ' ' + k.replace(/_/g, ' ') + ' ' + (TIPOS[d.tipo] || '') + ' ' + d.testN);
      return palabras.every(p => hay.indexOf(p) >= 0);
    });
  }
  const actual = document.getElementById('patologia').value;
  if (!keys.length) { cont.innerHTML = '<p class="sub">No hay coincidencias.</p>'; return; }
  cont.innerHTML = '<div class="sub" style="margin-bottom:6px;">' + keys.length + ' patologías. Tocá una:</div><div style="max-height:250px;overflow:auto;">' + 
    keys.map(k => '<button type="button" class="chip" style="display:block;width:100%;text-align:left;margin-bottom:6px;' + (k===actual?'background:var(--primary);color:#fff;':'') + '" onclick="seleccionarPatologia(\'' + k + '\')">' + DB[k].nombre + '</button>').join('') + '</div>';
}

window.seleccionarPatologia = function(k) {
  document.getElementById('patologia').value = k;
  document.getElementById('seleccionActual').textContent = 'Seleccionada: ' + DB[k].nombre;
  listarSugerencias();
  if (vistaActual === 'consulta') {
    modoConsulta = true;
    document.getElementById('idPaciente').value = 'Consulta rápida';
    claveActual = null;
    renderPaciente('eval');
    irVista('paciente');
  }
};

['buscador','zona','tipo'].forEach(id => {
  const el = document.getElementById(id);
  if(el) el.addEventListener('input', listarSugerencias);
});
const selP = document.getElementById('patologia');
if(selP) selP.addEventListener('change', () => { document.getElementById('buscador').value = ''; seleccionarPatologia(selP.value); });

// ===== Funciones de la Interfaz =====
function reconstruirMapa() {
  fichasMap = {};
  ultimoHistorial.slice().sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).forEach(p => {
    const c = claveP(p.idPaciente, p.patologia);
    if (!fichasMap[c]) fichasMap[c] = p;
  });
  sesionesCache.forEach(s => {
    if (!fichasMap[s.clave]) fichasMap[s.clave] = { idPaciente: s.idPaciente, patologia: s.patologia, fecha: s.fecha };
  });
}

function ultimaActividad(c) {
  let t = fichasMap[c] ? new Date(fichasMap[c].fecha).getTime() : 0;
  sesionesCache.forEach(s => { if (s.clave === c) { const x = new Date(s.fecha).getTime(); if (x > t) t = x; } });
  return t || 0;
}

function pintarHistorial() {
  reconstruirMapa();
  const cont = document.getElementById('listaPac'); if (!cont) return;
  const q = norm((document.getElementById('buscaPac') || { value: '' }).value.trim());
  
  let casos = [];
  Object.keys(fichasMap).forEach(c => {
    const p = fichasMap[c], ss = sesionesCache.filter(s => s.clave === c);
    const ult = ss.length ? Math.max.apply(null, ss.map(s => s.sesion)) : 0;
    casos.push({ clave: c, p: p, ss: ss, ult: ult, completo: ult >= 10, alta: p.estado === 'alta', t: ultimaActividad(c) });
  });

  let lista = casos.filter(x => {
    if (filtroPac === 'activos' && x.alta) return false;
    if (filtroPac === 'alta' && !x.alta) return false;
    if (q) {
      const d = DB[x.p.patologia];
      const hay = norm(x.p.idPaciente + ' ' + (d ? d.nombre : x.p.patologia));
      return q.split(/\s+/).every(w => hay.indexOf(w) >= 0);
    }
    return true;
  }).sort((a, b) => b.t - a.t);

  if (!casos.length) {
    cont.innerHTML = '<div class="vacio"><div class="big">🧑‍⚕️🌱</div><b>Todavía no hay pacientes.</b><br>Tocá <b>Nuevo</b> para cargar el primero.</div>';
    return;
  }
  if (!lista.length) { cont.innerHTML = '<div class="vacio">No hay pacientes que coincidan.</div>'; return; }

  cont.innerHTML = lista.map(x => {
    const d = DB[x.p.patologia], nom = d ? d.nombre : x.p.patologia;
    const sig = Math.min(x.ult + 1, 10);
    return '<div class="pcard' + (x.alta ? ' alta' : '') + '">' +
      '<div class="pc-top"><div class="pc-id"><div class="av">👤</div><div><div class="pc-nom">' + esc(x.p.idPaciente) + '</div><div class="pc-dx">' + esc(nom) + '</div></div></div>' +
      '<div class="pc-side">' + (x.alta ? '<span class="badge ok">Alta</span>' : (x.completo ? '<span class="badge ok">10/10</span>' : '')) + '</div></div>' +
      '<div class="pc-meta"><span>' + x.ult + '/10 sesiones</span><div class="prog"><i style="width:' + (x.ult * 10) + '%"></i></div></div>' +
      '<div class="pc-btns"><button class="go" onclick="abrirPaciente(\'' + x.clave + '\', \'hoy\')">Registrar sesión ' + sig + '</button>' +
      '<button class="ev" onclick="abrirPaciente(\'' + x.clave + '\', \'evol\')">Evolución</button></div></div>';
  }).join('');
}

const buscaPacInput = document.getElementById('buscaPac');
if(buscaPacInput) buscaPacInput.addEventListener('input', () => { clearTimeout(window._buscaT); window._buscaT = setTimeout(pintarHistorial, 150); });

document.querySelectorAll('#filtroPac .chip').forEach(b => {
  b.addEventListener('click', () => {
    filtroPac = b.dataset.f;
    document.querySelectorAll('#filtroPac .chip').forEach(c => c.classList.toggle('on', c === b));
    pintarHistorial();
  });
});

function limpiarForm() {
  ['idPaciente', 'edad', 'peso', 'altura', 'buscador'].forEach(i => { const el = document.getElementById(i); if (el) el.value = ''; });
  document.querySelectorAll('#comorb input,#medic input,#rojas input,#amarillas input,#azules input,#negras input').forEach(i => i.checked = false);
  document.getElementById('patologia').value = '';
  document.getElementById('seleccionActual').textContent = 'Ninguna patología elegida';
  document.getElementById('msgNuevo').textContent = '';
  document.getElementById('wizardPaso1').hidden = false;
  document.getElementById('wizardPaso2').hidden = true;
}

function nuevoPaciente() {
  limpiarForm(); editando = false; modoConsulta = false; claveActual = null; recienGuardada = null;
  document.getElementById('tituloNuevo').textContent = 'Paciente nuevo';
  irVista('nuevo');
}

function iniciaConsulta() {
  limpiarForm(); modoConsulta = true; claveActual = null; irVista('consulta');
}

const wizardSig = document.getElementById('wizardSiguiente');
if(wizardSig) wizardSig.addEventListener('click', () => {
  const id = document.getElementById('idPaciente').value.trim();
  const pat = document.getElementById('patologia').value;
  if (!id) { toast('Escribí el nombre del paciente.', true); return; }
  if (!pat || !DB[pat]) { toast('Elegí un diagnóstico de la lista.', true); return; }
  document.getElementById('wizardPaso1').hidden = true;
  document.getElementById('wizardPaso2').hidden = false;
});

const wizardAtras = document.getElementById('wizardAtras');
if(wizardAtras) wizardAtras.addEventListener('click', () => {
  document.getElementById('wizardPaso1').hidden = false;
  document.getElementById('wizardPaso2').hidden = true;
});

const cancelarNuevo = document.getElementById('cancelarNuevo');
if(cancelarNuevo) cancelarNuevo.addEventListener('click', () => irVista('pacientes'));

const btnGuardar = document.getElementById('guardar');
if(btnGuardar) btnGuardar.addEventListener('click', () => {
  const id = document.getElementById('idPaciente').value.trim();
  const pat = document.getElementById('patologia').value;
  const p = conPerfil({
    idPaciente: id, patologia: pat,
    edad: document.getElementById('edad').value, peso: document.getElementById('peso').value, altura: document.getElementById('altura').value,
    actividad: document.getElementById('actividad').value,
    comorb: [...document.querySelectorAll('#comorb input:checked, #rojas input:checked, #amarillas input:checked, #azules input:checked, #negras input:checked')].map(i => i.value),
    medic: [...document.querySelectorAll('#medic input:checked')].map(i => i.value),
    neuro: document.getElementById('antecedenteNeuro').checked,
    estado: 'activo', fecha: new Date().toISOString()
  });
  const arr = leerPacientesLS(); arr.unshift(p); escribirPacientesLS(arr);
  ultimoHistorial.unshift(p);
  enviarOEncolar(p);
  toast('Paciente guardado ✓');
  abrirPaciente(claveP(id, pat), 'hoy');
});

window.abrirPaciente = function(clave, tab) {
  const p = fichasMap[clave]; if (!p) return;
  document.getElementById('idPaciente').value = p.idPaciente;
  document.getElementById('patologia').value = p.patologia;
  if (p.comorb) {
    [...document.querySelectorAll('#comorb input, #rojas input, #amarillas input, #azules input, #negras input')].forEach(i => { if(p.comorb.includes(i.value)) i.checked = true; });
  }
  if (p.medic) { [...document.querySelectorAll('#medic input')].forEach(i => { if(p.medic.includes(i.value)) i.checked = true; }); }
  document.getElementById('antecedenteNeuro').checked = !!p.neuro;
  document.getElementById('edad').value = p.edad || '';
  document.getElementById('peso').value = p.peso || '';
  document.getElementById('altura').value = p.altura || '';
  
  modoConsulta = false; claveActual = clave; recienGuardada = null;
  renderPaciente(tab || 'hoy'); irVista('paciente');
};

function renderPaciente(tab) {
  const clave = claveActual || claveP(document.getElementById('idPaciente').value, document.getElementById('patologia').value);
  const patKey = document.getElementById('patologia').value;
  const d = DB[patKey]; if (!d) return;
  
  const p = fichasMap[clave] || { idPaciente: document.getElementById('idPaciente').value, patologia: patKey };
  const ss = sesionesDe(p.idPaciente, p.patologia);
  
  document.getElementById('pacHeader').innerHTML = '<div class="ph-top"><div class="ph-id"><div class="av">👤</div><div><div class="ph-nom">' + esc(p.idPaciente) + '</div><div class="ph-dx">' + esc(d.nombre) + '</div></div></div>' +
    '<div class="ph-btns">' + (modoConsulta ? '<button onclick="irVista(\'consulta\')">← Volver</button>' : '<button onclick="irVista(\'pacientes\')">← Pacientes</button>') + '</div></div>';
  
  document.getElementById('tabHoy').innerHTML = hoyHTML(p, d, ss);
  document.getElementById('tabEvol').innerHTML = evolTabHTML(p, d, ss);
  document.getElementById('tabEval').innerHTML = '<div class="card"><h2>Evaluación</h2><p><b>Test principal: ' + d.testN + '</b><br>' + d.testD + '</p></div>';
  document.getElementById('tabPlan').innerHTML = '<div class="card"><h2>Plan de 10 sesiones</h2><p class="sub">Este plan está pre-diseñado según la evidencia para esta patología.</p></div>';
  document.getElementById('tabRef').innerHTML = '<div class="card"><h2>Evidencia</h2><p class="sub">Buscá evidencia actualizada en PubMed.</p><button class="btn-sec" onclick="window.open(\'https://pubmed.ncbi.nlm.nih.gov/?term=' + encodeURIComponent(d.nombre) + '\')">Buscar en PubMed</button></div>';
  
  document.querySelectorAll('#tabsPac .tab').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  ['hoy','evol','eval','plan','ref'].forEach(t => {
    const el = document.getElementById('tab' + t.charAt(0).toUpperCase() + t.slice(1));
    if (el) el.hidden = (t !== tab);
  });
}

document.querySelectorAll('#tabsPac .tab').forEach(b => {
  b.addEventListener('click', () => {
    tabActual = b.dataset.tab;
    renderPaciente(tabActual);
  });
});

function hoyHTML(p, d, ss) {
  const ult = ss.length ? Math.max.apply(null, ss.map(s => s.sesion)) : 0;
  const n = Math.min(ult + 1, 10);
  let html = '<div class="card hoy-card"><h2>Sesión ' + n + ' de 10</h2>';
  html += '<label>Dolor en Reposo (0-10)</label><input type="number" id="evaReposo" min="0" max="10" style="margin-bottom:10px;">';
  html += '<label>Dolor en Movimiento (0-10)</label><input type="number" id="evaMovimiento" min="0" max="10" style="margin-bottom:10px;">';
  html += '<label>Notas de la sesión</label><textarea id="notaSesion" rows="2" style="margin-bottom:10px;"></textarea>';
  html += '<div class="barra-accion"><button class="btn-main" onclick="guardarSesion(\'' + n + '\')">Guardar Sesión</button></div></div>';
  return html;
}

window.guardarSesion = function(n) {
  const rep = numONull(document.getElementById('evaReposo').value);
  const mov = numONull(document.getElementById('evaMovimiento').value);
  const notas = document.getElementById('notaSesion').value;
  
  const reg = conPerfil(normSesion({
    idPaciente: document.getElementById('idPaciente').value,
    patologia: document.getElementById('patologia').value,
    sesion: +n, fecha: new Date().toISOString(),
    evaReposo: rep, evaMovimiento: mov, notas: notas
  }));
  
  const arr = leerSesLS().filter(s => !(s.clave === reg.clave && s.sesion === reg.sesion));
  arr.push(reg); escribirSesLS(arr);
  sesionesCache = mezclarSesiones(sesionesCache, [reg]);
  
  enviarOEncolar(reg);
  toast('Sesión ' + n + ' guardada ✓');
  confeti();
  renderPaciente('hoy');
};

function evolTabHTML(p, d, ss) {
  if (!ss.length) return '<div class="card"><p class="sub">Aún no hay sesiones registradas.</p></div>';
  return '<div class="card"><h2>Evolución del Dolor</h2><table class="evt" style="width:100%;text-align:left;"><tr><th>Sesión</th><th>Reposo</th><th>Movimiento</th><th>Notas</th></tr>' +
    ss.map(s => '<tr><td>' + s.sesion + '</td><td>' + (s.evaReposo!=null?s.evaReposo:'-') + '</td><td>' + (s.evaMovimiento!=null?s.evaMovimiento:'-') + '</td><td>' + esc(s.notas||'') + '</td></tr>').join('') + '</table></div>';
}

function sembrarDemo() {
  const dia = (n) => { const d = new Date(); d.setDate(d.getDate()-n); return d.toISOString(); };
  const f = [
    conPerfil({ idPaciente: 'Juan Pérez', patologia: 'lumbalgia', edad: 45, comorb: [], medic: [], estado: 'activo', fecha: dia(10) }),
    conPerfil({ idPaciente: 'María Gómez', patologia: 'hombro', edad: 60, comorb: ['diabetes'], medic: [], estado: 'activo', fecha: dia(5) })
  ];
  escribirPacientesLS(f);
  ultimoHistorial = f;
  const s = [
    conPerfil(normSesion({ idPaciente: 'Juan Pérez', patologia: 'lumbalgia', sesion: 1, fecha: dia(8), evaReposo: 5, evaMovimiento: 7, notas: 'Buena evolución.' })),
    conPerfil(normSesion({ idPaciente: 'María Gómez', patologia: 'hombro', sesion: 1, fecha: dia(4), evaReposo: 3, evaMovimiento: 6, notas: 'Molestia al elevar brazo.' }))
  ];
  escribirSesLS(s);
  sesionesCache = s;
  toast('Modo Demo activado');
}

// Inicialización final
document.addEventListener('DOMContentLoaded', () => {
  poblarSelects();
  iniciarPerfil();
  
  // Dark Mode
  const tDark = document.getElementById('toggleDark');
  if(tDark) {
    if(localStorage.getItem('kine_dark') === '1') { document.documentElement.setAttribute('data-theme', 'dark'); tDark.checked = true; }
    tDark.addEventListener('change', (e) => {
      if(e.target.checked) { document.documentElement.setAttribute('data-theme', 'dark'); localStorage.setItem('kine_dark', '1'); }
      else { document.documentElement.removeAttribute('data-theme'); localStorage.setItem('kine_dark', '0'); }
    });
  }

  // Botones de ajustes
  const bSalir = document.getElementById('btnSalir');
  if(bSalir) bSalir.addEventListener('click', () => { localStorage.removeItem('kine_perfil_activo'); location.reload(); });
  
  const bBorrar = document.getElementById('btnBorrar');
  if(bBorrar) bBorrar.addEventListener('click', () => { if(confirm('¿Borrar datos locales?')) { localStorage.clear(); location.reload(); } });
  
  irVista('pacientes', true);
});
