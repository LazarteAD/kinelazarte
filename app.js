// ============================================================
// KINEFLOW CLINICAL - Lógica Principal (Elite Center + Legado)
// ============================================================

const API_URL = "https://script.google.com/macros/s/AKfycbwb1fgBpCvnFNdbRhAlDyAThE83EhQ3V8Xkw7GkObnKBiChLnM7mf8xslfERckp9I7z/exec"; // ⚠️ PEGÁ TU URL /exec

let chartInstance = null;
let calendar = null;

let state = {
  user: null, patients: [], currentPatient: null, turnos: [],
  currentSession: { n: 1, patologia: "", sessionTime: 50, consultorio: [], casa: [], agentes: [], eva_reposo: 0, eva_activo: 0, eva_pasivo: 0, notas: "", zonasDolor: [] }
};

// Catálogos base (se cargan desde data/patologias.js)
let DB_EXTENDED = {};
let PATOLOGIAS_PERSONALIZADAS = {};
let EJERCICIOS_PERSONALIZADOS = {};

const TIEMPOS_AGENTES = { calor: 15, frio: 10, tens: 20, magneto: 20, us: 8, manual: 15 };
const ZONAS_PATOLOGIA = {
  lumbalgia: "zone-lumbar", ciatica: "zone-lumbar", hernia_lumbar: "zone-lumbar",
  cervicalgia: "zone-cuello", hombro_manguito: "zone-hombro-izq",
  capsulitis: "zone-hombro-izq", epicondilitis: "zone-codo-izq",
  tunel_carpiano: "zone-muneca-izq", gonartrosis: "zone-rodilla-izq",
  lca: "zone-rodilla-izq", esguince_tobillo: "zone-tobillo-izq", fascitis: "zone-tobillo-izq"
};

const ZONAS = {
  lumbar: ["lumbalgia", "ciatica", "hernia_lumbar", "estenosis_lumbar", "facetario"],
  cervical: ["cervicalgia", "hernia_cervical", "cefalea_cervicogenica", "latigazo"],
  hombro: ["hombro_manguito", "capsulitis", "inestabilidad_hombro", "acromioclavicular"],
  codo: ["epicondilitis", "epitrocleitis", "tunel_cubital"],
  muneca: ["tunel_carpiano", "dequervain", "fractura_radio_distal"],
  cadera: ["cadera", "bursitis_trocanterea", "gluteo_medio", "pubalgia"],
  rodilla: ["gonartrosis", "lca", "menisco", "patelofemoral", "itb"],
  tobillo: ["esguince_tobillo", "aquiles", "fascitis", "metatarsalgia"]
};

// ============ INIT ============
document.addEventListener('DOMContentLoaded', () => {
  // Fusionar catálogos base con personalizados
  DB_EXTENDED = Object.assign({}, DB);
  cargarPersonalizados();
  showView('login-view');
  checkPendingSync();
});

function cargarPersonalizados() {
  try {
    PATOLOGIAS_PERSONALIZADAS = JSON.parse(localStorage.getItem('kf_patologias_custom') || '{}');
    EJERCICIOS_PERSONALIZADOS = JSON.parse(localStorage.getItem('kf_ejercicios_custom') || '{}');
    
    // Fusionar patologías personalizadas en DB_EXTENDED
    Object.assign(DB_EXTENDED, PATOLOGIAS_PERSONALIZADAS);
    
    // Fusionar ejercicios personalizados en las patologías correspondientes
    Object.keys(EJERCICIOS_PERSONALIZADOS).forEach(pat => {
      if (DB_EXTENDED[pat]) {
        if (!DB_EXTENDED[pat].ejercicios) DB_EXTENDED[pat].ejercicios = {};
        Object.keys(EJERCICIOS_PERSONALIZADOS[pat]).forEach(tipo => {
          if (!DB_EXTENDED[pat].ejercicios[tipo]) DB_EXTENDED[pat].ejercicios[tipo] = [];
          DB_EXTENDED[pat].ejercicios[tipo] = DB_EXTENDED[pat].ejercicios[tipo].concat(EJERCICIOS_PERSONALIZADOS[pat][tipo]);
        });
      }
    });
  } catch (e) { console.error('Error cargando personalizados', e); }
}

// ============ AUTH ============
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function login() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();
  if (!email || !password) return showToast('Completa email y contraseña', true);
  
  const hash = await hashPassword(password);
  const storedHash = localStorage.getItem('kf_auth_' + email);
  
  if (storedHash && storedHash !== hash) return showToast('Contraseña incorrecta', true);
  if (!storedHash) localStorage.setItem('kf_auth_' + email, hash);
  
  state.user = { email };
  const localP = localStorage.getItem('kf_patients_' + email);
  if (localP) state.patients = JSON.parse(localP);
  const localT = localStorage.getItem('kf_turnos_' + email);
  if (localT) state.turnos = JSON.parse(localT);
  
  // Cargar perfil profesional
  const prof = JSON.parse(localStorage.getItem('kf_perfil_' + email) || '{}');
  document.getElementById('prof-name').value = prof.nombre || '';
  document.getElementById('prof-matricula').value = prof.matricula || '';
  
  showView('dashboard-view');
  renderPatientList();
  renderAgendaHoy();
  syncPendingData();
  haptic(20);
}

