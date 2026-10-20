// ⚠️ IMPORTANTE: PEGÁ TU URL DE GOOGLE APPS SCRIPT ACÁ ADENTRO DE LAS COMILLAS
let SHEET_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbw0wXt6wOG-J4Gg0nDoerkansRhu8fr5TX3Nr_AWkaCe5ZzLPH1SpJ6f0pwFF4VGNtx/exec"; 

let PROF = null;
let ultimoHistorial = [];
let sesionesCache = [];
let fichasMap = {};
let vistaActual = 'pacientes', modoConsulta = false, editando = false, claveActual = null, filtroPac = 'activos', tabActual = 'hoy';
const VISTAS = ['pacientes', 'nuevo', 'consulta', 'paciente', 'mas'];

// Variables del Cronómetro
let timerInterval = null, timerSeconds = 0;

function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])); }
function numONull(v) { if (v === '' || v === null || v === undefined) return null; const n = +v; return isNaN(n) ? null : n; }
function segundos(f) { const t = new Date(f).getTime(); return isNaN(t) ? 0 : Math.floor(t / 1000); }
function claveP(id, pat) { return norm(String(id || '').trim()) + '|' + pat; }

function toast(m, isError) {
  const t = document.getElementById('toast'); if (!t) return;
  t.textContent = m; t.className = 'toast show' + (isError ? ' error' : '');
  clearTimeout(toast._t); toast._t = setTimeout(() => { t.className = 'toast'; }, 3000);
}

function confeti(n) {
  const em = ['🎉', '✨', '💪', '🌟', '🎊', '🏆'], box = document.createElement('div');
  box.className = 'confeti'; box.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < (n || 26); i++) {
    const s = document.createElement('span'); s.textContent = em[i % em.length];
    s.style.left = (Math.random() * 100) + 'vw'; s.style.animationDelay = (Math.random() * .5) + 's';
    box.appendChild(s);
  }
  document.body.appendChild(box); setTimeout(() => box.remove(), 3000);
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
async function enviarOEncolar(reg) { 
  pintarPendientes('enviando');
  const ok = await enviarSheet(reg); 
  if (!ok) { const c = colaLeer(); c.push(reg); colaEscribir(c.slice(-3000)); } 
  else { pintarPendientes(); }
  return ok; 
}

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
      pintarPendientes();
    } catch (e) { if (status) status.textContent = 'Modo offline'; pintarPendientes(); }
  } else { if (status) status.textContent = 'Falta configurar URL'; }
  pintarHistorial();
}

function pintarPendientes(estado) {
  const n = PROF ? colaLeer().length : 0, pill = document.getElementById('syncPill'), txt = document.getElementById('syncTxt');
  if (!pill || !txt) return;
  if (estado === 'enviando') { pill.className = 'sync pending'; txt.textContent = 'Guardando...'; return; }
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
  initLocal().then(() => { pintarPendientes(); });
}

function iniciarPerfil() {
  let a = null; try { a = JSON.parse(localStorage.getItem('kine_perfil_activo') || 'null'); } catch (e) { }
  if (a && a.hash) activarPerfil(a); else mostrarLogin('');
}

document.getElementById('login').addEventListener('click', function (e) {
  if (e.target.closest('#lgEntrar')) intentarEntrar();
  if (e.target.closest('#lgDemo')) activarPerfil({ nombre: 'Demo', hash: 'd0000000000000000000000000000000', demo: true });
});

