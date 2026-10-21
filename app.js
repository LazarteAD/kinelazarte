const API_URL = "https://script.google.com/macros/s/AKfycbyZFQba2Lw4-R1dL_cGLLr-VZbNTsF5GFyz-BWPl3Pze42uH5V79Jov01KmQgILXtIW/exec"; 
let chartInstance = null;
let calendar = null;

let state = {
  user: null, patients: [], currentPatient: null, turnos: [],
  currentSession: { n: 1, consultorio: [], casa: [], agentes: [], eva_reposo: 0, eva_movimiento: 0, notas: "" }
};

// Configuración de tiempos (minutos) por defecto para cada agente
const TIEMPOS_AGENTES = {
  calor: 15, frio: 10, tens: 20, magneto: 20, us: 8, manual: 15
};

// Mapeo de patologías a zonas del cuerpo
const ZONAS_DOLOR = {
  lumbalgia: ["zone-lumbar"], ciatica: ["zone-lumbar"], hernia_dorsal: ["zone-lumbar"], 
  cervicalgia: ["zone-cuello"], hernia_cervical: ["zone-cuello"],
  hombro: ["zone-hombro", "zone-hombro-der"], capsulitis: ["zone-hombro"],
  epicondilitis: ["zone-codo"], tunel_carpiano: ["zone-codo"],
  rodilla: ["zone-rodilla", "zone-rodilla-der"], lca: ["zone-rodilla"],
  esguince_tobillo: ["zone-tobillo", "zone-tobillo-der"], fascitis: ["zone-tobillo"]
};

const DOSIFICACION = {
  sedentario: { series: 2, reps: 10, descanso: 60, tiempoTotal: 40 },
  activo: { series: 3, reps: 10, descanso: 45, tiempoTotal: 45 },
  deportista: { series: 4, reps: 8, descanso: 90, tiempoTotal: 60 },
  laboral_pesado: { series: 3, reps: 12, descanso: 60, tiempoTotal: 50 }
};

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
  showView('login-view');
  const select = document.getElementById('new-patient-pathology');
  if (select) {
    for (const key in DB) {
      const option = document.createElement('option');
      option.value = key; option.textContent = DB[key].nombre; select.appendChild(option);
    }
  }
  checkPendingSync();
});

function showView(viewId) {
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  const target = document.getElementById(viewId);
  if (target) target.classList.remove('hidden');
  window.scrollTo(0, 0);
}

// --- AUTENTICACIÓN ---
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

  showView('dashboard-view');
  renderPatientList();
  syncPendingData();
}

function checkPendingSync() {
  window.addEventListener('online', () => {
    const el = document.getElementById('sync-status');
    if(el) { el.textContent = 'Online'; el.classList.add('online'); }
    syncPendingData();
  });
  window.addEventListener('offline', () => {
    const el = document.getElementById('sync-status');
    if(el) { el.textContent = 'Offline'; el.classList.remove('online'); }
  });
}

// --- GESTIÓN DE PACIENTES ---
function createPatient() {
  const name = document.getElementById('new-patient-name').value.trim();
  const phone = document.getElementById('new-patient-phone').value.trim();
  const pathology = document.getElementById('new-patient-pathology').value;
  const activity = document.getElementById('new-patient-activity').value;
  const anamnesis = document.getElementById('new-patient-anamnesis').value.trim();
  const meds = document.getElementById('new-patient-meds').value.trim();
  const turnoDateTime = document.getElementById('new-patient-turno').value;
  
  const redFlags = [...document.querySelectorAll('.red-flag:checked')].map(c => c.value);
  const yellowFlags = [...document.querySelectorAll('.yellow-flag:checked')].map(c => c.value);

  if (!name || !phone) return showToast('Completa nombre y teléfono', true);

  const newPatient = { 
    id: Date.now().toString(), nombre: name, telefono: phone, patologia: pathology, 
    nivelActividad: activity, banderasRojas: redFlags, banderasAmarillas: yellowFlags,
    anamnesis: anamnesis, medicacionTexto: meds,
    sesionesCompletadas: 0, historial: [] 
  };
  
  state.patients.push(newPatient);
  localStorage.setItem('kf_patients_' + state.user.email, JSON.stringify(state.patients));

  if (turnoDateTime) {
    const turno = {
      id: 't_' + Date.now().toString(),
      title: name + ' - ' + DB[pathology].nombre,
      start: turnoDateTime,
      end: new Date(new Date(turnoDateTime).getTime() + 60*60*1000).toISOString()
    };
    state.turnos.push(turno);
    localStorage.setItem('kf_turnos_' + state.user.email, JSON.stringify(state.turnos));
  }

  document.getElementById('new-patient-name').value = '';
  document.getElementById('new-patient-phone').value = '';
  document.getElementById('new-patient-anamnesis').value = '';
  document.getElementById('new-patient-meds').value = '';
  document.getElementById('new-patient-turno').value = '';
  document.querySelectorAll('.red-flag, .yellow-flag').forEach(c => c.checked = false);

  showView('dashboard-view');
  renderPatientList();
  showToast('Paciente guardado exitosamente');
  queueForSync('savePaciente', newPatient);
}

