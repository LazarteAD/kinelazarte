/* ============================================================
   KineFlow - Lógica principal
   ============================================================ */

// CONFIGURACIÓN: Pegá acá la URL de tu Google Apps Script (termina en /exec)
let SHEET_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbXXXXXXXXXXXXXXXXXXXX/exec"; 

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
  if (!SHEET_WEBAPP_URL || SHEET_WEBAPP_URL.indexOf('XXXX') > 0) return { ok: false, error: 'Falta configurar la URL del backend.' };
  try {
    const r = await fetch(SHEET_WEBAPP_URL, { method: 'POST', body: JSON.stringify(o) });
    return await r.json();
  } catch (e) { return { ok: false, error: 'network' }; }
}

async function enviarSheet(reg) {
  if (!SHEET_WEBAPP_URL || SHEET_WEBAPP_URL.indexOf('XXXX') > 0 || !PROF || PROF.demo) return true;
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
  if (vaciando || !PROF || PROF.demo || !SHEET_WEBAPP_URL) return;
  const inicial = colaLeer(); if (!inicial.length) return;
  vaciando = true;
  try {
    const enviadosSet = new Set();
    let cortar = false;
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
// ===== Autenticación (Login) =====
async function hashPerfil(nombre, codigo) {
  if (!(window.crypto && crypto.subtle)) throw new Error('nocrypto');
  const enc = new TextEncoder();
  const km = await crypto.subtle.importKey('raw', enc.encode(String(codigo).trim()), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode('kine-consultorio-v3|' + norm(String(nombre).trim())), iterations: 150000 }, km, 128);
  return [...new Uint8Array(bits)].map(x => x.toString(16).padStart(2, '0')).join('');
}

function perfilesLista() { try { return JSON.parse(localStorage.getItem('kine_perfiles') || '[]'); } catch (e) { return []; } }
function perfilesGuardar(p) {
  const l = perfilesLista().filter(x => x.hash !== p.hash);
  l.unshift({ nombre: p.nombre, hash: p.hash });
  try { localStorage.setItem('kine_perfiles', JSON.stringify(l.slice(0, 8))); localStorage.setItem('kine_perfil_activo', JSON.stringify({ nombre: p.nombre, hash: p.hash })); } catch (e) { }
}

function loginHTML(msg, extra) {
  const pf = perfilesLista();
  const chips = pf.length ? '<div class="lg-chips">' + pf.map(x => '<button type="button" class="chip lg-chip" data-n="' + esc(x.nombre) + '">👤 ' + esc(x.nombre) + '</button>').join('') + '</div>' : '';
  return '<div class="lg-card"><div class="lg-logo">🩺</div><h1>KineFlow</h1><p class="lg-sub">Rehabilitación con evidencia.</p>' + chips +
    '<label for="lgNombre">Tu nombre</label><input type="text" id="lgNombre" placeholder="Ej: Adrián Lazarte" autocomplete="off">' +
    '<label for="lgCodigo">Tu código personal (mín. 6 caracteres)</label><input type="password" id="lgCodigo" autocomplete="off" placeholder="Elegí uno y recordalo">' +
    '<div class="lg-msg" id="lgMsg" role="status">' + (msg || '') + '</div>' +
    '<button type="button" class="btn-main" id="lgEntrar">Entrar 👉</button>' +
    (extra || '') + '<div class="lg-or">o</div><button type="button" class="btn-sec" id="lgDemo">🎬 Ver demostración (datos de ejemplo)</button>' +
    '<p class="lg-nota">Con el mismo nombre y código entrás desde cualquier dispositivo. Si te olvidás el código no se puede recuperar.</p></div>';
}

function mostrarLogin(msg, extra) {
  const el = document.getElementById('login'); if (!el) return;
  el.innerHTML = loginHTML(msg, extra); el.hidden = false;
  document.body.classList.add('sin-login');
}

async function intentarEntrar(crear) {
  const nombre = document.getElementById('lgNombre').value.trim().replace(/\s+/g, ' '), codigo = document.getElementById('lgCodigo').value;
  if (nombre.length < 2) { mostrarLoginKeep('Escribí tu nombre.'); return; }
  if (codigo.trim().length < 6) { mostrarLoginKeep('El código necesita al menos 6 caracteres.'); return; }
  let hash; try { hash = await hashPerfil(nombre, codigo); } catch (e) { mostrarLoginKeep('Este navegador no permite el cifrado necesario.'); return; }
  const p = { nombre: nombre, hash: hash };
  const msg = document.getElementById('lgMsg'); if (msg) msg.textContent = 'Verificando...';
  const local = perfilesLista().some(x => x.hash === hash);
  let existe = local, online = false;
  
  if (SHEET_WEBAPP_URL && SHEET_WEBAPP_URL.indexOf('XXXX') < 0) {
    try {
      const r = await fetch(SHEET_WEBAPP_URL + '?prof=' + encodeURIComponent(hash) + '&nombre=' + encodeURIComponent(nombre));
      const d = await r.json(); online = true;
      if (d.limite) { mostrarLoginKeep('Demasiados intentos. Esperá unos minutos.'); return; }
      if (d.version >= 2) existe = existe || !!d.existe; else { online = false; }
    } catch (e) { }
  }
  
  if (!existe && !crear) {
    const keep = { n: nombre, c: codigo };
    mostrarLogin('No encontré una cuenta con ese nombre y código.', '<button type="button" class="btn-sec" id="lgCrear" style="margin-top:10px">✨ Es mi primera vez: crear cuenta</button>');
    document.getElementById('lgNombre').value = keep.n; document.getElementById('lgCodigo').value = keep.c; return;
  }
  if (!existe && crear && online) {
    await postSheet({ tipo: 'cuenta', profesional: hash, kinesiologo: nombre });
  }
  activarPerfil(p);
}

function mostrarLoginKeep(m) { const n = document.getElementById('lgNombre').value, c = document.getElementById('lgCodigo').value; mostrarLogin(m); document.getElementById('lgNombre').value = n; document.getElementById('lgCodigo').value = c; }

function activarPerfil(p) {
  PROF = p;
  if (p.demo) {
    SHEET_WEBAPP_URL = '';
    try { localStorage.setItem('kine_perfil_activo', JSON.stringify(p)); } catch (e) { }
    sembrarDemo(false);
  } else {
    perfilesGuardar(p);
    try {
      if (!localStorage.getItem('kine_heredado_migrado')) {
        const pv = JSON.parse(localStorage.getItem('kine_pacientes') || '[]'), sv = JSON.parse(localStorage.getItem('kine_sesiones') || '[]');
        if (pv.length || sv.length) { localStorage.setItem(kPac(), JSON.stringify(pv.concat(leerPacientesLS()))); localStorage.setItem(kSes(), JSON.stringify(sv.concat(leerSesLS()))); }
        localStorage.setItem('kine_heredado_migrado', '1');
      }
    } catch (e) { }
  }
  document.getElementById('login').hidden = true; document.body.classList.remove('sin-login');
  const n = document.getElementById('cuentaNombre'); if (n) n.textContent = p.nombre;
  activarDemoUI();
  initLocal().then(() => { pintarPendientes(); vaciarCola(); });
}

function iniciarPerfil() {
  let a = null; try { a = JSON.parse(localStorage.getItem('kine_perfil_activo') || 'null'); } catch (e) { }
  if (a && a.hash && a.nombre) { activarPerfil(a); return; }
  mostrarLogin('');
}

function cerrarSesion() { try { localStorage.removeItem('kine_perfil_activo'); } catch (e) { } location.reload(); }

// ===== Navegación y UI Básica =====
function irVista(v, noHist) {
  vistaActual = v;
  VISTAS.forEach(x => { document.getElementById('v-' + x).hidden = (x !== v); });
  document.querySelectorAll('.bn').forEach(b => { b.classList.toggle('on', b.dataset.go === (v === 'paciente' ? 'pacientes' : v)); });
  
  const picker = document.getElementById('pickerCard');
  if (v === 'nuevo') document.getElementById('slotNuevo').appendChild(picker);
  if (v === 'consulta') document.getElementById('slotConsulta').appendChild(picker);
  
  if (v === 'pacientes') pintarHistorial();
  if (v === 'nuevo' || v === 'consulta') listarSugerencias();
  if (!noHist) { try { history.pushState({ v: v }, '', '#' + v); } catch (e) { } }
  window.scrollTo(0, 0);
}

window.addEventListener('popstate', e => {
  const v = (e.state && e.state.v) || 'pacientes';
  irVista(v === 'paciente' && !claveActual && !modoConsulta ? 'pacientes' : v, true);
});

// ===== Lista de Pacientes e Inteligencia Visual =====
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

function resumenCasos() {
  const out = [];
  Object.keys(fichasMap).forEach(c => {
    const p = fichasMap[c], ss = sesionesCache.filter(s => s.clave === c).sort((a, b) => a.sesion - b.sesion);
    const ult = ss.length ? Math.max.apply(null, ss.map(s => s.sesion)) : 0;
    out.push({ clave: c, p: p, ss: ss, ult: ult, completo: ult >= 10, alta: p.estado === 'alta', t: ultimaActividad(c) });
  });
  return out;
}

function avatar(n) {
  const t = String(n || '?').replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ ,]/g, '').trim();
  const p = t.split(/[ ,]+/).filter(Boolean);
  const ini = ((p[0] || '?').charAt(0) + (p[1] ? p[1].charAt(0) : '')).toUpperCase();
  let hsh = 0; for (let i = 0; i < n.length; i++) hsh = (hsh * 31 + n.charCodeAt(i)) % 360;
  return '<span class="av" style="background:hsl(' + hsh + ',62%,88%);color:hsl(' + hsh + ',55%,28%)">' + esc(ini) + '</span>';
}