function saveProfile() {
  const nombre = document.getElementById('prof-name').value.trim();
  const matricula = document.getElementById('prof-matricula').value.trim();
  localStorage.setItem('kf_perfil_' + state.user.email, JSON.stringify({ nombre, matricula }));
  showToast('Perfil guardado');
}

// ============ PACIENTES Y AGENDA ============
function generarNumeroPaciente() {
  const maxNum = state.patients.reduce((max, p) => {
    const num = parseInt(p.numero?.replace('PAC-', '') || '0');
    return num > max ? num : max;
  }, 0);
  return 'PAC-' + String(maxNum + 1).padStart(3, '0');
}

function renderAgendaHoy() {
  const list = document.getElementById('agenda-hoy-list');
  if (!list) return;
  const hoy = new Date().toDateString();
  const turnosHoy = state.turnos.filter(t => new Date(t.start).toDateString() === hoy).sort((a,b) => new Date(a.start) - new Date(b.start));
  
  if (turnosHoy.length === 0) {
    list.innerHTML = `<p class="sub" style="margin:0;">No tenés turnos agendados para hoy.</p>`;
    return;
  }
  list.innerHTML = turnosHoy.map(t => {
    const hora = new Date(t.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    return `<div class="agenda-item"><span class="hora">${hora}</span><span style="flex:1; font-weight:600;">${t.title}</span></div>`;
  }).join('');
}

function filtrarPatologiasPorZona() {
  const zona = document.getElementById('new-patient-zona').value;
  const selectPat = document.getElementById('new-patient-pathology');
  selectPat.innerHTML = '<option value="">— Elegir patología —</option>';
  
  let patologiasAMostrar = [];
  if (zona && ZONAS[zona]) {
    patologiasAMostrar = ZONAS[zona].filter(k => DB_EXTENDED[k]);
  } else {
    patologiasAMostrar = Object.keys(DB_EXTENDED);
  }
  
  patologiasAMostrar.forEach(k => {
    const option = document.createElement('option');
    option.value = k;
    option.textContent = DB_EXTENDED[k].nombre;
    selectPat.appendChild(option);
  });
}

function createPatient() {
  const name = document.getElementById('new-patient-name').value.trim();
  const phone = document.getElementById('new-patient-phone').value.trim();
  const age = document.getElementById('new-patient-age').value;
  const weight = document.getElementById('new-patient-weight').value;
  const activity = document.getElementById('new-patient-activity').value;
  const anamnesis = document.getElementById('new-patient-anamnesis').value.trim();
  const meds = document.getElementById('new-patient-meds').value.trim();
  const patologia = document.getElementById('new-patient-pathology').value;
  const turnoDateTime = document.getElementById('new-patient-turno').value;
  
  const redFlags = [...document.querySelectorAll('.red-flag:checked')].map(c => c.value);
  const yellowFlags = [...document.querySelectorAll('.yellow-flag:checked')].map(c => c.value);
  const blueFlags = [...document.querySelectorAll('.blue-flag:checked')].map(c => c.value);
  const blackFlags = [...document.querySelectorAll('.black-flag:checked')].map(c => c.value);

  if (!name || !phone) return showToast('Completa nombre y teléfono', true);
  if (!patologia) return showToast('Elegí una patología', true);
  
  const numero = generarNumeroPaciente();
  const newPatient = {
    numero, nombre: name, telefono: phone, edad: age, peso: weight,
    nivelActividad: activity, anamnesis, medicacionTexto: meds,
    banderasRojas: redFlags, banderasAmarillas: yellowFlags,
    banderasAzules: blueFlags, banderasNegras: blackFlags,
    patologias: [patologia], sesionesCompletadas: { [patologia]: 0 }, historial: { [patologia]: [] }
  };
  
  state.patients.push(newPatient);
  localStorage.setItem('kf_patients_' + state.user.email, JSON.stringify(state.patients));
  
  if (turnoDateTime) {
    const turno = {
      id: 't_' + Date.now().toString(),
      title: name,
      start: turnoDateTime,
      end: new Date(new Date(turnoDateTime).getTime() + 60*60*1000).toISOString()
    };
    state.turnos.push(turno);
    localStorage.setItem('kf_turnos_' + state.user.email, JSON.stringify(state.turnos));
    queueForSync('saveTurno', turno);
  }

  // Limpiar form
  document.getElementById('new-patient-name').value = '';
  document.getElementById('new-patient-phone').value = '';
  document.getElementById('new-patient-anamnesis').value = '';
  document.getElementById('new-patient-meds').value = '';
  document.getElementById('new-patient-turno').value = '';
  document.getElementById('new-patient-zona').value = '';
  document.querySelectorAll('.red-flag, .yellow-flag, .blue-flag, .black-flag').forEach(c => c.checked = false);
  
  showView('dashboard-view');
  renderPatientList();
  renderAgendaHoy();
  showToast(`✅ ${numero} creado`);
  haptic([30, 50, 30]);
}

function renderPatientList() {
  const list = document.getElementById('patient-list');
  if (state.patients.length === 0) {
    list.innerHTML = `<p style="text-align:center; color:var(--text-muted); margin-top:2rem;">No hay pacientes. ¡Toca "+ Nuevo Paciente"!</p>`;
    return;
  }
  list.innerHTML = state.patients.map((p, index) => {
    const numPats = (p.patologias || []).length;
    return `<div class="patient-card card glass" onclick="abrirPaciente(${index})">
      <div class="patient-avatar">${p.nombre.charAt(0).toUpperCase()}</div>
      <div class="patient-info" style="flex:1;">
        <h3>${p.numero} - ${p.nombre}</h3>
        <p>${numPats} patología(s) · ${p.edad} años</p>
      </div>
      <button onclick="event.stopPropagation(); eliminarPaciente(${index})" class="btn-delete">🗑️</button>
    </div>`;
  }).join('');
}

function abrirPaciente(index) {
  state.currentPatient = state.patients[index];
  if (!state.currentPatient.patologias || state.currentPatient.patologias.length === 0) agregarPatologia();
  else mostrarPatologiasPaciente();
}

function mostrarPatologiasPaciente() {
  const p = state.currentPatient;
  document.getElementById('dashboard-view').classList.add('hidden');
  let html = `<div class="view">
    <div class="header-actions"><h2>${p.numero} - ${p.nombre}</h2><button onclick="showView('dashboard-view'); renderPatientList(); renderAgendaHoy();" class="btn-text">← Volver</button></div>
    <div class="card glass">
      <div class="anamnesis-card card glass">
        <h3>📋 Anamnesis</h3>
        <p style="font-style:italic;">"${p.anamnesis || 'Sin anamnesis'}"</p>
        ${p.medicacionTexto ? `<div class="meds-box"><b>💊 ${p.medicacionTexto}</b></div>` : ''}
      </div>
      <h3 style="margin-top:20px;">Patologías</h3>`;
      
  if (p.patologias.length === 0) html += `<p class="sub">No hay patologías.</p>`;
  else html += p.patologias.map(pat => {
    const completadas = parseInt((p.sesionesCompletadas && p.sesionesCompletadas[pat]) || 0, 10);
    return `<div style="padding:12px; background:rgba(255,255,255,0.4); border-radius:10px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
      <div style="flex:1;">
        <b>${DB_EXTENDED[pat] ? DB_EXTENDED[pat].nombre : pat}</b>
        <p style="font-size:0.8rem; color:var(--text-muted); margin:4px 0 0;">Sesión ${completadas}/10</p>
      </div>
      <button onclick="iniciarSesion('${pat}')" class="btn-primary" style="width:auto; padding:8px 14px; font-size:0.85rem;">Iniciar</button>
      <button onclick="eliminarPatologia('${pat}')" class="btn-delete" style="font-size:0.9rem; margin-left:8px;">🗑️</button>
    </div>`;
  }).join('');
  
  html += `<button onclick="agregarPatologia()" class="btn-secondary mt-2">+ Agregar otra patología</button></div></div>`;
  const temp = document.createElement('div');
  temp.innerHTML = html;
  document.body.appendChild(temp);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function agregarPatologia() {
  const p = state.currentPatient;
  const patologiasDisponibles = Object.keys(DB_EXTENDED).filter(k => !(p.patologias || []).includes(k));
  let opciones = patologiasDisponibles.map(k => `<option value="${k}">${DB_EXTENDED[k].nombre}</option>`).join('');
  let html = `<div class="view"><div class="header-actions"><h2>Agregar Patología</h2><button onclick="showView('dashboard-view'); renderPatientList(); renderAgendaHoy();" class="btn-text">Cancelar</button></div><div class="card glass"><label>Patología</label><select id="nueva-patologia">${opciones}</select><button onclick="confirmarPatologia()" class="btn-primary mt-2">Agregar</button><button onclick="crearPatologiaPersonalizada()" class="btn-secondary mt-1">+ Crear Patología Personalizada</button></div></div>`;
  const temp = document.createElement('div');
  temp.innerHTML = html;
  document.body.appendChild(temp);
}

function confirmarPatologia() {
  const pat = document.getElementById('nueva-patologia').value;
  const p = state.currentPatient;
  if (!p.patologias) p.patologias = [];
  if (!p.sesionesCompletadas) p.sesionesCompletadas = {};
  if (!p.historial) p.historial = {};
  
  if (!p.patologias.includes(pat)) {
    p.patologias.push(pat);
    p.sesionesCompletadas[pat] = 0;
    p.historial[pat] = [];
  }
  
  localStorage.setItem('kf_patients_' + state.user.email, JSON.stringify(state.patients));
  document.body.lastChild.remove();
  showView('dashboard-view');
  renderPatientList();
  renderAgendaHoy();
  showToast('Patología agregada');
  haptic(20);
}

function crearPatologiaPersonalizada() {
  const nombre = prompt('Nombre de la nueva patología:');
  if (!nombre || !nombre.trim()) return;
  
  const key = 'custom_' + Date.now();
  PATOLOGIAS_PERSONALIZADAS[key] = {
    nombre: nombre.trim(),
    test: "Test clínico personalizado",
    bib: "Bibliografía personalizada",
    agentes: [],
    ejercicios: { consultorio: [], casa: [] }
  };
  
  localStorage.setItem('kf_patologias_custom', JSON.stringify(PATOLOGIAS_PERSONALIZADAS));
  DB_EXTENDED[key] = PATOLOGIAS_PERSONALIZADAS[key];
  
  // Recargar el selector
  const p = state.currentPatient;
  p.patologias.push(key);
  p.sesionesCompletadas[key] = 0;
  p.historial[key] = [];
  localStorage.setItem('kf_patients_' + state.user.email, JSON.stringify(state.patients));
  
  document.body.lastChild.remove();
  mostrarPatologiasPaciente();
  showToast('Patología personalizada creada');
}

function eliminarPatologia(pat) {
  if (!confirm(`¿Eliminar ${DB_EXTENDED[pat] ? DB_EXTENDED[pat].nombre : pat}?`)) return;
  const p = state.currentPatient;
  p.patologias = p.patologias.filter(x => x !== pat);
  delete p.sesionesCompletadas[pat];
  delete p.historial[pat];
  localStorage.setItem('kf_patients_' + state.user.email, JSON.stringify(state.patients));
  document.body.lastChild.remove();
  mostrarPatologiasPaciente();
}

// ============ MAPA CORPORAL ============
function toggleZone(zoneId) {
  const el = document.getElementById(zoneId);
  if (!el) return;
  el.classList.toggle('active');
  haptic(15);
  
  if (!state.currentSession.zonasDolor) state.currentSession.zonasDolor = [];
  
  if (el.classList.contains('active')) {
    if (!state.currentSession.zonasDolor.includes(zoneId)) state.currentSession.zonasDolor.push(zoneId);
  } else {
    state.currentSession.zonasDolor = state.currentSession.zonasDolor.filter(z => z !== zoneId);
  }
  actualizarResumenZonas();
}

function actualizarResumenZonas() {
  const el = document.getElementById('pain-zones-summary');
  if (!el) return;
  const count = (state.currentSession.zonasDolor || []).length;
  if (count === 0) {
    el.textContent = 'Sin zonas marcadas';
    el.style.color = 'var(--text-muted)';
  } else {
    el.textContent = `✅ ${count} zona(s) marcada(s)`;
    el.style.color = 'var(--accent-danger)';
  }
}

// ============ SESIÓN Y TERAPIA ============
function iniciarSesion(pat) {
  const p = state.currentPatient;
  const patData = DB_EXTENDED[pat];
  const completadas = parseInt((p.sesionesCompletadas && p.sesionesCompletadas[pat]) || 0, 10);
  
  state.currentSession = { 
    n: completadas + 1, 
    patologia: pat, 
    sessionTime: 50,
    consultorio: [], 
    casa: [], 
    agentes: [], 
    eva_reposo: 0, 
    eva_activo: 0,
    eva_pasivo: 0,
    notas: "", 
    zonasDolor: [] 
  };
  
  document.body.querySelectorAll('.view').forEach(v => {
    if (v !== document.getElementById('dashboard-view') && v !== document.getElementById('session-view')) v.remove();
  });
  
  document.getElementById('session-patient-name').textContent = `${p.numero} - ${p.nombre}`;
  document.getElementById('anamnesis-resumen').textContent = `"${p.anamnesis || 'Sin anamnesis'}"`;
  document.getElementById('meds-resumen').innerHTML = p.medicacionTexto ? `<b>💊 ${p.medicacionTexto}</b>` : 'Sin medicación registrada';
  
  document.getElementById('test-nombre').textContent = patData.test || 'Test clínico';
  document.getElementById('test-descripcion').textContent = patData.bib || 'Bibliografía';
  
  let flagsHTML = '';
  if (p.banderasRojas && p.banderasRojas.length > 0) flagsHTML += `<div class="alert red">🚩 Banderas Rojas: ${p.banderasRojas.join(', ')}</div>`;
  if (p.banderasAmarillas && p.banderasAmarillas.length > 0) flagsHTML += `<div class="alert yellow">🟡 Banderas Amarillas: ${p.banderasAmarillas.join(', ')}</div>`;
  if (p.banderasAzules && p.banderasAzules.length > 0) flagsHTML += `<div class="alert blue" style="background:rgba(42,122,176,0.1); border-left:4px solid #2a7ab0;">🔵 Banderas Azules: ${p.banderasAzules.join(', ')}</div>`;
  if (p.banderasNegras && p.banderasNegras.length > 0) flagsHTML += `<div class="alert black" style="background:rgba(30,41,59,0.1); border-left:4px solid #1e293b;">⚫ Banderas Negras: ${p.banderasNegras.join(', ')}</div>`;
  document.getElementById('flags-alert').innerHTML = flagsHTML;

  if (p.medicacionTexto) {
    const farmaco = buscarFarmaco(p.medicacionTexto);
    document.getElementById('farmaco-alert').innerHTML = farmaco ? `<div class="alert red">⚠️ <b>Alerta Farmacológica:</b> ${farmaco.riesgo}</div>` : '';
  }

  // Catálogo de Ejercicios
  const catContainer = document.getElementById('catalogo-ejercicios');
  catContainer.innerHTML = '';
  if (patData.ejercicios) {
    let todos = [];
    for (const tipo in patData.ejercicios) todos = todos.concat(patData.ejercicios[tipo]);
    todos.forEach(ejercicio => {
      const div = document.createElement('div');
      div.className = 'catalogo-item';
      const nombreSeguro = ejercicio.nombre.replace(/'/g, "\\'");
      div.innerHTML = `
        <div class="info">
          <b>${ejercicio.nombre}</b>
          <small>${ejercicio.series} series × ${ejercicio.reps} reps · ${ejercicio.tiempo}</small>
        </div>
        <button class="btn-add" onclick="addEjercicioByName('${nombreSeguro}')">+</button>
      `;
      catContainer.appendChild(div);
    });
  }

  // Agentes Físicos
  const agentContainer = document.getElementById('agents-list');
  agentContainer.innerHTML = '';
  if (patData.agentes) {
    patData.agentes.forEach(agentKey => {
      const agent = AGENTES[agentKey];
      if (!agent) return;
      const isContra = agent.contra && p.banderasRojas && agent.contra.some(c => p.banderasRojas.includes(c));
      const div = document.createElement('label');
      div.className = 'agent-checkbox';
      div.innerHTML = `
        <input type="checkbox" ${isContra ? 'disabled' : ''} onchange="toggleAgent('${agent.nombre}', this.checked, '${agentKey}')">
        <div>
          <b>${agent.nombre}</b><br>
          <small style="color:var(--text-muted);">${agent.dosis}</small>
          ${isContra ? `<br><span style="color:var(--accent-danger); font-size:0.75rem; font-weight:bold;">⚠️ Contraindicado</span>` : ''}
        </div>
      `;
      agentContainer.appendChild(div);
    });
  }

  // Plan de 10 sesiones
  document.getElementById('lista-sesiones').innerHTML = SESIONES_PLAN.map(s => {
    let estado = s.n <= completadas ? '✅' : (s.n === completadas + 1 ? '▶️' : '🔒');
    let clase = s.n <= completadas ? 'completed' : (s.n > completadas + 1 ? 'locked' : 'current');
    return `<div class="session-plan-item ${clase}"><span>${estado} <b>Sesión ${s.n}:</b> ${s.fase}</span></div>`;
  }).join('');
  
  document.querySelectorAll('.timer-chip').forEach(c => c.classList.remove('active'));
  document.querySelector('.timer-chip[data-time="50"]').classList.add('active');
  calcularTiempoTotal();
  document.getElementById('selected-exercises-list').innerHTML = '';

  showView('session-view');
  switchTab('paciente', document.querySelectorAll('.tab-btn')[0]);
  renderEvidencia(pat);
  renderBibliografia();
}

function addEjercicioByName(nombre) {
  const patData = DB_EXTENDED[state.currentSession.patologia];
  let todos = [];
  for (const tipo in patData.ejercicios) todos = todos.concat(patData.ejercicios[tipo]);
  const ejercicio = todos.find(e => e.nombre === nombre);
  
  if (ejercicio && !state.currentSession.consultorio.find(e => e.nombre === nombre)) {
    state.currentSession.consultorio.push(ejercicio);
    renderSelectedExercises();
    calcularTiempoTotal();
    haptic(15);
  }
}

function agregarEjercicioPersonalizado() {
  const nombre = prompt('Nombre del ejercicio personalizado:');
  if (!nombre || !nombre.trim()) return;
  const series = parseInt(prompt('Series:', '3')) || 3;
  const reps = parseInt(prompt('Repeticiones:', '10')) || 10;
  const tiempo = prompt('Tiempo (ej: 5 min):', '5 min') || '5 min';
  
  const ejercicio = { nombre: nombre.trim(), series, reps, tiempo, descanso: '45s' };
  
  // Guardar en personalizados
  const pat = state.currentSession.patologia;
  if (!EJERCICIOS_PERSONALIZADOS[pat]) EJERCICIOS_PERSONALIZADOS[pat] = { consultorio: [] };
  if (!EJERCICIOS_PERSONALIZADOS[pat].consultorio) EJERCICIOS_PERSONALIZADOS[pat].consultorio = [];
  EJERCICIOS_PERSONALIZADOS[pat].consultorio.push(ejercicio);
  localStorage.setItem('kf_ejercicios_custom', JSON.stringify(EJERCICIOS_PERSONALIZADOS));
  
  // Agregar a DB_EXTENDED
  if (!DB_EXTENDED[pat].ejercicios) DB_EXTENDED[pat].ejercicios = {};
  if (!DB_EXTENDED[pat].ejercicios.consultorio) DB_EXTENDED[pat].ejercicios.consultorio = [];
  DB_EXTENDED[pat].ejercicios.consultorio.push(ejercicio);
  
  // Recargar catálogo y agregar a la sesión
  addEjercicioByName(ejercicio.nombre);
  
  // Recargar la vista de terapia para mostrar el nuevo ejercicio en el catálogo
  const catContainer = document.getElementById('catalogo-ejercicios');
  const div = document.createElement('div');
  div.className = 'catalogo-item';
  const nombreSeguro = ejercicio.nombre.replace(/'/g, "\\'");
  div.innerHTML = `
    <div class="info">
      <b>${ejercicio.nombre}</b>
      <small>${ejercicio.series} series × ${ejercicio.reps} reps · ${ejercicio.tiempo}</small>
    </div>
    <button class="btn-add" onclick="addEjercicioByName('${nombreSeguro}')">+</button>
  `;
  catContainer.appendChild(div);
  
  showToast('Ejercicio personalizado agregado');
}

function removeEjercicio(index) {
  state.currentSession.consultorio.splice(index, 1);
  renderSelectedExercises();
  calcularTiempoTotal();
  haptic(15);
}

function renderSelectedExercises() {
  const list = document.getElementById('selected-exercises-list');
  list.innerHTML = state.currentSession.consultorio.map((ej, i) => `
    <li>
      <div class="info">
        <b>${ej.nombre}</b>
        <small>${ej.series}x${ej.reps} · ${ej.tiempo}</small>
      </div>
      <button class="btn-remove-ex" onclick="removeEjercicio(${i})">×</button>
    </li>
  `).join('');
}

// ============ LÓGICA DE TIEMPO Y AGENTES ============
function selectSessionTime(minutos, element) {
  state.currentSession.sessionTime = minutos;
  document.querySelectorAll('.timer-chip').forEach(c => c.classList.remove('active'));
  element.classList.add('active');
  calcularTiempoTotal();
}

function toggleAgent(nombre, checked, key) {
  if (checked) state.currentSession.agentes.push(key);
  else state.currentSession.agentes = state.currentSession.agentes.filter(a => a !== key);
  haptic(15);
  calcularTiempoTotal();
}

function calcularTiempoTotal() {
  let minEjercicios = 0;
  state.currentSession.consultorio.forEach(e => {
    const series = e.series || 3, reps = e.reps || 10, descanso = parseInt(e.descanso) || 45;
    minEjercicios += (series * (reps * 3 + descanso)) / 60;
  });
  
  let minAgentes = 0;
  state.currentSession.agentes.forEach(a => minAgentes += TIEMPOS_AGENTES[a] || 15);
  
  const total = Math.round(minEjercicios + minAgentes);
  const target = state.currentSession.sessionTime;
  
  const summaryEl = document.getElementById('time-summary');
  if (summaryEl) {
    summaryEl.innerHTML = `Tiempo planificado: <b>${total} min</b> / Objetivo: ${target} min`;
    if (total > target) {
      summaryEl.style.color = 'var(--accent-danger)';
      summaryEl.innerHTML += ` <br><small>⚠️ Te pasaste del tiempo seleccionado.</small>`;
    } else if (total < target - 10) {
      summaryEl.style.color = 'var(--accent-warning)';
      summaryEl.innerHTML += ` <br><small>⚠️ Podés agregar más ejercicios.</small>`;
    } else {
      summaryEl.style.color = 'var(--accent-success)';
    }
  }
}

// ============ MODAL DE VIDEO ============
function verMedia(nombre) {
  document.getElementById('modal-title').textContent = nombre;
  const videoUrl = getVideoUrl(nombre);
  document.getElementById('video-frame').src = videoUrl;
  document.getElementById('media-modal').classList.remove('hidden');
}

function verTest() {
  const testName = DB_EXTENDED[state.currentSession.patologia].test || 'Test clínico';
  verMedia(testName);
}

function closeModal() {
  document.getElementById('media-modal').classList.add('hidden');
  document.getElementById('video-frame').src = '';
}

// ============ EVIDENCIA Y BIBLIOGRAFÍA ============
function renderEvidencia(pat) {
  const panel = document.getElementById('evidencia-panel');
  if (!panel) return;
  const ev = EVIDENCIA[pat];
  if (!ev) {
    panel.innerHTML = '<p class="sub">No hay evidencia específica cargada para esta patología.</p>';
    return;
  }
  panel.innerHTML = `<span class="nivel-badge" style="background:var(--accent-success); color:white; padding:2px 8px; border-radius:10px; font-size:0.7rem; font-weight:bold;">Evidencia ${ev.nivel}</span>
    <p style="font-weight:600; margin:10px 0; font-size:0.85rem;">${ev.dosis}</p>
    <h4 style="font-size:0.85rem; color:var(--text-main); margin:10px 0 5px;">Referencias:</h4>
    ${ev.refs.map(r => `<div class="ref-item"><b>${r.cita}</b>${r.doi ? `<br><small style="color:var(--accent-secondary);">DOI: ${r.doi}</small>` : ''}</div>`).join('')}`;
}

function renderBibliografia() {
  const el = document.getElementById('bibliografia-list');
  if (!el) return;
  el.innerHTML = Object.values(BIBLIOGRAFIA).map(b => `
    <div style="padding:8px 0; border-bottom:1px solid var(--border-light);">
      <b>${b.autor}.</b> <i>${b.titulo}</i>. ${b.editorial}, ${b.edicion}, ${b.anio}.
      ${b.isbn !== '—' ? `<br><small style="color:var(--text-muted);">ISBN: ${b.isbn}</small>` : ''}
    </div>
  `).join('');
}

// ============ EVOLUCIÓN Y GRÁFICO ============
function renderGrafico() {
  const canvas = document.getElementById('chart-evolucion');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (chartInstance) chartInstance.destroy();
  
  const pat = state.currentSession.patologia;
  const historial = (state.currentPatient.historial && state.currentPatient.historial[pat]) || [];
  
  if (historial.length === 0) return;
  
  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: historial.map(h => 'S' + h.sesion),
      datasets: [
        { label: 'Reposo', data: historial.map(h => h.eva_reposo), borderColor: '#0f766e', backgroundColor: 'rgba(15,118,110,0.1)', tension: 0.4, fill: true, pointRadius: 6 },
        { label: 'Activo', data: historial.map(h => h.eva_activo), borderColor: '#2a7ab0', backgroundColor: 'rgba(42,122,176,0.1)', tension: 0.4, fill: true, pointRadius: 6 },
        { label: 'Pasivo', data: historial.map(h => h.eva_pasivo), borderColor: '#e11d48', backgroundColor: 'rgba(225,29,72,0.1)', tension: 0.4, fill: true, pointRadius: 6 }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 10 } }, plugins: { legend: { position: 'bottom' } } }
  });
}