function renderPatientList() {
  const list = document.getElementById('patient-list');
  if (state.patients.length === 0) {
    list.innerHTML = `<p style="text-align:center; color:var(--text-muted); margin-top:2rem;">No hay pacientes. ¡Toca "+" para agregar uno!</p>`;
    return;
  }
  list.innerHTML = state.patients.map((p, index) => {
    const patName = DB[p.patologia] ? DB[p.patologia].nombre : p.patologia;
    return `<div class="patient-card" style="display:flex; justify-content:space-between; align-items:center;">
      <div style="display:flex; align-items:center; gap:15px; cursor:pointer;" onclick="openSession(${index})">
        <div class="patient-avatar">${p.nombre.charAt(0).toUpperCase()}</div>
        <div class="patient-info"><h3>${p.nombre}</h3><p>${patName} · Sesión ${p.sesionesCompletadas || 0}/10</p></div>
      </div>
      <button onclick="event.stopPropagation(); eliminarPaciente(${index})" class="btn-delete" title="Eliminar Paciente">🗑️</button>
    </div>`;
  }).join('');
}

// --- CALENDARIO ---
function initCalendar() {
  const calendarEl = document.getElementById('calendar-container');
  if (!calendarEl) return;
  if (calendar) calendar.destroy();

  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth', locale: 'es',
    headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' },
    events: state.turnos,
    dateClick: function(info) {
      const nombre = prompt("Nombre del paciente para agendar:");
      if (nombre) {
        const turno = { id: 't_' + Date.now().toString(), title: nombre, start: info.dateStr + 'T10:00:00', end: info.dateStr + 'T11:00:00' };
        state.turnos.push(turno);
        localStorage.setItem('kf_turnos_' + state.user.email, JSON.stringify(state.turnos));
        calendar.addEvent(turno);
        queueForSync('saveTurno', turno);
      }
    }
  });
  calendar.render();
}

// --- VISTA DE SESIÓN ---
window.switchTab = function(tabId, btn) {
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.add('hidden'));
  document.getElementById('tab-' + tabId).classList.remove('hidden');
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  if (tabId === 'evolucion') renderGrafico();
  if (tabId === 'ejercicios') calcularTiempoTotal(); // Calcular tiempo al entrar a la pestaña
};