// --- NAVEGACIÓN ---
function irVista(v, noHist) {
  vistaActual = v;
  VISTAS.forEach(x => { const el = document.getElementById('v-' + x); if (el) el.hidden = (x !== v); });
  document.querySelectorAll('.bn').forEach(b => b.classList.toggle('on', b.dataset.go === (v === 'paciente' ? 'pacientes' : v)));
  const picker = document.getElementById('pickerCard');
  if (picker) {
      if (v === 'nuevo') document.getElementById('slotNuevo').appendChild(picker);
      if (v === 'consulta') document.getElementById('slotConsulta').appendChild(picker);
  }
  if (v === 'pacientes') pintarHistorial();
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

  if (!casos.length) { cont.innerHTML = '<div class="vacio" style="text-align:center; padding:40px; color:#666;"><b>No hay pacientes aún.</b><br><br>Toca el botón + para agregar uno.</div>'; return; }
  cont.innerHTML = casos.map(x => {
    const d = DB[x.p.patologia] || {nombre: x.p.patologia};
    return '<div class="pcard" onclick="abrirPaciente(\'' + x.clave + '\')"><div class="pc-top"><div class="pc-id"><div class="av">👤</div><div><div class="pc-nom">' + esc(x.p.idPaciente) + '</div><div class="pc-dx">' + esc(d.nombre) + '</div></div></div>' +
      '<div class="pc-side" style="font-size:12px; font-weight:bold; color:var(--primary);">' + x.ult + '/10</div></div>' +
      '<div class="prog" style="height:6px; background:#eee; border-radius:3px; margin-top:10px; overflow:hidden;"><i style="display:block; height:100%; background:var(--primary); width:' + (x.ult * 10) + '%"></i></div></div>';
  }).join('');
}

function limpiarForm() {
  ['idPaciente', 'buscador'].forEach(i => { const el = document.getElementById(i); if (el) el.value = ''; });
  document.getElementById('seleccionActual').textContent = 'Ninguna patología elegida';
  document.getElementById('wizardPaso1').hidden = false; document.getElementById('wizardPaso2').hidden = true;
  const sel = document.getElementById('patologia'); if(sel) sel.value = '';
  const sug = document.getElementById('sugerencias'); if(sug) sug.innerHTML = '';
}

function poblarSelects() {
  const selP = document.getElementById('patologia'), usados = {};
  if(!selP) return;
  selP.innerHTML = '<option value="">— elegir —</option>';
  Object.keys(ZONAS).forEach(z => {
    const g = document.createElement('optgroup'); g.label = z;
    ZONAS[z].forEach(k => { if (DB[k] && !usados[k]) { usados[k] = 1; const o = document.createElement('option'); o.value = k; o.textContent = DB[k].nombre; g.appendChild(o); } });
    if (g.children.length) selP.appendChild(g);
  });
}

window.seleccionarPatologia = function(k) {
   const sel = document.getElementById('patologia');
   sel.value = k; sel.dispatchEvent(new Event('change'));
   document.getElementById('sugerencias').innerHTML = ''; document.getElementById('buscador').value = DB[k].nombre;
};

document.getElementById('buscador')?.addEventListener('input', function() {
    const q = norm(this.value); const cont = document.getElementById('sugerencias'); if (!cont) return;
    if (!q) { cont.innerHTML = ''; return; }
    const res = Object.keys(DB).filter(k => norm(DB[k].nombre).indexOf(q) >= 0 || norm(k).indexOf(q) >= 0);
    cont.innerHTML = res.slice(0, 10).map(k => `<button type="button" class="chip" onclick="seleccionarPatologia('${k}')" style="margin:2px; display:inline-block;">${DB[k].nombre}</button>`).join('');
});

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
  const btn = document.getElementById('guardar');
  btn.disabled = true; btn.textContent = 'Guardando...';
  const id = document.getElementById('idPaciente').value.trim(), pat = document.getElementById('patologia').value;
  const p = conPerfil({ idPaciente: id, patologia: pat, fecha: new Date().toISOString(), estado: 'activo' });
  const arr = leerPacientesLS(); arr.unshift(p); escribirPacientesLS(arr); ultimoHistorial.unshift(p); reconstruirMapa();
  enviarOEncolar(p).then(() => {
    toast('Paciente guardado ✓'); 
    abrirPaciente(claveP(id, pat));
    btn.disabled = false; btn.textContent = 'Guardar y abrir paciente';
  });
});