// ============ CIERRE Y RUTINA ============
function generarRutinaCasa() {
  const pat = state.currentSession.patologia;
  const patData = DB_EXTENDED[pat];
  const preview = document.getElementById('rutina-casa-preview');
  
  if (!patData || !patData.ejercicios || !patData.ejercicios.casa) {
    preview.innerHTML = '<p class="sub" style="color:var(--accent-danger);">No hay ejercicios de casa predefinidos para esta patología.</p>';
    return;
  }
  
  const rutina = patData.ejercicios.casa;
  state.currentSession.casa = rutina; 
  
  preview.innerHTML = `<h4 style="font-size:0.9rem; margin-bottom:8px;">Rutina generada:</h4>` +
    rutina.map((ej, i) => `<p style="font-size:0.85rem; margin-bottom:6px;"><b>${i+1}. ${ej.nombre}</b> - ${ej.series} series x ${ej.reps} reps</p>`).join('');
    
  showToast('✨ Rutina generada');
  haptic([20, 30, 20]);
}

function imprimirPlanCasa() {
  if (state.currentSession.casa.length === 0) return showToast('Primero generá la rutina.', true);
  let html = `<div class="print-header-home"><h1>Plan de Ejercicios para Casa</h1><p><b>Paciente:</b> ${state.currentPatient.numero} - ${state.currentPatient.nombre}</p><p><b>Fecha:</b> ${new Date().toLocaleDateString()}</p></div><ol class="print-list-home">`;
  state.currentSession.casa.forEach(ej => { html += `<li><b>${ej.nombre}</b> - ${ej.series} series × ${ej.reps} reps</li>`; });
  html += `</ol>`;
  document.getElementById('print-home-area').innerHTML = html;
  document.body.classList.add('printing-home');
  window.print();
  document.body.classList.remove('printing-home');
}