function openSession(patientIndex) {
  state.currentPatient = state.patients[patientIndex];
  const patData = DB[state.currentPatient.patologia];
  const sesionesCompletadas = state.currentPatient.sesionesCompletadas || 0;
  
  state.currentSession = { n: sesionesCompletadas + 1, consultorio: [], casa: [], agentes: [], eva_reposo: 0, eva_movimiento: 0, notas: "" };
  
  document.getElementById('session-patient-name').textContent = state.currentPatient.nombre;
  document.getElementById('patologia-nombre').textContent = patData.nombre;
  
  // Anamnesis y Medicación
  let anamnesisText = state.currentPatient.anamnesis || "Sin anamnesis registrada.";
  document.getElementById('anamnesis-resumen').textContent = `"${anamnesisText}"`;
  let medsText = state.currentPatient.medicacionTexto;
  document.getElementById('meds-resumen').innerHTML = medsText ? `💊 <b>Medicación:</b> ${medsText}` : '';

  // Dosificación y Kinesiofobia
  let dos = DOSIFICACION[state.currentPatient.nivelActividad] || DOSIFICACION.sedentario;
  let isKinesiofobo = state.currentPatient.banderasAmarillas && state.currentPatient.banderasAmarillas.includes('yellow_kinesiofobia');
  
  let dosText = `Test: ${patData.test}<br><small>Dosificación: ${dos.series} series x ${dos.reps} reps (${dos.tiempoTotal} min)</small>`;
  if (isKinesiofobo) {
      dosText += `<br><span style="color:var(--warning); font-weight:bold; display:block; margin-top:5px; font-size:0.8rem;">⚠️ Kinesiofobia: Priorizar educación y exposición gradual.</span>`;
  }
  document.getElementById('patologia-test').innerHTML = dosText;

  // Banderas
  let flagsDiv = document.getElementById('flags-alert');
  let flagsHTML = '';
  if (state.currentPatient.banderasRojas && state.currentPatient.banderasRojas.length > 0) {
      flagsHTML += `<div class="alert red">🚩 Banderas Rojas: ${state.currentPatient.banderasRojas.join(', ')}. <b>Derivar.</b></div>`;
  }
  if (state.currentPatient.banderasAmarillas && state.currentPatient.banderasAmarillas.length > 0) {
      let am = state.currentPatient.banderasAmarillas.map(f => f === 'yellow_kinesiofobia' ? 'Kinesiofobia' : f).join(', ');
      flagsHTML += `<div class="alert yellow">🟡 Banderas Amarillas: ${am}</div>`;
  }
  flagsDiv.innerHTML = flagsHTML;

  // Mapa Corporal
  document.querySelectorAll('#body-svg circle').forEach(c => c.setAttribute('opacity', '0'));
  const zonas = ZONAS_DOLOR[state.currentPatient.patologia] || [];
  zonas.forEach(z => { const el = document.getElementById(z); if (el) el.setAttribute('opacity', '0.8'); });

  // Plan de Sesiones
  document.getElementById('lista-sesiones').innerHTML = SESIONES_PLAN.map(s => {
    let estado = s.n < sesionesCompletadas ? '✅' : (s.n === sesionesCompletadas + 1 ? '▶️' : '🔒');
    let clase = s.n < sesionesCompletadas ? 'completada' : (s.n > sesionesCompletadas + 1 ? 'bloqueada' : '');
    return `<div class="sesion-item ${clase}"><span>${estado} <b>Sesión ${s.n}:</b> ${s.fase}</span></div>`;
  }).join('');

  // Ejercicios
  const ejContainer = document.getElementById('suggested-exercises');
  ejContainer.innerHTML = '';
  if (patData && patData.ejercicios) {
    let todos = [];
    for (const tipo in patData.ejercicios) { todos = todos.concat(patData.ejercicios[tipo]); }
    todos.forEach(ej => {
      const chip = document.createElement('div');
      chip.className = 'chip'; chip.textContent = ej;
      chip.onclick = () => {
        if (!state.currentSession.consultorio.includes(ej)) {
            state.currentSession.consultorio.push(ej); chip.classList.add('selected'); renderLists();
        }
      };
      ejContainer.appendChild(chip);
    });
  }

  // Agentes
  const agentContainer = document.getElementById('agents-list');
  agentContainer.innerHTML = '';
  if (patData && patData.agentes) {
    patData.agentes.forEach(agentKey => {
      const agent = AGENTES[agentKey]; if (!agent) return;
      let isContra = false;
      if (agent.contraindica && state.currentPatient.banderasRojas) {
        if (agent.contraindica.some(c => state.currentPatient.banderasRojas.includes(c))) isContra = true;
      }
      const div = document.createElement('div');
      div.className = `agent-item ${isContra ? 'contra' : ''}`;
      div.innerHTML = `<div><h4>${agent.nombre}</h4><small>${agent.dosis}</small>${isContra ? `<span class="agent-alert">⚠️ Contraindicado</span>` : ''}</div><input type="checkbox" ${isContra ? 'disabled' : ''} onchange="toggleAgent('${agent.nombre}', this.checked, '${agentKey}')">`;
      agentContainer.appendChild(div);
    });
  }

  document.getElementById('eva-reposo').value = 0; document.getElementById('eva-reposo-val').textContent = "0";
  document.getElementById('eva-movimiento').value = 0; document.getElementById('eva-movimiento-val').textContent = "0";
  document.getElementById('session-notes').value = "";
  document.getElementById('selected-consultorio').innerHTML = "";
  document.getElementById('selected-casa').innerHTML = "";

  showView('session-view');
  switchTab('mapa', document.querySelectorAll('.tab-btn')[0]);
}