function ringAv(inner, ult) { return '<span class="ring" style="--p:' + Math.min(100, (ult || 0) * 10) + '">' + inner + '</span>'; }
function carita(v) { if (v == null) return '🙂'; return v <= 1 ? '😄' : v <= 3 ? '🙂' : v <= 5 ? '😐' : v <= 7 ? '😣' : '😭'; }
function fin0(x) { const l = x.ss[x.ss.length - 1]; return l.evaDespues != null ? l.evaDespues : l.evaAntes; }
function hace(t) { const d = Math.floor((Date.now() - t) / 86400000); return d <= 0 ? 'hoy' : d === 1 ? 'ayer' : 'hace ' + d + ' días'; }

function emojiDx(n) {
  n = norm(String(n || ''));
  const m = [
    [/acv|hemipar|parkinson|neuro|esclerosis|guillain|lesion medular|paralisis|ataxia|epilep/, '🧠'],
    [/pulmon|respirator|asma|epoc|bronq|neumon|covid|fibrosis/, '🫁'],
    [/cardi|infarto|vascular|linfedema|varice|trombo/, '🫀'],
    [/embarazo|lactan|suelo pelvico|incontinen|prolapso|diastasis|postparto|mujer|menopaus/, '🤰'],
    [/lactante|ninos|pediatr|escoliosis|torticolis congenito|displasia|paralisis cerebral/, '🧒'],
    [/rodilla|menisc|ligamento cruzado|lca|lcp|rotula|gonartrosis|patel/, '🦵'],
    [/tobillo|pie |fascitis|aquiles|talon|hallux|metatars/, '🦶'],
    [/hombro|manguito|subacromial|acromio|clavicula|codo|epicondil|muneca|mano|tunel|dedo|quervain/, '💪'],
    [/cadera|coxartrosis|pubalgia|gluteo|piriforme|trocanter/, '🦴'],
    [/lumbar|lumbalgia|ciatica|columna|dorsal|sacro|cervic|cuello|latigazo|espondil|estenosis|facetario|hernia/, '🦴'],
    [/fractura|osteopor|artrosis|artritis|fibromialgia|dolor cronico/, '🩻'],
    [/postoperat|post-operat|artroplast|protesis/, '🏥']
  ];
  for (let i = 0; i < m.length; i++) if (m[i][0].test(n)) return m[i][1];
  return '🩹';
}