window.abrirPaciente = function(clave) {
  if(timerInterval) { clearInterval(timerInterval); timerInterval = null; timerSeconds = 0; }
  claveActual = clave; const p = fichasMap[clave]; if (!p) return;
  document.getElementById('idPaciente').value = p.idPaciente; document.getElementById('patologia').value = p.patologia;
  renderPaciente('hoy'); irVista('paciente');
};

// --- CRONÓMETRO ---
window.toggleTimer = function() {
    const btn = document.getElementById('btnTimer');
    const display = document.getElementById('cronometro');
    if (timerInterval) {
        clearInterval(timerInterval); timerInterval = null; btn.textContent = 'Reanudar';
    } else {
        btn.textContent = 'Pausar';
        timerInterval = setInterval(() => {
            timerSeconds++;
            const m = Math.floor(timerSeconds / 60).toString().padStart(2, '0');
            const s = (timerSeconds % 60).toString().padStart(2, '0');
            if(display) display.textContent = m + ':' + s;
            if(timerSeconds === 2700) { toast('⏰ Han pasado 45 minutos.'); }
        }, 1000);
    }
};

// --- RENDERIZADO COMPLETO (AGENTES Y CRONÓMETRO) ---
function renderPaciente(tab) {
  const p = fichasMap[claveActual]; if (!p) return;
  const d = DB[p.patologia] || {nombre:p.patologia, agentes: []};
  const ss = sesionesDe(p.idPaciente, p.patologia);
  const ult = ss.length ? Math.max.apply(null, ss.map(s => s.sesion)) : 0;
  const n = Math.min(ult + 1, 10);
  const meta = SES_META[n - 1] || SES_META[9];

  document.getElementById('pacHeader').innerHTML = '<div class="ph-nom">' + esc(p.idPaciente) + '</div><div class="ph-dx">' + esc(d.nombre) + '</div>';

  // HOY
  let hHoy = '<div class="card"><h2>Sesión ' + n + ' de 10</h2>';
  
  const min = Math.floor(timerSeconds / 60).toString().padStart(2, '0');
  const sec = (timerSeconds % 60).toString().padStart(2, '0');
  hHoy += `<div style="display:flex; justify-content:space-between; align-items:center; background:var(--primary-soft); padding:10px; border-radius:8px; margin-bottom:15px;">
      <span style="font-weight:bold; color:var(--primary); font-size:13px;">⏱️ 40-60 min</span>
      <span id="cronometro" style="font-family:monospace; font-size:18px; font-weight:bold; color:var(--primary);">${min}:${sec}</span>
      <button type="button" onclick="toggleTimer()" id="btnTimer" style="padding:5px 10px; border-radius:5px; border:none; background:var(--primary); color:#fff; font-size:12px; cursor:pointer;">${timerInterval ? 'Pausar' : (timerSeconds > 0 ? 'Reanudar' : 'Iniciar')}</button>
  </div>`;

  hHoy += '<p style="font-size:13px; color:#666; margin-bottom:15px;"><b>Fase:</b> ' + meta.fase + ' | <b>Dosis:</b> ' + meta.dosis + '</p>';
  
  hHoy += '<h3 style="font-size:14px; color:var(--muted); margin-bottom:10px;">1. Ejercicios</h3>';
  meta.plan.forEach((item, idx) => {
    const tipo = item[0]; const arr = (d[tipo] && d[tipo].length) ? d[tipo] : [FILLER[tipo]];
    const ej = arr[item[1] % arr.length];
    hHoy += `<label class="chk-item">
      <input type="checkbox" class="chk-ejercicio" value="${esc(ej)}" checked>
      <div class="chk-box"></div>
      <div class="chk-text">
        <b>${esc(ej)}</b><br>
        <a href="https://www.youtube.com/results?search_query=ejercicio+kinesiologia+${encodeURIComponent(ej.split(',')[0])}" target="_blank" style="font-size:12px; color:var(--accent); text-decoration:none; display:inline-block; margin-top:4px;">▶ Ver video</a>
      </div>
    </label>`;
  });

  hHoy += '<h3 style="font-size:14px; color:var(--muted); margin-top:20px; margin-bottom:10px;">2. Agentes Físicos</h3>';
  if (d.agentes && d.agentes.length && typeof AGENTES !== 'undefined') {
      d.agentes.forEach(a => { 
          const ag = AGENTES[a];
          if(ag) hHoy += `<label class="chk-item"><input type="checkbox" class="chk-agente" value="${esc(ag.n)}" checked><div class="chk-box"></div><div class="chk-text"><b>${ag.n}</b><br><span style="font-size:12px; color:#666;">${ag.d}</span></div></label>`; 
      });
  } else { hHoy += '<p class="sub">No hay agentes específicos.</p>'; }

  hHoy += '<h3 style="font-size:14px; color:var(--muted); margin-top:20px; margin-bottom:10px;">3. Otros (Manual)</h3>';
  hHoy += '<div style="display:flex; gap:8px; margin-bottom:10px;"><input type="text" id="manualEjercicio" placeholder="Agregar ejercicio o nota..." style="flex:1; font-size:14px;"><button type="button" onclick="agregarManual()" class="btn-sec" style="width:auto; padding:0 15px; margin:0; font-size:20px;">+</button></div>';
  hHoy += '<div id="listaManuales"></div>';

  hHoy += '<h3 style="font-size:14px; color:var(--muted); margin-top:20px; margin-bottom:10px;">4. Dolor (EVA)</h3>';
  hHoy += '<div class="grid2"><div class="eva-container"><label style="text-align:center;">Reposo</label><div class="eva-value" id="valReposo" style="color:var(--success)">0</div><input type="range" id="evaReposo" min="0" max="10" value="0" class="eva-slider" oninput="updateEva('Reposo', this.value)"></div>';
  hHoy += '<div class="eva-container"><label style="text-align:center;">Movimiento</label><div class="eva-value" id="valMovimiento" style="color:var(--success)">0</div><input type="range" id="evaMovimiento" min="0" max="10" value="0" class="eva-slider" oninput="updateEva('Movimiento', this.value)"></div></div>';
  
  hHoy += '<label style="margin-top:15px;">Notas de la sesión</label><textarea id="notaSesion" rows="2"></textarea>';
  hHoy += '<button class="btn-main" id="btnGuardarSesion" onclick="guardarSesion(' + n + ')" style="margin-top:15px;">Guardar Sesión ' + n + '</button></div>';
  
  document.getElementById('tabHoy').innerHTML = hHoy;

  // EVALUACIÓN
  let hEval = '<div class="card"><h2>Test Principal</h2><p style="font-size:15px;"><b>' + (d.testN || '-') + '</b><br><span class="sub">' + (d.testD || '') + '</span></p>';
  hEval += '<a href="https://www.youtube.com/results?search_query=test+kinesiologia+' + encodeURIComponent(d.testN) + '" target="_blank" class="btn-sec" style="display:block; margin-top:15px; text-decoration:none;">▶ Ver video del test</a></div>';
  
  if(d.aviso) hEval += '<div class="card" style="border-left-color:#b91c1c;"><h2 style="color:#b91c1c;">⚠ Precauciones</h2><p style="color:#b91c1c; font-size:14px;">' + d.aviso + '</p></div>';

  if(d.agentes && d.agentes.length && typeof AGENTES !== 'undefined') {
      hEval += '<div class="card"><h2>Agentes Físicos</h2>';
      d.agentes.forEach(a => { const ag = AGENTES[a]; if(ag) hEval += `<div style="margin-bottom:12px; padding-bottom:12px; border-bottom:1px solid #eee;"><b style="color:var(--primary);">${ag.n}</b><br><span style="font-size:13px; color:#666;">${ag.d}</span></div>`; });
      hEval += '</div>';
  }
  document.getElementById('tabEval').innerHTML = hEval;

  // EVOLUCIÓN
  let hEvol = '<div class="card"><h2>Evolución del Dolor</h2>';
  if(!ss.length) hEvol += '<p class="sub">No hay sesiones registradas.</p>';
  else {
      hEvol += '<table style="width:100%; border-collapse:collapse; font-size:14px;"><tr style="border-bottom:2px solid var(--line); text-align:left;"><th>Sesión</th><th>Reposo</th><th>Movimiento</th></tr>';
      ss.forEach(s => { 
          const cR = s.evaReposo <= 3 ? 'var(--success)' : s.evaReposo <= 6 ? 'var(--warning)' : 'var(--danger)';
          const cM = s.evaMovimiento <= 3 ? 'var(--success)' : s.evaMovimiento <= 6 ? 'var(--warning)' : 'var(--danger)';
          hEvol += `<tr style="border-bottom:1px solid var(--line);"><td style="padding:10px 0;"><b>${s.sesion}</b> <span style="font-size:11px; color:#888;">(${new Date(s.fecha).toLocaleDateString()})</span></td><td style="color:${cR}; font-weight:bold;">${s.evaReposo != null ? s.evaReposo : '-'}</td><td style="color:${cM}; font-weight:bold;">${s.evaMovimiento != null ? s.evaMovimiento : '-'}</td></tr>`; 
      });
      hEvol += '</table>';
  }
  hEvol += '</div>';
  document.getElementById('tabEvol').innerHTML = hEvol;

  // PLAN
  let hPlan = '<div class="card"><h2>Plan de 10 Sesiones</h2><ul style="padding-left:20px; line-height:1.8; font-size:14px;">';
  SES_META.forEach((m, i) => { hPlan += `<li style="margin-bottom:8px;"><b>Sesión ${i+1}:</b> ${m.fase}</li>`; });
  hPlan += '</ul></div>';
  document.getElementById('tabPlan').innerHTML = hPlan;

  // REFERENCIAS
  let hRef = '<div class="card"><h2>Evidencia Científica</h2>';
  if(typeof EVIDENCIA !== 'undefined' && EVIDENCIA[p.patologia] && EVIDENCIA[p.patologia].r.length) {
      hRef += '<ul style="padding-left:20px; font-size:14px; line-height:1.5;">';
      EVIDENCIA[p.patologia].r.forEach(ref => { hRef += `<li style="margin-bottom:12px;">${ref.c}<br><a href="${ref.u}" target="_blank" style="font-size:12px; color:var(--accent);">Ver fuente en PubMed</a></li>`; });
      hRef += '</ul>';
  } else { hRef += '<p class="sub">No hay referencias guardadas para esta patología.</p>'; }
  hRef += '</div>';
  document.getElementById('tabRef').innerHTML = hRef;

  document.querySelectorAll('#tabsPac .tab').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  ['hoy','evol','eval','plan','ref'].forEach(t => { const el = document.getElementById('tab' + t.charAt(0).toUpperCase() + t.slice(1)); if (el) el.hidden = (t !== tab); });
}