function sendWhatsApp() {
  if (state.currentSession.casa.length === 0) return showToast('Primero generá la rutina.', true);
  let msg = `*Plan de Ejercicios para Casa* 🏠\nHola ${state.currentPatient.nombre}:\n\n`;
  state.currentSession.casa.forEach((ej, i) => {
    msg += `${i+1}. *${ej.nombre}*\n   ${ej.series} series × ${ej.reps} reps\n   Video: https://www.youtube.com/results?search_query=${encodeURIComponent(ej.nombre)}\n\n`;
  });
  window.open(`https://wa.me/${state.currentPatient.telefono}?text=${encodeURIComponent(msg)}`, '_blank');
  haptic(20);
}

function saveSession() {
  const pat = state.currentSession.patologia;
  const notas = document.getElementById('session-notes').value;
  const p = state.currentPatient;
  
  if (!p.historial[pat]) p.historial[pat] = [];
  p.historial[pat].push({
    sesion: state.currentSession.n,
    fecha: new Date().toISOString(),
    eva_reposo: state.currentSession.eva_reposo,
    eva_activo: state.currentSession.eva_activo,
    eva_pasivo: state.currentSession.eva_pasivo,
    notas,
    zonasDolor: state.currentSession.zonasDolor
  });
  
  let avanzar = true;
  const dolorMax = Math.max(state.currentSession.eva_reposo, state.currentSession.eva_activo, state.currentSession.eva_pasivo);
  if (dolorMax > 3) {
    avanzar = confirm('El dolor es mayor a 3/10 en al menos una escala.\n\n¿Querés avanzar a la siguiente sesión de todos modos?');
  }
  
  if (avanzar) {
    if (p.sesionesCompletadas[pat] < state.currentSession.n) p.sesionesCompletadas[pat] = state.currentSession.n;
    showToast('✅ Sesión guardada. Siguiente desbloqueada.');
  } else {
    showToast('✅ Sesión guardada. Paciente se mantiene.');
  }
  haptic([30, 50, 30, 50, 30]);
  
  localStorage.setItem('kf_patients_' + state.user.email, JSON.stringify(state.patients));
  queueForSync('saveSesion', { ...state.currentSession, email_kine: state.user.email, paciente_numero: p.numero });
  
  setTimeout(() => { showView('dashboard-view'); renderPatientList(); renderAgendaHoy(); }, 400);
}