function sparkSVG(ss) {
  const vals = ss.map(s => s.evaDespues != null ? s.evaDespues : s.evaAntes).filter(v => v != null);
  if (vals.length < 2) return '';
  const W = 84, H = 26, px = 4, n = vals.length;
  const pts = vals.map((v, i) => [px + i * (W - 2 * px) / (n - 1), H - 3 - (v / 10) * (H - 6)]);
  const last = pts[pts.length - 1];
  return '<svg class="spark" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '"><polyline fill="none" stroke="var(--accent)" stroke-width="2" points="' + pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ') + '"/><circle cx="' + last[0].toFixed(1) + '" cy="' + last[1].toFixed(1) + '" r="3" fill="var(--accent)"/></svg>';
}

function pintarHistorial() {
  reconstruirMapa();
  const casos = resumenCasos();
  const elSaludo = document.getElementById('saludo'); if (elSaludo) elSaludo.innerHTML = ''; // saludo simplificado
  const statsBox = document.getElementById('statsBox');
  if (statsBox) statsBox.innerHTML = casos.length ? statsHTML(casos) : '';
  
  const q = norm((document.getElementById('buscaPac') || { value: '' }).value.trim());
  let lista = casos.filter(x => {
    if (filtroPac === 'activos' && x.alta) return false;
    if (filtroPac === 'alta' && !x.alta) return false;
    if (q) { const d = DB[x.p.patologia]; const hay = norm(x.p.idPaciente + ' ' + (d ? d.nombre : x.p.patologia)); return q.split(/\s+/).every(w => hay.indexOf(w) >= 0); }
    return true;
  }).sort((a, b) => b.t - a.t);

  const cont = document.getElementById('listaPac'); if (!cont) return;
  if (!casos.length) {
    cont.innerHTML = '<div class="vacio"><div class="big">🧑‍⚕️🌱</div><b>Todavía no hay pacientes.</b><br>Tocá <b>Nuevo</b> abajo para cargar el primero.</div>'; return;
  }
  if (!lista.length) { cont.innerHTML = '<div class="vacio">No hay pacientes que coincidan.</div>'; return; }
  
  cont.innerHTML = lista.map(x => {
    const d = DB[x.p.patologia], nom = d ? d.nombre : x.p.patologia, dias = Math.floor((Date.now() - x.t) / 86400000);
    const atraso = !x.alta && !x.completo && x.ult > 0 && dias >= 7;
    let dolor = '';
    if (x.ss.length) {
      const ini = x.ss[0].evaAntes, l = x.ss[x.ss.length - 1], fin = l.evaDespues != null ? l.evaDespues : l.evaAntes;
      if (ini != null && fin != null) dolor = '<span>Dolor ' + ini + ' → ' + fin + '</span>';
    }
    const sig = Math.min(x.ult + 1, 10);
    return '<div class="pcard' + (x.alta ? ' alta' : atraso ? ' atraso' : '') + '">' +
      '<div class="pc-top"><div class="pc-id">' + ringAv(avatar(x.p.idPaciente), x.ult) + '<div><div class="pc-nom">' + esc(x.p.idPaciente) + '</div><div class="pc-dx">' + emojiDx(nom) + ' ' + esc(nom) + (x.p.edad ? ' · ' + esc(x.p.edad) + ' años' : '') + '</div></div></div>' +
      '<div class="pc-side"><span class="mood">' + (x.ss.length ? carita(fin0(x)) : '🆕') + '</span>' + (x.alta ? '<span class="badge ok">🎓 Alta</span>' : atraso ? '<span class="badge warn">⏰ Sin venir ' + dias + 'd</span>' : x.completo ? '<span class="badge ok">🏆 10/10</span>' : '') + '</div></div>' +
      '<div class="pc-meta"><span>' + x.ult + '/10</span><div class="prog"><i style="width:' + (x.ult * 10) + '%"></i></div>' + dolor + sparkSVG(x.ss) + '<span>' + hace(x.t) + '</span></div>' +
      '<div class="pc-btns"><button type="button" class="go" data-act="sesion" data-clave="' + esc(x.clave) + '">' + (x.completo ? 'Ver paciente' : 'Registrar sesión ' + sig) + '</button>' +
      '<button type="button" class="ev" data-act="evol" data-clave="' + esc(x.clave) + '">Evolución</button></div></div>';
  }).join('');
}

function statsHTML(casos) {
  const hoyK = new Date().toDateString(), lim = Date.now() - 7 * 86400000;
  const hoy = sesionesCache.filter(s => new Date(s.fecha).toDateString() === hoyK).length;
  const sem = sesionesCache.filter(s => new Date(s.fecha).getTime() >= lim).length;
  const act = casos.filter(x => !x.alta && !x.completo).length;
  let mej = [], cnt = 0;
  casos.forEach(x => {
    if (x.ss.length >= 2) {
      const ini = x.ss[0].evaAntes, l = x.ss[x.ss.length - 1], fin = l.evaDespues != null ? l.evaDespues : l.evaAntes;
      if (ini != null && fin != null) { mej.push(ini - fin); cnt++; }
    }
  });
  const mm = cnt ? (mej.reduce((a, b) => a + b, 0) / cnt) : null;
  return '<div class="stats">' + 
    '<div class="stat k1"><i class="st">👥</i><b>' + act + '</b><span>Activos</span></div>' + 
    '<div class="stat k2"><i class="st">🔥</i><b>' + hoy + '</b><span>Hoy</span></div>' + 
    '<div class="stat k3"><i class="st">📅</i><b>' + sem + '</b><span>Esta semana</span></div>' +
    '<div class="stat k4"><i class="st">' + (mm !== null && mm > 0 ? '🌈' : '📉') + '</i><b>' + (mm === null ? '–' : (mm > 0 ? '↓ ' : mm < 0 ? '↑ ' : '') + Math.abs(mm).toFixed(1)) + '</b><span>Mejora Dolor</span></div>' + 
  '</div>';
}