window.updateEva = function(tipo, valor) {
    const v = parseInt(valor);
    const el = document.getElementById('val' + tipo);
    el.textContent = v;
    if(v <= 3) el.style.color = 'var(--success)';
    else if(v <= 6) el.style.color = 'var(--warning)';
    else el.style.color = 'var(--danger)';
};

window.agregarManual = function() {
    const input = document.getElementById('manualEjercicio');
    const text = input.value.trim();
    if(!text) return;
    const div = document.createElement('div');
    div.innerHTML = `<label class="chk-item"><input type="checkbox" class="chk-manual" value="${esc(text)}" checked><div class="chk-box"></div><div class="chk-text">${esc(text)}</div></label>`;
    document.getElementById('listaManuales').appendChild(div);
    input.value = ''; input.focus();
};

window.guardarSesion = function(n) {
  const btn = document.getElementById('btnGuardarSesion');
  btn.disabled = true; btn.textContent = 'Guardando...';

  const id = document.getElementById('idPaciente').value, pat = document.getElementById('patologia').value;
  const rep = numONull(document.getElementById('evaReposo').value), mov = numONull(document.getElementById('evaMovimiento').value);
  const notas = document.getElementById('notaSesion').value;
  
  const ejs = [...document.querySelectorAll('.chk-ejercicio:checked')].map(i => i.value);
  const ags = [...document.querySelectorAll('.chk-agente:checked')].map(i => i.value);
  const mans = [...document.querySelectorAll('.chk-manual:checked')].map(i => i.value);
  const hechos = ejs.concat(ags, mans);

  const reg = conPerfil(normSesion({ idPaciente: id, patologia: pat, sesion: +n, fecha: new Date().toISOString(), evaReposo: rep, evaMovimiento: mov, notas: notas, hechos: hechos }));
  const arr = leerSesLS().filter(s => !(s.clave === reg.clave && s.sesion === reg.sesion)); arr.push(reg); escribirSesLS(arr);
  sesionesCache = mezclarSesiones(sesionesCache, [reg]); 
  
  enviarOEncolar(reg).then(() => {
      toast('Sesión ' + n + ' guardada ✓'); 
      if(n === 10) confeti();
      if(timerInterval) { clearInterval(timerInterval); timerInterval = null; timerSeconds = 0; }
      renderPaciente('hoy');
  });
};