function updateEva(type, val) {
  document.getElementById(`eva-${type}-val`).textContent = val;
  state.currentSession[`eva_${type}`] = parseInt(val);
  haptic(8);
}

// ============ PESTAÑAS ============
function switchTab(tabId, btn) {
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.add('hidden'));
  document.getElementById('tab-' + tabId).classList.remove('hidden');
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  haptic(10);
  
  if (tabId === 'evolucion') renderGrafico();
}

// ============ CALENDARIO ============
function initCalendar() {
  const calendarEl = document.getElementById('calendar-container');
  if (!calendarEl) return;
  if (calendar) calendar.destroy();
  
  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth', locale: 'es',
    headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek' },
    events: state.turnos,
    dateClick: function(info) {
      const nombre = prompt('Nombre del paciente:');
      if (nombre) {
        const turno = { id: 't_' + Date.now(), title: nombre, start: info.dateStr + 'T10:00:00', end: info.dateStr + 'T11:00:00' };
        state.turnos.push(turno);
        localStorage.setItem('kf_turnos_' + state.user.email, JSON.stringify(state.turnos));
        calendar.addEvent(turno);
        queueForSync('saveTurno', turno);
        renderAgendaHoy();
      }
    }
  });
  calendar.render();
}

// ============ EXPORTAR CSV ============
function exportarTodoCSV() {
  if (state.patients.length === 0) return showToast('No hay pacientes para exportar.', true);
  
  let csv = 'Paciente,Edad,Patologías,Sesiones Completadas,Anamnesis,Medicación\n';
  state.patients.forEach(p => {
    const pats = (p.patologias || []).map(k => DB_EXTENDED[k] ? DB_EXTENDED[k].nombre : k).join('; ');
    const sesiones = (p.patologias || []).map(k => `${k}: ${p.sesionesCompletadas[k] || 0}/10`).join('; ');
    csv += `"${p.nombre}",${p.edad},"${pats}","${sesiones}","${p.anamnesis || ''}","${p.medicacionTexto || ''}"\n`;
  });
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'kineflow_pacientes.csv';
  link.click();
}

