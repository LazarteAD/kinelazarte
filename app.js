// ⚠️ CONFIGURACIÓN: PEGÁ TU URL DE GOOGLE APPS SCRIPT ACÁ (termina en /exec)
const API_URL = "https://script.google.com/macros/s/AKfycbyZFQba2Lw4-R1dL_cGLLr-VZbNTsF5GFyz-BWPl3Pze42uH5V79Jov01KmQgILXtIW/exec"; 
let chartInstance = null;
let calendar = null;

let state = {
  user: null, patients: [], currentPatient: null, turnos: [],
  currentSession: { n: 1, consultorio: [], casa: [], agentes: [], eva_reposo: 0, eva_movimiento: 0, notas: "" }
};

const ZONAS_DOLOR = {
  lumbalgia: ["zone-lumbar"], ciatica: ["zone-lumbar"], hernia_dorsal: ["zone-lumbar"], 
  cervicalgia: ["zone-cuello"], hernia_cervical: ["zone-cuello"],
  hombro: ["zone-hombro", "zone-hombro-der"], capsulitis: ["zone-hombro"],
  epicondilitis: ["zone-codo"], tunel_carpiano: ["zone-codo"],
  rodilla: ["zone-rodilla", "zone-rodilla-der"], lca: ["zone-rodilla"],
  esguince_tobillo: ["zone-tobillo", "zone-tobillo-der"], fascitis: ["zone-tobillo"]
};

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

// --- LOGIN Y SINCRONIZACIÓN ---
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
  syncPendingData(); // Intentar sincronizar datos offline
}

function checkPendingSync() {
  window.addEventListener('online', () => {
    document.getElementById('sync-status').textContent = 'Online';
    document.getElementById('sync-status').classList.add('online');
    syncPendingData();
  });
  window.addEventListener('offline', () => {
    document.getElementById('sync-status').textContent = 'Offline';
    document.getElementById('sync-status').classList.remove('online');
  });
}

// --- PACIENTES ---
function createPatient() {
  const name = document.getElementById('new-patient-name').value.trim();
  const phone = document.getElementById('new-patient-phone').value.trim();
  const pathology = document.getElementById('new-patient-pathology').value;
  const turnoDateTime = document.getElementById('new-patient-turno').value;

  if (!name || !phone) return showToast('Completa nombre y teléfono', true);

  const newPatient = { 
    id: Date.now().toString(), nombre: name, telefono: phone, patologia: pathology, 
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
  document.getElementById('new-patient-turno').value = '';

  showView('dashboard-view');
  renderPatientList();
  showToast('Paciente guardado');
  queueForSync('savePaciente', newPatient); // Encolar para sincronización
}

function renderPatientList() {
  const list = document.getElementById('patient-list');
  if (state.patients.length === 0) {
    list.innerHTML = `<p style="text-align:center; color:var(--text-muted); margin-top:2rem;">No hay pacientes. ¡Toca "+"!</p>`;
    return;
  }
  list.innerHTML = state.patients.map((p, index) => {
    const patName = DB[p.patologia] ? DB[p.patologia].nombre : p.patologia;
    return `<div class="patient-card" onclick="openSession(${index})">
      <div class="patient-avatar">${p.nombre.charAt(0).toUpperCase()}</div>
      <div class="patient-info"><h3>${p.nombre}</h3><p>${patName} · Sesión ${p.sesionesCompletadas || 0}/10</p></div>
    </div>`;
  }).join('');
}

// --- CALENDARIO ---
function initCalendar() {
  const calendarEl = document.getElementById('calendar-container');
  if (!calendarEl) return;
  if (calendar) calendar.destroy();

  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'es',
    headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' },
    events: state.turnos,
    dateClick: function(info) {
      const nombre = prompt("Nombre del paciente para agendar:");
      if (nombre) {
        const turno = { id: 't_' + Date.now().toString(), title: nombre, start: info.dateStr + 'T10:00:00', end: info.dateStr + 'T11:00:00' };
        state.turnos.push(turno);
        localStorage.setItem('kf_turnos_' + state.user.email, JSON.stringify(state.turnos));
        calendar.addEvent(turno);
        queueForSync('saveTurno', turno); // Encolar para sincronización
      }
    },
    eventClick: function(info) {
      if (confirm("¿Eliminar este turno?")) {
        info.event.remove();
        state.turnos = state.turnos.filter(t => t.id !== info.event.id);
        localStorage.setItem('kf_turnos_' + state.user.email, JSON.stringify(state.turnos));
      }
    }
  });
  calendar.render();
}

// --- SESIÓN ---
window.switchTab = function(tabId, btn) {
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.add('hidden'));
  document.getElementById('tab-' + tabId).classList.remove('hidden');
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  if (tabId === 'evolucion') renderGrafico();
};