// --- CONSULTA RÁPIDA (ARREGLADA) ---
function abrirConsulta(k) {
  if(timerInterval) { clearInterval(timerInterval); timerInterval = null; timerSeconds = 0; }
  const d = DB[k]; if(!d) return;
  
  document.getElementById('pacHeader').innerHTML = '<div class="ph-nom">Consulta Rápida</div><div class="ph-dx">' + esc(d.nombre) + '</div><button class="btn-sec" onclick="irVista(\'consulta\')" style="margin-top:10px; padding:8px;">← Volver a buscar</button>';
  
  let hEval = '<div class="card"><h2>Test Principal</h2><p style="font-size:15px;"><b>' + (d.testN || '-') + '</b><br><span class="sub">' + (d.testD || '') + '</span></p>';
  hEval += '<a href="https://www.youtube.com/results?search_query=test+kinesiologia+' + encodeURIComponent(d.testN) + '" target="_blank" class="btn-sec" style="display:block; margin-top:15px; text-decoration:none;">▶ Ver video del test</a></div>';
  
  if(d.aviso) hEval += '<div class="card" style="border-left-color:#b91c1c;"><h2 style="color:#b91c1c;">⚠ Precauciones</h2><p style="color:#b91c1c; font-size:14px;">' + d.aviso + '</p></div>';

  if(d.agentes && d.agentes.length && typeof AGENTES !== 'undefined') {
      hEval += '<div class="card"><h2>Agentes Físicos</h2>';
      d.agentes.forEach(a => { const ag = AGENTES[a]; if(ag) hEval += `<div style="margin-bottom:12px; padding-bottom:12px; border-bottom:1px solid #eee;"><b style="color:var(--primary);">${ag.n}</b><br><span style="font-size:13px; color:#666;">${ag.d}</span></div>`; });
      hEval += '</div>';
  }
  
  document.getElementById('tabEval').innerHTML = hEval;
  ['hoy','evol','eval','plan','ref'].forEach(t => { const el = document.getElementById('tab' + t.charAt(0).toUpperCase() + t.slice(1)); if (el) el.hidden = (t !== 'eval'); });
  document.querySelectorAll('#tabsPac .tab').forEach(b => b.classList.toggle('on', b.dataset.tab === 'eval'));
  irVista('paciente');
}

document.querySelectorAll('#tabsPac .tab').forEach(b => b.addEventListener('click', () => renderPaciente(b.dataset.tab)));

document.addEventListener('DOMContentLoaded', () => {
  if (typeof DB === 'undefined' || typeof AGENTES === 'undefined' || typeof ZONAS === 'undefined') {
      document.body.innerHTML = '<div style="padding:20px; text-align:center; font-family:sans-serif;"><h1>Error de carga</h1><p>Faltan archivos de datos. Asegúrate de haber subido correctamente las carpetas <b>data/</b> con sus archivos .js.</p></div>';
      return;
  }
  poblarSelects();
  iniciarPerfil();
});