// ============ TOAST Y SYNC ============
function showToast(m, e = false) {
  const t = document.getElementById('toast');
  t.textContent = m;
  t.className = `toast show ${e ? 'error' : ''}`;
  setTimeout(() => t.className = 'toast', 3000);
}

function checkPendingSync() {
  window.addEventListener('online', () => {
    const el = document.getElementById('sync-status');
    if (el) { el.textContent = 'Online'; el.classList.add('online'); }
    syncPendingData();
  });
  window.addEventListener('offline', () => {
    const el = document.getElementById('sync-status');
    if (el) { el.textContent = 'Offline'; el.classList.remove('online'); }
  });
}

function queueForSync(action, data) {
  const queue = JSON.parse(localStorage.getItem('kf_sync_queue') || '[]');
  queue.push({ action, data, timestamp: Date.now() });
  localStorage.setItem('kf_sync_queue', JSON.stringify(queue));
}

async function syncPendingData() {
  const queue = JSON.parse(localStorage.getItem('kf_sync_queue') || '[]');
  if (queue.length === 0 || !API_URL || API_URL === 'TU_URL_AQUI') return;
  const remaining = [];
  for (const item of queue) {
    try {
      const r = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: item.action, ...item.data }),
        redirect: 'follow'
      });
      if (!(await r.json()).success) throw new Error();
    } catch (e) { remaining.push(item); }
  }
  localStorage.setItem('kf_sync_queue', JSON.stringify(remaining));
  if (remaining.length === 0) showToast('✅ Sincronizado');
}