function openSession(patientIndex) {
  state.currentPatient = state.patients[patientIndex];
  const patData = DB[state.currentPatient.patologia];
  const sesionesCompletadas = state.currentPatient.sesionesCompletadas || 0;
  
  state.currentSession = { n: sesionesCompletadas + 1, consultorio: [], casa: [], agentes: [], eva_reposo: 0, eva_movimiento: 0, notas: "" };
  
  document.getElementById('session-patient-name').textContent = state.currentPatient.nombre;
  document.getElementById('patologia-nombre').textContent = patData.nombre;
  document.getElementById('patologia-test').textContent = 'Test: ' + patData.test;
  
  document.querySelectorAll('#body-svg circle').forEach(c => c.setAttribute('opacity', '0'));
  const zonas = ZONAS_DOLOR[state.currentPatient.patologia] || [];
  zonas.forEach(z => { const el = document.getElementById(z); if (el) el.setAttribute('opacity', '0.8'); });

  document.getElementById('lista-sesiones').innerHTML = SESIONES_PLAN.map(s => {
    let estado = s.n < sesionesCompletadas ? '✅' : (s.n === sesionesCompletadas + 1 ? '▶️' : '🔒');
    let clase = s.n < sesionesCompletadas ? 'completada' : (s.n > sesionesCompletadas + 1 ? 'bloqueada' : '');
    return `<div class="sesion-item ${clase}"><span>${estado} <b>Sesión ${s.n}:</b> ${s.fase}</span></div>`;
  }).join('');

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

  const agentContainer = document.getElementById('agents-list');
  agentContainer.innerHTML = '';
  if (patData && patData.agentes) {
    patData.agentes.forEach(agentKey => {
      const agent = AGENTES[agentKey]; if (!agent) return;
      let isContra = false;
      if (agent.contraindica && state.currentPatient.banderas) {
        if (agent.contraindica.some(c => state.currentPatient.banderas.includes(c))) isContra = true;
      }
      const div = document.createElement('div');
      div.className = `agent-item ${isContra ? 'contra' : ''}`;
      div.innerHTML = `<div><h4>${agent.nombre}</h4><small>${agent.dosis}</small>${isContra ? `<span class="agent-alert">⚠️ Contraindicado</span>` : ''}</div><input type="checkbox" ${isContra ? 'disabled' : ''} onchange="toggleAgent('${agent.nombre}', this.checked)">`;
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
}

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

// --- EXPORTAR HISTORIA ---
function exportarHistoria() {
  const p = state.currentPatient;
  const fecha = new Date().toLocaleDateString();
  let html = `<div class="print-header"><h1>KineFlow - Historia Clínica</h1><p><b>Paciente:</b> ${p.nombre} | <b>Fecha:</b> ${fecha}</p><p><b>Diagnóstico:</b> ${DB[p.patologia].nombre}</p></div>`;
  if (p.historial && p.historial.length > 0) {
    html += `<table><tr><th>Sesión</th><th>Fecha</th><th>EVA Reposo</th><th>EVA Movimiento</th><th>Notas</th></tr>`;
    p.historial.forEach(h => { html += `<tr><td>${h.sesion}</td><td>${new Date(h.fecha).toLocaleDateString()}</td><td>${h.eva_reposo}/10</td><td>${h.eva_movimiento}/10</td><td>${h.notas || '-'}</td></tr>`; });
    html += `</table>`;
  } else { html += `<p>No hay sesiones registradas aún.</p>`; }
  document.getElementById('print-area').innerHTML = html;
  window.print();
}

// --- UTILIDADES Y SINCRONIZACIÓN ---
function updateEva(type, val) { document.getElementById(`eva-${type}-val`).textContent = val; state.currentSession[`eva_${type}`] = parseInt(val); }
function verMedia(nombre) {
  const modal = document.getElementById('media-modal');
  document.getElementById('modal-title').textContent = nombre;
  document.getElementById('modal-yt-link').href = `https://www.youtube.com/results?search_query=${encodeURIComponent('ejercicio kinesiologia ' + nombre)}`;
  document.getElementById('modal-img-link').href = `https://www.google.com/search?q=${encodeURIComponent('ejercicio kinesiologia ' + nombre + ' posicion inicial y final')}&tbm=isch`;
  modal.classList.remove('hidden');
}
function verTest() { verMedia(DB[state.currentPatient.patologia].test); }
function closeModal() { document.getElementById('media-modal').classList.add('hidden'); }
function pasarACasa(i) { const ej = state.currentSession.consultorio.splice(i, 1)[0]; state.currentSession.casa.push(ej); renderLists(); }
function removeItem(l, i) { state.currentSession[l].splice(i, 1); renderLists(); }
function toggleAgent(n, c) { if(c) state.currentSession.agentes.push(n); else state.currentSession.agentes = state.currentSession.agentes.filter(a => a !== n); }
function sendWhatsApp() {
  if (state.currentSession.casa.length === 0) return showToast('No hay ejercicios en casa.', true);
  let msg = `*Plan de Ejercicios* 🏠\nHola ${state.currentPatient.nombre}, acá tenés tu tarea:\n\n`;
  state.currentSession.casa.forEach((ej, i) => { msg += `${i+1}. ${ej}\nVideo: https://www.youtube.com/results?search_query=${encodeURIComponent(ej)}\n\n`; });
  window.open(`https://wa.me/${state.currentPatient.telefono}?text=${encodeURIComponent(msg)}`, '_blank');
}
function showToast(m, e=false) { const t=document.getElementById('toast'); t.textContent=m; t.className=`toast show ${e?'error':''}`; setTimeout(()=>t.className='toast', 3000); }

// --- COLA DE SINCRONIZACIÓN ---
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
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // Evita CORS preflight
        body: JSON.stringify({ action: item.action, ...item.data }),
        redirect: 'follow'
      });
      const result = await response.json();
      if (!result.success) throw new Error('Fallo en el servidor');
    } catch (error) {
      console.error('Error al sincronizar:', error);
      remaining.push(item); // Reencolar si falla
    }
  }
  localStorage.setItem('kf_sync_queue', JSON.stringify(remaining));
  if (remaining.length === 0) showToast('✅ Datos sincronizados');
}