// ===== Estado del Paciente y Ficha =====
function ctxPaciente() {
  const g = i => document.getElementById(i);
  const marcado = idc => [...document.querySelectorAll('#' + idc + ' input:checked')].map(i => i.value);
  const edad = +g('edad').value || 0, peso = +g('peso').value || 0, altura = (+g('altura').value || 0) / 100;
  const c = {
    edad: edad, peso: peso, altura: altura, actividad: g('actividad').value, patKey: g('patologia').value,
    id: modoConsulta ? '' : g('idPaciente').value.trim(),
    comorb: marcado('comorb'), medic: marcado('medic'), rojas: marcado('rojas'), amarillas: marcado('amarillas'), azules: marcado('azules'), negras: marcado('negras'),
    esNeuro: g('antecedenteNeuro') ? g('antecedenteNeuro').checked : false
  };
  c.imc = altura > 0 ? peso / (altura * altura) : null;
  c.esMayor = edad >= 65;
  c.pac = { comorb: c.comorb, medic: c.medic, rojas: c.rojas };
  c.d = DB[c.patKey];
  return c;
}

function aplicarFicha(p) {
  document.getElementById('idPaciente').value = p.idPaciente === '(sin nombre)' ? '' : (p.idPaciente || '');
  ['edad', 'peso', 'altura'].forEach(k => { document.getElementById(k).value = p[k] || ''; });
  if (p.actividad) document.getElementById('actividad').value = p.actividad;
  document.getElementById('patologia').value = (p.patologia && DB[p.patologia]) ? p.patologia : '';
  const lista = (p.comorb || []).concat(p.medic || []);
  document.querySelectorAll('#comorb input[type=checkbox], #medic input[type=checkbox]').forEach(i => {
    if (i.id === 'antecedenteNeuro') return;
    i.checked = lista.indexOf(i.value) >= 0;
  });
  [['rojas', 'r:'], ['amarillas', 'a:'], ['azules', 'z:'], ['negras', 'n:']].forEach(par => {
    document.querySelectorAll('#' + par[0] + ' input').forEach(i => { i.checked = lista.indexOf(par[1] + i.value) >= 0; });
  });
  const neuroEl = document.getElementById('antecedenteNeuro'); if (neuroEl) neuroEl.checked = !!p.neuro;
  const st = document.getElementById('seleccionActual');
  if (st) st.textContent = DB[p.patologia] ? 'Seleccionada: ' + DB[p.patologia].nombre : 'Ninguna patología elegida';
}

function registrarFicha(estado) {
  const reg = conPerfil(recolectarEstado(estado));
  const arr = leerPacientesLS(); arr.unshift(reg); escribirPacientesLS(arr);
  ultimoHistorial.unshift(reg); reconstruirMapa();
  if (SHEET_WEBAPP_URL && SHEET_WEBAPP_URL.indexOf('XXXX') < 0) {
    enviarOEncolar(reg).then(ok => { if (!ok) toast('Sin conexión: guardado local, se enviará luego.'); });
  }
}

function recolectarEstado(estado) {
  const g = i => document.getElementById(i);
  const marc = (idc, pref) => [...document.querySelectorAll('#' + idc + ' input:checked')].map(i => pref + i.value);
  return {
    idPaciente: g('idPaciente').value.trim() || '(sin nombre)', edad: g('edad').value, peso: g('peso').value, altura: g('altura').value, actividad: g('actividad').value, patologia: g('patologia').value,
    comorb: marc('comorb', '').filter(v => v !== 'on').concat(marc('rojas', 'r:'), marc('amarillas', 'a:'), marc('azules', 'z:'), marc('negras', 'n:')),
    medic: marc('medic', ''), neuro: g('antecedenteNeuro') ? g('antecedenteNeuro').checked : false, estado: estado || 'activo', fecha: new Date().toISOString()
  };
}

function abrirPaciente(clave, tab) {
  const p = fichasMap[clave]; if (!p) return;
  aplicarFicha(p); modoConsulta = false; claveActual = clave; recienGuardada = null;
  renderPaciente(tab || 'hoy'); irVista('paciente');
}
// ===== Renderizado del Paciente =====
function irTab(t) {
  tabActual = t;
  ['hoy', 'evol', 'eval', 'plan', 'ref'].forEach(x => {
    const el = document.getElementById('tab' + x.charAt(0).toUpperCase() + x.slice(1));
    if (el) el.hidden = (x !== t);
  });
  document.querySelectorAll('#tabsPac .tab').forEach(b => {
    b.classList.toggle('on', b.dataset.tab === t);
    b.setAttribute('aria-selected', b.dataset.tab === t ? 'true' : 'false');
  });
  window.scrollTo(0, 0);
}