function renderLists() {
  document.getElementById('selected-consultorio').innerHTML = state.currentSession.consultorio.map((ej, i) => `
      <li><span>${ej}</span><div class="action-buttons">
        <button class="btn-play" onclick="verMedia('${ej}')">▶</button>
        <button class="btn-move" onclick="pasarACasa(${i})">→</button>
        <button class="btn-remove" onclick="removeItem('consultorio', ${i})">×</button>
      </div></li>
  `).join('');
  document.getElementById('selected-casa').innerHTML = state.currentSession.casa.map((ej, i) => `
      <li style="border-left-color:var(--whatsapp);"><span>${ej}</span><div class="action-buttons">
        <button class="btn-play" onclick="verMedia('${ej}')">▶</button>
        <button class="btn-remove" onclick="removeItem('casa', ${i})">×</button>
      </div></li>
  `).join('');
  calcularTiempoTotal(); // Recalcular tiempo al modificar listas
}

// --- CÁLCULO DE TIEMPO TOTAL ---
function calcularTiempoTotal() {
  const dos = DOSIFICACION[state.currentPatient.nivelActividad] || DOSIFICACION.sedentario;
  const numEjercicios = state.currentSession.consultorio.length;
  
  // Tiempo por ejercicio (aprox: series * (reps * 3s + descanso))
  const tiempoPorEjercicio = dos.series * (dos.reps * 3 + dos.descanso) / 60; // en minutos
  const tiempoEjercicios = numEjercicios * tiempoPorEjercicio;

  // Tiempo de agentes
  let tiempoAgentes = 0;
  state.currentSession.agentes.forEach(ag => { tiempoAgentes += TIEMPOS_AGENTES[ag] || 15; });

  const total = Math.round(tiempoEjercicios + tiempoAgentes);

  document.getElementById('time-ejercicios').textContent = Math.round(tiempoEjercicios) + ' min';
  document.getElementById('time-agentes').textContent = tiempoAgentes + ' min';
  document.getElementById('time-total').textContent = total + ' min';

  const alertEl = document.getElementById('time-alert');
  if (total < 40) alertEl.textContent = '⚠️ Menos de 40 min. Agregar más ejercicios.';
  else if (total > 60) alertEl.textContent = '⚠️ Más de 60 min. Reducir ejercicios o descansos.';
  else alertEl.textContent = '✅ Tiempo dentro del rango recomendado (40-60 min).';
}

// --- UTILIDADES DE TERAPIA ---
function autocompletarCasa() {
  const patData = DB[state.currentPatient.patologia];
  if (patData && patData.ejercicios && patData.ejercicios.casa) {
    patData.ejercicios.casa.forEach(ej => {
      if (!state.currentSession.casa.includes(ej)) state.currentSession.casa.push(ej);
    });
    renderLists();
    showToast('Rutina de casa autocompletada');
  }
}

function pasarACasa(i) { 
  const ej = state.currentSession.consultorio.splice(i, 1)[0]; 
  state.currentSession.casa.push(ej); 
  renderLists(); 
}

function removeItem(l, i) { 
  state.currentSession[l].splice(i, 1); 
  renderLists(); 
}

function toggleAgent(n, c, key) { 
  if(c) state.currentSession.agentes.push(key); 
  else state.currentSession.agentes = state.currentSession.agentes.filter(a => a !== key); 
  calcularTiempoTotal(); // Recalcular al cambiar agentes
}

function updateEva(type, val) { 
  document.getElementById(`eva-${type}-val`).textContent = val; 
  state.currentSession[`eva_${type}`] = parseInt(val); 
}

function verMedia(nombre) {
  const modal = document.getElementById('media-modal');
  document.getElementById('modal-title').textContent = nombre;
  document.getElementById('modal-yt-link').href = `https://www.youtube.com/results?search_query=${encodeURIComponent('ejercicio kinesiologia ' + nombre)}`;
  document.getElementById('modal-img-link').href = `https://www.google.com/search?q=${encodeURIComponent('ejercicio kinesiologia ' + nombre + ' posicion inicial y final')}&tbm=isch`;
  modal.classList.remove('hidden');
}
function verTest() { verMedia(DB[state.currentPatient.patologia].test); }
function closeModal() { document.getElementById('media-modal').classList.add('hidden'); }

// --- EDITAR Y ELIMINAR PACIENTE ---
function editarAnamnesis() {
  const p = state.currentPatient;
  const nuevaAnamnesis = prompt("Editar Anamnesis:", p.anamnesis);
  if (nuevaAnamnesis !== null && nuevaAnamnesis.trim() !== "") {
    p.anamnesis = nuevaAnamnesis.trim();
    document.getElementById('anamnesis-resumen').textContent = `"${p.anamnesis}"`;
    localStorage.setItem('kf_patients_' + state.user.email, JSON.stringify(state.patients));
    showToast('Anamnesis actualizada');
  }
}

function eliminarPaciente(index) {
  if (confirm(`¿Eliminar a ${state.patients[index].nombre}?`)) {
    state.patients.splice(index, 1);
    localStorage.setItem('kf_patients_' + state.user.email, JSON.stringify(state.patients));
    renderPatientList();
    showToast('Paciente eliminado');
  }
}

// --- GRÁFICO Y GUARDADO ---
function renderGrafico() {
  const ctx = document.getElementById('chart-evolucion').getContext('2d');
  if (chartInstance) chartInstance.destroy();

  const historial = state.currentPatient.historial || [];
  const labels = historial.map(h => 'S' + h.sesion);
  const dataReposo = historial.map(h => h.eva_reposo);
  const dataMovimiento = historial.map(h => h.eva_movimiento);

  if (historial.length === 0) { labels.push('S1'); dataReposo.push(0); dataMovimiento.push(0); }

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        { label: 'Reposo', data: dataReposo, borderColor: '#0f766e', backgroundColor: 'rgba(15,118,110,0.1)', tension: 0.3, fill: true },
        { label: 'Movimiento', data: dataMovimiento, borderColor: '#e11d48', backgroundColor: 'rgba(225,29,72,0.1)', tension: 0.3, fill: true }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 10 } }, plugins: { legend: { position: 'bottom' } } }
  });
}

function saveSession() {
  state.currentSession.notas = document.getElementById('session-notes').value;
  if (!state.currentPatient.historial) state.currentPatient.historial = [];
  
  state.currentPatient.historial.push({
    sesion: state.currentSession.n, fecha: new Date().toISOString(),
    eva_reposo: state.currentSession.eva_reposo, eva_movimiento: state.currentSession.eva_movimiento, notas: state.currentSession.notas
  });

  if (state.currentSession.eva_reposo <= 3 && state.currentSession.eva_movimiento <= 3) {
    if (state.currentPatient.sesionesCompletadas < state.currentSession.n) state.currentPatient.sesionesCompletadas = state.currentSession.n;
    showToast('✅ Sesión guardada. Siguiente desbloqueada.');
  } else {
    showToast('⚠️ Guardada. No avanza por dolor > 3.', true);
  }

  localStorage.setItem('kf_patients_' + state.user.email, JSON.stringify(state.patients));
  queueForSync('saveSesion', {
    ...state.currentSession,
    email_kine: state.user.email,
    paciente_nombre: state.currentPatient.nombre,
    patologia: state.currentPatient.patologia
  });
  
  showView('dashboard-view');
  renderPatientList();
}