function renderPaciente(tab) {
  const c = ctxPaciente(), d = c.d;
  if (!d) { toast('Elegí una patología'); return; }
  const consulta = modoConsulta || !c.id;
  
  document.getElementById('pacHeader').innerHTML = headerHTML(c);
  document.getElementById('tabEval').innerHTML = evalHTML(c);
  document.getElementById('tabRef').innerHTML = sustentoHTML(c.patKey, d);
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

function headerHTML(c) {
  const consulta = modoConsulta || !c.id;
  const ss = consulta ? [] : sesionesDe(c.id, c.patKey);
  const ult = ss.length ? Math.max.apply(null, ss.map(s => s.sesion)) : 0;
  const ficha = fichasMap[claveP(c.id, c.patKey)] || {};
  const alta = ficha.estado === 'alta';
  let sub = c.d.nombre; const extra = [];
  if (c.edad) extra.push(c.edad + ' años'); if (c.imc !== null) extra.push('IMC ' + c.imc.toFixed(1));
  if (extra.length) sub += ' · ' + extra.join(' · ');
  
  let h = '<div class="ph-top"><div class="ph-id">' + (consulta ? '<span class="av" style="background:#e6f0fa;color:#1d4f7a">🔎</span>' : ringAv(avatar(c.id), ult)) + '<div><div class="ph-nom">' + (consulta ? 'Consulta rápida' : esc(c.id)) + '</div><div class="ph-dx">' + emojiDx(c.d.nombre) + ' ' + esc(sub) + '</div></div></div><div>';
  if (!consulta) h += alta ? '<span class="badge ok">🎓 De alta</span>' : '<span class="badge">' + (ult >= 10 ? '🏆 ' : '💪 ') + ult + '/10 sesiones</span>';
  h += '</div></div>';
  if (!consulta) h += '<div class="prog" style="margin-top:10px;"><i style="width:' + (ult * 10) + '%"></i></div>';
  if (c.rojas.length) h += '<div style="margin-top:8px;"><span class="badge warn">⚠ Bandera roja marcada</span></div>';
  h += '<div class="ph-btns">';
  h += consulta ? '<button type="button" data-act="volverConsulta">← Otra patología</button>' : '<button type="button" data-act="volver">← Pacientes</button>';
  if (!consulta) {
    h += '<button type="button" data-act="editar">Editar datos</button>';
    h += alta ? '<button type="button" data-act="reactivar">Reactivar</button>' : '<button type="button" data-act="alta">Dar de alta</button>';
  }
  h += '</div>';
  return h;
}

function evalHTML(c) {
  const d = c.d; let html = '';
  if (c.rojas.length) html += '<div class="res-block alerta"><h3>⚠ Bandera roja detectada</h3><p>Priorizar <b>derivación médica</b> antes de continuar.</p></div>';
  if (d.aviso) html += '<div class="res-block alerta"><h3>Precauciones</h3><p>' + d.aviso + '</p></div>';
  if (c.imc !== null) {
    const cat = c.imc < 18.5 ? 'bajo peso' : c.imc < 25 ? 'normal' : c.imc < 30 ? 'sobrepeso' : 'obesidad';
    html += '<div class="res-block"><h3>Datos</h3><p>IMC: <span class="imc-pill">' + c.imc.toFixed(1) + ' — ' + cat + '</span></p></div>';
  }
  const esc_ = d.escala && ESCALAS[d.escala];
  html += '<div class="res-block"><h3>' + d.nombre + ' — test clínico</h3><p><b>' + d.testN + '.</b> ' + d.testD + '</p>' + (d.testExtra ? '<p style="margin-top:8px;"><b>' + d.testExtra.n + '.</b> ' + d.testExtra.d + '</p>' : '') + (esc_ ? '<p style="margin-top:8px;color:var(--muted);"><b>' + esc_.n + ':</b> ' + esc_.d + '</p>' : '') + '</div>';
  html += '<div class="res-block"><h3>Agentes físicos</h3>' + ((d.agentes && d.agentes.length) ? d.agentes.map(k => agenteHTML(k, c.pac, d)).join('') : '<p>El eje es el ejercicio terapéutico.</p>') + '</div>';
  return html;
}

function hoyHTML(c) {
  const d = c.d, ss = sesionesDe(c.id, c.patKey);
  const ult = ss.length ? Math.max.apply(null, ss.map(s => s.sesion)) : 0;
  const completo = ult >= 10, n = Math.min(ult + 1, 10), meta = SES_META[n - 1];
  const bl = bloquesSesion(d, n, c.esMayor, c.pac), prev = ss.length ? ss[ss.length - 1] : null;
  let h = '';
  if (completo) h += '<div class="card"><b>Plan de 10 sesiones completado.</b> Reevaluar.</div>';
  h += '<div class="card hoy-card"><h2>Sesión ' + n + ' de 10 · ' + meta.fase + '</h2><p style="margin:4px 0 8px;"><b>Objetivo:</b> ' + meta.meta + '</p>';
  let ie = 0;
  bl.forEach(b => {
    let chk = '';
    if (b.tipo === 'agente') chk = '<input type="checkbox" class="chk-hecho" value="agente" checked>';
    else if (b.tipo === 'ej') { ie++; chk = '<input type="checkbox" class="chk-hecho" value="ejercicio ' + ie + '" checked>'; }
    h += '<div class="bl"><span class="tm">' + b.t + '</span>' + (chk ? chk : '<span style="width:22px;"></span>') + '<span class="tx">' + b.h + '</span></div>';
  });
  h += '<div class="barra-accion" style="margin:12px 0 0;"><button type="button" class="btn-sec btn-imprimir" data-n="' + n + '">🖨️ Imprimir hoja para el paciente</button></div></div>';
  
  h += '<div class="card"><h2>Registrar la sesión</h2>';
  if (prev && prev.evaDespues != null) h += '<p class="sub" style="margin:0 0 6px;">Sesión anterior terminó con dolor ' + prev.evaDespues + '/10. <button type="button" class="chip usar-ultimo" data-v="' + prev.evaDespues + '">Empezó igual</button></p>';
  h += '<label>Dolor al llegar (NRS)</label><input type="number" id="evaAntes" hidden>' + evaGridHTML('evaAntes', null);
  h += '<label>Dolor al terminar (NRS)</label><input type="number" id="evaDespues" hidden>' + evaGridHTML('evaDespues', null);
  h += '<details class="sub-det"><summary>Agregar medida o nota</summary><label>Medida (ROM, fuerza)</label><input type="text" id="medidaSesion" placeholder="Ej: flexión 110°"><label>Notas</label><textarea id="notaSesion" rows="3"></textarea></details>';
  h += '<label for="nroSesion">Sesión nº</label><select id="nroSesion">' + [1,2,3,4,5,6,7,8,9,10].map(i => '<option value="' + i + '"' + (i === n ? ' selected' : '') + '>' + i + (i <= ult ? ' (reemplaza)' : '') + '</option>').join('') + '</select>';
  h += '<div class="barra-accion"><button type="button" class="btn-main btn-guardar-ses">Guardar sesión</button></div><div id="msgSesion" class="sub"></div></div>';
  return h;
}

function evolTabHTML(c) {
  const ss = sesionesDe(c.id, c.patKey);
  if (!ss.length) return '<div class="card"><p class="sub">No hay sesiones registradas aún.</p></div>';
  const ini = ss[0].evaAntes, ult = ss[ss.length - 1], act = ult.evaDespues != null ? ult.evaDespues : ult.evaAntes;
  const dif = (ini != null && act != null) ? act - ini : null;
  let h = '<div class="tile-row">' + 
    tileHTML(ss.length + '/10', 'Sesiones', '📅', 'k1') + 
    tileHTML(ini != null ? ini + '/10' : '-', 'Dolor inicial', '😣', 'k2') + 
    tileHTML(act != null ? act + '/10' : '-', 'Dolor actual', carita(act), 'k3') + 
  '</div>';
  if (dif !== null) h += '<p class="' + (dif < 0 ? 'aviso-ok' : dif > 0 ? 'aviso-warn' : 'sub') + '">' + (dif < 0 ? 'Mejoró ' + Math.abs(dif) + ' pts' : dif > 0 ? 'Empeoró ' + dif + ' pts' : 'Sin cambios') + '</p>';
  h += '<div class="card"><h2>Gráfico de Evolución</h2>' + evolucionHTML(ss) + '</div>';
  return h;
}

function tileHTML(v, l, e, k) { return '<div class="stat ' + k + '">' + (e ? '<i class="st">' + e + '</i>' : '') + '<b>' + v + '</b><span>' + l + '</span></div>'; }
function evaGridHTML(target, sel) {
  let h = '<div class="eva-grid" data-target="' + target + '">';
  for (let i = 0; i <= 10; i++) h += '<button type="button" class="eva-btn e' + i + (sel === i ? ' on' : '') + '" data-v="' + i + '">' + i + '</button>';
  return h + '</div><div class="eva-say" id="say_' + target + '">' + (sel != null ? carita(sel) + ' ' + sel + ' · ' + efrase(sel) : 'Tocá un número') + '</div><div class="eva-lbl"><span>😄 0 sin dolor</span><span>10 el peor 😭</span></div>';
}
function efrase(v) { return v <= 0 ? 'Sin dolor' : v <= 3 ? 'Dolor leve' : v <= 6 ? 'Dolor moderado' : v <= 8 ? 'Dolor fuerte' : 'Insoportable'; }

function planListaHTML(c) {
  const d = c.d, ss = c.id ? sesionesDe(c.id, c.patKey) : [], porN = {}; ss.forEach(s => { porN[s.sesion] = s; });
  const ult = ss.length ? Math.max.apply(null, ss.map(s => s.sesion)) : 0, hoy = Math.min(ult + 1, 10);
  let h = '<p class="sub">Plan de 10 sesiones.</p>';
  for (let n = 1; n <= 10; n++) {
    const s = porN[n], meta = SES_META[n - 1], bl = bloquesSesion(d, n, c.esMayor, c.pac);
    const estado = s ? 'hecha' : (n === hoy && c.id && ult < 10) ? 'hoy' : 'futura', tag = estado === 'hecha' ? 'Hecha ✓' : estado === 'hoy' ? 'Hoy' : 'Próxima';
    let body = '<p><b>Objetivo:</b> ' + meta.meta + '</p>';
    if (s) body += '<p class="sub"><b>Registrada el ' + new Date(s.fecha).toLocaleDateString() + '.</b> Dolor ' + (s.evaAntes != null ? s.evaAntes : '-') + ' → ' + (s.evaDespues != null ? s.evaDespues : '-') + '.</p>';
    body += '<ol class="bloques">' + bl.map(b => '<li><span class="t">' + b.t + '</span> ' + b.h + '</li>').join('') + '</ol>';
    h += '<details class="ses ' + estado + '"><summary><span class="ses-n">Sesión ' + n + '</span><span class="ses-fase">' + meta.fase + '</span><span class="ses-tag ' + estado + '">' + tag + '</span></summary><div class="ses-body">' + body + '</div></details>';
  }
  return h;
}

// ===== Lógica de Sesiones =====
function bloquesSesion(d, n, esMayor, pac) {
  const meta = SES_META[n - 1], ejs = ejerciciosSesion(d, n, esMayor), dosis = dosisSesion(n, esMayor);
  const agente = agenteDeSesion(d, n, pac), bl = [];
  if (agente) bl.push({ t: '0-15 min', h: '<b>Eval y agente.</b> ' + meta.eval + ' Aplicar <b>' + agente.n + '</b> (' + agente.d + ').', tipo: 'agente' });
  else { bl.push({ t: '0-5 min', h: '<b>Eval.</b> ' + meta.eval, tipo: 'eval' }); bl.push({ t: '5-15 min', h: '<b>Entrada en calor.</b> Movilidad suave.', tipo: 'calor' }); }
  const paso = Math.floor(30 / ejs.length);
  ejs.forEach((e, i) => {
    const ini = 15 + i * paso, fin = (i === ejs.length - 1) ? 45 : ini + paso;
    bl.push({ t: ini + '-' + fin + ' min', h: '<b>Ejercicio ' + (i + 1) + ':</b> ' + e + '<br><span class="sub">' + dosis + '</span>', tipo: 'ej', ej: e });
  });
  bl.push({ t: '45-50 min', h: '<b>Cierre.</b> Enfriamiento, educación y tarea para casa.', tipo: 'cierre' });
  return bl;
}

function poolEj(d, key, esMayor) {
  let arr;
  if (key === 'fuerza') arr = (esMayor && (d.fuerzaFunc || []).filter(Boolean).length) ? d.fuerzaFunc : d.fuerza;
  else arr = d[key];
  return (arr || []).filter(Boolean);
}
function ejerciciosSesion(d, n, esMayor) {
  const out = [], usados = {};
  SES_META[n - 1].plan.forEach(par => {
    const k = par[0], i = par[1], p = poolEj(d, k, esMayor);
    let ej = p.length ? p[i % p.length] : FILLER[k];
    if (usados[ej]) ej = p.find(x => !usados[x]) || (!usados[FILLER[k]] ? FILLER[k] : null);
    if (ej) { usados[ej] = 1; out.push(ej); }
  });
  return out;
}
function dosisSesion(n, esMayor) {
  let t = SES_META[n - 1].dosis;
  if (esMayor) t += " · Adulto mayor: bajar esfuerzo y usar apoyo.";
  return t;
}
function agenteDeSesion(d, n, pac) {
  if (n > 5) return null;
  const ok = (d.agentes || []).filter(k => AGENTES[k] && !contraindicado(k, pac, d));
  return ok.length ? AGENTES[ok[(n - 1) % ok.length]] : null;
}
function motivoBloqueo(key, pac, d) {
  const a = AGENTES[key]; if (!a) return '';
  if (d && d.evitar && d.evitar.indexOf(key) >= 0) return 'contraindicado por esta patología';
  if (a.redC.some(c => pac.comorb.includes(c))) return 'contraindicado por comorbilidad';
  if (a.redM.some(m => pac.medic.includes(m))) return 'contraindicado por medicación';
  if ((a.redF || []).some(f => (pac.rojas || []).includes(f))) return 'contraindicado por bandera roja';
  if (a.notaEmbarazo && pac.comorb.includes('embarazo')) return 'contraindicado en embarazo';
  return '';
}
function contraindicado(key, pac, d) { return !!motivoBloqueo(key, pac, d); }
function motivoPrecaucion(key, pac) {
  const a = AGENTES[key]; if (!a) return '';
  const t = [];
  Object.keys(a.precC || {}).forEach(c => { if (pac.comorb.includes(c)) t.push(a.precC[c]); });
  Object.keys(a.precM || {}).forEach(m => { if (pac.medic.includes(m)) t.push(a.precM[m]); });
  return t.join('; ');
}
function agenteHTML(key, pac, d) {
  const a = AGENTES[key]; if (!a) return '';
  const m = motivoBloqueo(key, pac, d);
  return '<div class="agente ' + (m ? 'contra' : '') + '"><b>' + a.n + '</b><br><span class="dosis">' + (m ? '<span class="warn">⚠ NO USAR: ' + m + '. </span>' : '') + a.d + (!m && motivoPrecaucion(key, pac) ? '<br><span class="prec-txt">Precaución: ' + motivoPrecaucion(key, pac) + '.</span>' : '') + '</span></div>';
}

async function guardarSesion() {
  const btn = document.querySelector('.btn-guardar-ses');
  if (btn && btn.disabled) return; if (btn) btn.disabled = true;
  try {
    const msg = document.getElementById('msgSesion');
    const c = ctxPaciente(), id = c.id, pat = c.patKey;
    if (!id) { msg.textContent = 'Falta el nombre.'; return; }
    const n = +document.getElementById('nroSesion').value;
    const antes = numONull(document.getElementById('evaAntes').value), despues = numONull(document.getElementById('evaDespues').value);
    if (antes === null || despues === null) { msg.textContent = 'Tocá el dolor inicial y final.'; msg.className = 'aviso-warn'; return; }
    const med = document.getElementById('medidaSesion').value.trim(), nota = document.getElementById('notaSesion').value.trim();
    const reg = conPerfil(normSesion({ idPaciente: id, patologia: pat, sesion: n, fecha: new Date().toISOString(), evaAntes: antes, evaDespues: despues, notas: (med ? 'Medida: ' + med + '. ' : '') + nota, hechos: [...document.querySelectorAll('.chk-hecho:checked')].map(i => i.value) }));
    const arr = leerSesLS().map(normSesion).filter(s => !(s.clave === reg.clave && s.sesion === n)); arr.push(reg); escribirSesLS(arr);
    sesionesCache = mezclarSesiones(sesionesCache.filter(s => !(s.clave === reg.clave && s.sesion === n)), [reg]);
    if (!fichasMap[reg.clave]) registrarFicha('activo');
    recienGuardada = { clave: reg.clave, n: n };
    if (SHEET_WEBAPP_URL && SHEET_WEBAPP_URL.indexOf('XXXX') < 0) {
      enviarOEncolar(reg).then(ok => { toast(ok ? '🎉 Sesión ' + n + ' guardada y sincronizada' : 'Sesión ' + n + ' guardada. Se enviará al reconectar.'); });
    } else { toast('Sesión ' + n + ' guardada ✓'); }
    try { if (navigator.vibrate) navigator.vibrate([20, 40, 20]); } catch (x) { }
    confeti(n >= 10 ? 60 : 24); if (n >= 10) toast('🏆 ¡Tratamiento completo!');
    renderPaciente('hoy'); pintarHistorial();
  } finally { if (btn) setTimeout(() => { btn.disabled = false; }, 400); }
}

// ===== Formulario / Wizard =====
function nuevoPaciente() {
  ['idPaciente', 'edad', 'peso', 'altura', 'buscador'].forEach(i => { const el = document.getElementById(i); if (el) el.value = ''; });
  document.getElementById('idPaciente').readOnly = false;
  document.getElementById('actividad').value = 'sedentario';
  document.querySelectorAll('#comorb input,#medic input,#rojas input,#amarillas input,#azules input,#negras input').forEach(i => i.checked = false);
  document.getElementById('patologia').value = ''; document.getElementById('zona').value = ''; document.getElementById('tipo').value = '';
  document.getElementById('seleccionActual').textContent = 'Ninguna patología elegida';
  document.getElementById('msgNuevo').textContent = '';
  document.getElementById('wizardPaso1').hidden = false; document.getElementById('wizardPaso2').hidden = true;
  editando = false; modoConsulta = false; claveActual = null;
  document.getElementById('tituloNuevo').textContent = 'Paciente nuevo';
  irVista('nuevo');
}

function listarSugerencias() {
  const q = norm(document.getElementById('buscador').value.trim());
  const z = document.getElementById('zona').value, t = document.getElementById('tipo').value;
  const cont = document.getElementById('sugerencias');
  let keys = z ? (ZONAS[z] || []).slice() : Object.keys(DB);
  keys = keys.filter(k => DB[k]);
  if (t) keys = keys.filter(k => DB[k].tipo === t);
  if (q) {
    const palabras = q.split(/\s+/).filter(Boolean);
    keys = keys.filter(k => {
      const d = DB[k], hay = norm(d.nombre + ' ' + k.replace(/_/g, ' ') + ' ' + (TIPOS[d.tipo] || '') + ' ' + (SINONIMOS_TIPO[d.tipo] || '') + ' ' + d.testN);
      return palabras.every(p => hay.indexOf(p) >= 0);
    });
  }
  const actual = document.getElementById('patologia').value;
  if (!keys.length) { cont.innerHTML = '<p style="font-size:.83rem;color:var(--muted);">No hay coincidencias.</p>'; return; }
  cont.innerHTML = '<div style="font-size:.78rem;color:var(--muted);margin-bottom:6px;">' + keys.length + ' patología(s).</div><div style="max-height:300px;overflow:auto;">' + keys.map(k => {
    const sel = (k === actual);
    return '<button type="button" class="sug-item" data-k="' + k + '" style="display:block;width:100%;text-align:left;margin-bottom:6px;padding:9px 12px;border:1px solid ' + (sel ? 'var(--primary)' : 'var(--line)') + ';border-radius:6px;background:' + (sel ? 'var(--primary-soft)' : 'var(--panel)') + ';cursor:pointer;">' + DB[k].nombre + ' <span style="color:var(--muted);font-size:.74rem;">· ' + (TIPOS[DB[k].tipo] || '') + '</span></button>';
  }).join('') + '</div>';
}

// ===== Eventos Globales =====
document.addEventListener('click', function (e) {
  const t = e.target;
  let el;
  if ((el = t.closest('.bn'))) {
    const g = el.dataset.go;
    if (g === 'nuevo') nuevoPaciente(); else if (g === 'consulta') { modoConsulta = true; irVista('consulta'); } else irVista(g);
    return;
  }
  if ((el = t.closest('#filtroPac .chip'))) {
    filtroPac = el.dataset.f;
    document.querySelectorAll('#filtroPac .chip').forEach(b => b.classList.toggle('on', b === el));
    pintarHistorial(); return;
  }
  if ((el = t.closest('.pcard button[data-act]'))) { abrirPaciente(el.dataset.clave, el.dataset.act === 'evol' ? 'evol' : 'hoy'); return; }
  if ((el = t.closest('.ph-btns button[data-act]'))) {
    const a = el.dataset.act;
    if (a === 'volver') irVista('pacientes');
    else if (a === 'editar') { editando = true; document.getElementById('tituloNuevo').textContent = 'Editar paciente'; document.getElementById('wizardPaso1').hidden = true; document.getElementById('wizardPaso2').hidden = false; irVista('nuevo'); }
    else if (a === 'alta' || a === 'reactivar') { registrarFicha(a === 'alta' ? 'alta' : 'activo'); toast('Estado actualizado'); renderPaciente(tabActual); }
    return;
  }
  if ((el = t.closest('#tabsPac .tab'))) { irTab(el.dataset.tab); return; }
  if ((el = t.closest('.eva-btn'))) {
    const grid = el.closest('.eva-grid'), inp = document.getElementById(grid.dataset.target);
    inp.value = el.dataset.v; try { if (navigator.vibrate) navigator.vibrate(12); } catch (x) { }
    const say = document.getElementById('say_' + grid.dataset.target); if (say) { say.textContent = carita(+el.dataset.v) + ' ' + el.dataset.v + ' · ' + efrase(+el.dataset.v); }
    grid.querySelectorAll('.eva-btn').forEach(b => b.classList.toggle('on', b === el));
    return;
  }
  if ((el = t.closest('.usar-ultimo'))) {
    const inp = document.getElementById('evaAntes'); inp.value = el.dataset.v;
    const grid = document.querySelector('.eva-grid[data-target="evaAntes"]');
    if (grid) grid.querySelectorAll('.eva-btn').forEach(b => b.classList.toggle('on', b.dataset.v === el.dataset.v));
    return;
  }
  if (t.closest('.btn-guardar-ses')) { guardarSesion(); return; }
  if ((el = t.closest('.sug-item'))) { document.getElementById('patologia').value = el.dataset.k; document.getElementById('seleccionActual').textContent = 'Seleccionada: ' + DB[el.dataset.k].nombre; listarSugerencias(); }
  if (t.closest('#wizardSiguiente')) { 
    if (!document.getElementById('idPaciente').value.trim() || !document.getElementById('patologia').value) { toast('Falta nombre o diagnóstico'); return; }
    document.getElementById('wizardPaso1').hidden = true; document.getElementById('wizardPaso2').hidden = false; 
  }
  if (t.closest('#wizardAtras')) { document.getElementById('wizardPaso1').hidden = false; document.getElementById('wizardPaso2').hidden = true; }
  if (t.closest('#guardar')) {
    const id = document.getElementById('idPaciente').value.trim(), pat = document.getElementById('patologia').value;
    if (!id || !pat) { toast('Faltan datos'); return; }
    registrarFicha('activo'); toast('Paciente guardado'); abrirPaciente(claveP(id, pat), 'hoy');
  }
  if (t.closest('#lgDemo')) { PROF = { nombre: 'Demo', hash: 'd' + '0'.repeat(31), demo: true }; activarPerfil(PROF); }
});

document.getElementById('login').addEventListener('click', function (e) {
  const t = e.target;
  if (t.closest('#lgEntrar')) intentarEntrar(false);
  else if (t.closest('#lgCrear')) intentarEntrar(true);
  else if (t.closest('.lg-chip')) { document.getElementById('lgNombre').value = t.closest('.lg-chip').dataset.n; document.getElementById('lgCodigo').focus(); }
});
document.getElementById('login').addEventListener('keydown', e => { if (e.key === 'Enter') intentarEntrar(false); });

// ===== Arranque =====
try { history.replaceState({ v: 'pacientes' }, '', '#pacientes'); } catch (e) { }
irVista('pacientes', true);
iniciarPerfil();