// --- IMPRESIÓN Y WHATSAPP ---
function imprimirPlanCasa() {
  if (state.currentSession.casa.length === 0) return showToast('No hay ejercicios en casa.', true);
  
  let html = `
    <div class="print-header-home">
      <h1>Plan de Ejercicios para Casa</h1>
      <p><b>Paciente:</b> ${state.currentPatient.nombre}</p>
      <p><b>Fecha:</b> ${new Date().toLocaleDateString()}</p>
    </div>
    <ol class="print-list-home">
  `;
  state.currentSession.casa.forEach(ej => { html += `<li>${ej}</li>`; });
  html += `</ol><p style="margin-top:30px; font-size:12px; text-align:center;">KineFlow Clinical - Rehabilitación</p>`;

  document.getElementById('print-home-area').innerHTML = html;
  document.body.classList.add('printing-home');
  window.print();
  document.body.classList.remove('printing-home');
}

function exportarHistoria() {
  const p = state.currentPatient;
  const fecha = new Date().toLocaleDateString();
  let html = `<div class="print-header">
    <h1>Historia Clínica KineFlow</h1>
    <p><b>Paciente:</b> ${p.nombre} | <b>Fecha:</b> ${fecha}</p>
    <p><b>Diagnóstico:</b> ${DB[p.patologia].nombre}</p>
    <p><b>Anamnesis:</b> ${p.anamnesis || '-'}</p>
    <p><b>Medicación:</b> ${p.medicacionTexto || '-'}</p>`;
  if (p.banderasRojas && p.banderasRojas.length > 0) html += `<p style="color:red;"><b>Banderas Rojas:</b> ${p.banderasRojas.join(', ')}</p>`;
  html += `</div>`;
  
  if (p.historial && p.historial.length > 0) {
    html += `<table><tr><th>Sesión</th><th>Fecha</th><th>EVA Reposo</th><th>EVA Movimiento</th><th>Notas</th></tr>`;
    p.historial.forEach(h => { 
      html += `<tr><td>${h.sesion}</td><td>${new Date(h.fecha).toLocaleDateString()}</td><td>${h.eva_reposo}/10</td><td>${h.eva_movimiento}/10</td><td>${h.notas || '-'}</td></tr>`; 
    });
    html += `</table>`;
  } else { 
    html += `<p>No hay sesiones registradas aún.</p>`; 
  }
  document.getElementById('print-area').innerHTML = html;
  window.print();
}

function sendWhatsApp() {
  if (state.currentSession.casa.length === 0) return showToast('No hay ejercicios en casa.', true);
  let msg = `*Plan de Ejercicios para Casa* 🏠\nHola ${state.currentPatient.nombre}, acá tenés tu tarea:\n\n`;
  state.currentSession.casa.forEach((ej, i) => { 
    msg += `${i+1}. ${ej}\nVideo: https://www.youtube.com/results?search_query=${encodeURIComponent('ejercicio kinesiologia ' + ej)}\n\n`; 
  });
  if (state.currentPatient.banderasAmarillas && state.currentPatient.banderasAmarillas.includes('yellow_kinesiofobia')) {
      msg += `_Recordá: el movimiento es seguro y necesario para tu recuperación. Hacelo de a poco y sin miedo._`;
  }
  window.open(`https://wa.me/${state.currentPatient.telefono}?text=${encodeURIComponent(msg)}`, '_blank');
}

// --- SINCRONIZACIÓN OFFLINE ---
function queueForSync(action, data) {
  const queue = JSON.parse(localStorage.getItem('kf_sync_queue') || '[]');
  queue.push({ action, data, timestamp: Date.now() });
  localStorage.setItem('kf_sync_queue', JSON.stringify(queue));
}

async function syncPendingData() {
  const queue = JSON.parse(localStorage.getItem('kf_sync_queue') || '[]');
  if (queue.length === 0 || !API_URL || API_URL === "TU_URL_AQUI") return;

  const remaining = [];
  for (const item of queue) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: item.action, ...item.data }),
        redirect: 'follow'
      });
      const result = await response.json();
      if (!result.success) throw new Error('Fallo en el servidor');
    } catch (error) {
      console.error('Error al sincronizar:', error);
      remaining.push(item);
    }
  }
  localStorage.setItem('kf_sync_queue', JSON.stringify(remaining));
  if (remaining.length === 0) showToast('✅ Datos sincronizados');
}

function showToast(m, e=false) { 
  const t = document.getElementById('toast'); 
  t.textContent = m; 
  t.className = `toast show ${e ? 'error' : ''}`; 
  setTimeout(() => t.className = 'toast', 3000); 
}
