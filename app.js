// ============================================================
// KINEFLOW PRO - LÓGICA PRINCIPAL (El Cerebro)
// ============================================================

// ⚠️ CONFIGURACIÓN: PEGÁ TU URL DE GOOGLE APPS SCRIPT ACÁ ADENTRO DE LAS COMILLAS
const API_URL = "https://script.google.com/macros/s/AKfycbwNXq1wyc1dbh1G5_e0R7FNNd4jCA6siLJclGVd3SGUnTaEdEEgZTb8AzII7DoK2ZOg/exec"; 

// Estado Global de la Aplicación
let state = {
  user: null,
  patients: [],
  currentPatient: null,
  currentSession: {
    n: 1,
    ejerciciosSeleccionados: [],
    agentesSeleccionados: [],
    eva_reposo: 0,
    eva_movimiento: 0,
    notas: ""
  },
  timer: { interval: null, seconds: 0, running: false }
};

// ============================================================
// 1. INICIALIZACIÓN Y LOGIN
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  // Llenar el selector de patologías
  const select = document.getElementById('new-patient-pathology');
  for (const key in DB) {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = DB[key].nombre;
    select.appendChild(option);
  }

  // Auto-login si ya hay un usuario guardado
  const savedUser = localStorage.getItem('kf_user');
  if (savedUser) {
    state.user = JSON.parse(savedUser);
    showView('dashboard-view');
    fetchData();
  }
  
  // Manejar estado de conexión
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();
});

function updateOnlineStatus() {
  const el = document.getElementById('sync-status');
  if (navigator.onLine) {
    el.textContent = 'Online';
    el.classList.add('online');
  } else {
    el.textContent = 'Offline';
    el.classList.remove('online');
  }
}

function login() {
  const email = document.getElementById('login-email').value.trim();
  if (!email) return showToast('Ingresa tu email', true);
  
  state.user = { email };
  localStorage.setItem('kf_user', JSON.stringify(state.user));
  
  showView('dashboard-view');
  fetchData();
}

function showView(viewId) {
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  document.getElementById(viewId).classList.remove('hidden');
  window.scrollTo(0, 0);
}

// ============================================================
// 2. GESTIÓN DE PACIENTES
// ============================================================
function createPatient() {
  const name = document.getElementById('new-patient-name').value.trim();
  const phone = document.getElementById('new-patient-phone').value.trim();
  const pathology = document.getElementById('new-patient-pathology').value;
  const comorb = [...document.querySelectorAll('.comorb:checked')].map(c => c.value);

  if (!name || !phone) return showToast('Completa nombre y teléfono', true);

  const newPatient = {
    id: Date.now().toString(), // ID único
    email_kine: state.user.email,
    nombre: name,
    telefono: phone,
    patologia: pathology,
    comorbilidades: comorb,
    fecha_creacion: new Date().toISOString()
  };

  // Guardar localmente
  state.patients.push(newPatient);
  localStorage.setItem('kf_patients', JSON.stringify(state.patients));
  
  // Sincronizar con Backend
  fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'savePaciente', paciente: newPatient })
  }).catch(() => showToast('Guardado offline. Se sincronizará luego.'));

  // Limpiar formulario y volver
  document.getElementById('new-patient-name').value = '';
  document.getElementById('new-patient-phone').value = '';
  document.querySelectorAll('.comorb').forEach(c => c.checked = false);
  
  showView('dashboard-view');
  renderPatientList();
  showToast('Paciente guardado exitosamente');
}

function fetchData() {
  // Primero cargamos lo local para que sea instantáneo
  const localPatients = localStorage.getItem('kf_patients');
  if (localPatients) {
    state.patients = JSON.parse(localPatients);
    renderPatientList();
  }

  // Luego intentamos traer lo nuevo del backend
  fetch(`${API_URL}?action=getData&email=${state.user.email}`)
    .then(res => res.json())
    .then(data => {
      if (data.pacientes && data.pacientes.length > 0) {
        state.patients = data.pacientes;
        localStorage.setItem('kf_patients', JSON.stringify(state.patients));
        renderPatientList();
      }
    })
    .catch(err => console.log('Modo offline', err));
}

function renderPatientList() {
  const list = document.getElementById('patient-list');
  if (state.patients.length === 0) {
    list.innerHTML = `<div class="card" style="text-align:center; color:var(--text-muted);">No hay pacientes. ¡Toca "+ Nuevo" para empezar!</div>`;
    return;
  }

  list.innerHTML = state.patients.map((p, index) => {
    const patName = DB[p.patologia] ? DB[p.patologia].nombre : p.patologia;
    const inicial = p.nombre.charAt(0).toUpperCase();
    const alerta = (p.comorbilidades && p.comorbilidades.length > 0) ? '<span style="color:var(--danger); font-size:12px; font-weight:bold;">⚠ Tiene comorbilidades</span>' : '';
    
    return `
      <div class="patient-card" onclick="openSession(${index})">
        <div class="patient-avatar">${inicial}</div>
        <div class="patient-info">
          <h3>${p.nombre}</h3>
          <p>${patName}</p>
          ${alerta}
        </div>
      </div>
    `;
  }).join('');
}

// ============================================================
// 3. GESTIÓN DE LA SESIÓN (El Santo Grial)
// ============================================================
function openSession(patientIndex) {
  state.currentPatient = state.patients[patientIndex];
  const patKey = state.currentPatient.patologia;
  const patData = DB[patKey];
  
  // Resetear estado de sesión
  state.currentSession = {
    n: 1, // Acá podrías calcular cuántas sesiones tiene mirando el backend
    ejerciciosSeleccionados: [],
    agentesSeleccionados: [],
    eva_reposo: 0,
    eva_movimiento: 0,
    notas: ""
  };
  
  // Configurar UI
  document.getElementById('session-patient-name').textContent = state.currentPatient.nombre;
  document.getElementById('eva-reposo').value = 0;
  document.getElementById('eva-reposo-val').textContent = "0";
  document.getElementById('eva-movimiento').value = 0;
  document.getElementById('eva-movimiento-val').textContent = "0";
  document.getElementById('session-notes').value = "";
  document.getElementById('selected-exercises-list').innerHTML = "";
  document.getElementById('manual-exercise-input').value = "";
  
  // 1. Renderizar Ejercicios Sugeridos (Chips)
  const ejContainer = document.getElementById('suggested-exercises');
  ejContainer.innerHTML = '';
  
  if (patData && patData.ejercicios) {
    // Aplanamos todos los ejercicios de la patología
    let todosLosEjs = [];
    for (const tipo in patData.ejercicios) {
      todosLosEjs = todosLosEjs.concat(patData.ejercicios[tipo]);
    }

    todosLosEjs.forEach(ej => {
      const chip = document.createElement('div');
      chip.className = 'chip';
      chip.textContent = ej;
      chip.onclick = () => {
        if (chip.classList.contains('selected')) {
          // Si ya estaba, lo sacamos
          chip.classList.remove('selected');
          state.currentSession.ejerciciosSeleccionados = state.currentSession.ejerciciosSeleccionados.filter(e => e !== ej);
        } else {
          // Si no estaba, lo agregamos
          chip.classList.add('selected');
          state.currentSession.ejerciciosSeleccionados.push(ej);
        }
        renderSelectedExercises();
      };
      ejContainer.appendChild(chip);
    });
  }

  // 2. Renderizar Agentes Físicos (Con lógica de contraindicaciones)
  const agentContainer = document.getElementById('agents-list');
  agentContainer.innerHTML = '';
  
  if (patData && patData.agentes) {
    patData.agentes.forEach(agentKey => {
      const agent = AGENTES[agentKey];
      if (!agent) return;
      
      // VERIFICACIÓN DE CONTRAINDICACIONES
      let isContra = false;
      let motivo = "";
      if (agent.contraindica && state.currentPatient.comorbilidades) {
        const match = agent.contraindica.find(c => state.currentPatient.comorbilidades.includes(c));
        if (match) {
          isContra = true;
          motivo = `Contraindicado por: ${match.toUpperCase()}`;
        }
      }
      
      const div = document.createElement('div');
      div.className = `agent-item ${isContra ? 'contra' : ''}`;
      div.innerHTML = `
        <div>
          <h4>${agent.nombre}</h4>
          <small>${agent.dosis}</small>
          ${isContra ? `<span class="agent-alert">⚠️ ${motivo}</span>` : ''}
        </div>
        <label class="switch">
          <input type="checkbox" id="agent-${agentKey}" ${isContra ? 'disabled' : ''} onchange="toggleAgent('${agentKey}', '${agent.nombre}', this.checked)">
          <span class="slider"></span>
        </label>
      `;
      agentContainer.appendChild(div);
    });
  }

  // Resetear cronómetro e iniciar vista
  resetTimer();
  showView('session-view');
}

function renderSelectedExercises() {
  const list = document.getElementById('selected-exercises-list');
  list.innerHTML = state.currentSession.ejerciciosSeleccionados.map((ej, index) => `
    <li>
      <span>${ej}</span>
      <button onclick="removeExercise(${index})">×</button>
    </li>
  `).join('');
}

function removeExercise(index) {
  // Buscar el texto para quitarle la clase 'selected' al chip
  const ejText = state.currentSession.ejerciciosSeleccionados[index];
  const chips = document.querySelectorAll('.chip');
  chips.forEach(c => {
    if (c.textContent === ejText) c.classList.remove('selected');
  });
  
  state.currentSession.ejerciciosSeleccionados.splice(index, 1);
  renderSelectedExercises();
}

function addManualExercise() {
  const input = document.getElementById('manual-exercise-input');
  const text = input.value.trim();
  if (!text) return;
  
  state.currentSession.ejerciciosSeleccionados.push(text);
  renderSelectedExercises();
  input.value = '';
}

function toggleAgent(key, nombre, isChecked) {
  if (isChecked) {
    state.currentSession.agentesSeleccionados.push(nombre);
  } else {
    state.currentSession.agentesSeleccionados = state.currentSession.agentesSeleccionados.filter(a => a !== nombre);
  }
}

function updateEva(type, value) {
  document.getElementById(`eva-${type}-val`).textContent = value;
  if (type === 'reposo') state.currentSession.eva_reposo = parseInt(value);
  else state.currentSession.eva_movimiento = parseInt(value);
}

// ============================================================
// 4. CRONÓMETRO (Duración de 40-60 min)
// ============================================================
function toggleTimer() {
  const btn = document.getElementById('timer-btn');
  if (state.timer.running) {
    clearInterval(state.timer.interval);
    state.timer.running = false;
    btn.textContent = 'Reanudar';
  } else {
    state.timer.interval = setInterval(() => {
      state.timer.seconds++;
      const m = Math.floor(state.timer.seconds / 60).toString().padStart(2, '0');
      const s = (state.timer.seconds % 60).toString().padStart(2, '0');
      document.getElementById('session-timer').textContent = `${m}:${s}`;
      
      // Alerta a los 45 mins
      if (state.timer.seconds === 2700) {
        showToast('⏰ Recordatorio: Llevas 45 minutos de sesión.');
      }
    }, 1000);
    state.timer.running = true;
    btn.textContent = 'Pausar';
  }
}

function resetTimer() {
  clearInterval(state.timer.interval);
  state.timer = { interval: null, seconds: 0, running: false };
  document.getElementById('session-timer').textContent = '00:00';
  document.getElementById('timer-btn').textContent = 'Iniciar';
}

// ============================================================
// 5. GUARDAR SESIÓN Y ENVIAR POR WHATSAPP
// ============================================================
function saveSession() {
  state.currentSession.notas = document.getElementById('session-notes').value;
  
  const sessionData = {
    id: Date.now().toString(),
    email_kine: state.user.email,
    paciente_nombre: state.currentPatient.nombre,
    paciente_id: state.currentPatient.id,
    patologia: state.currentPatient.patologia,
    sesion_n: state.currentSession.n,
    eva_reposo: state.currentSession.eva_reposo,
    eva_movimiento: state.currentSession.eva_movimiento,
    ejercicios: state.currentSession.ejerciciosSeleccionados,
    agentes: state.currentSession.agentesSeleccionados,
    notas: state.currentSession.notas,
    fecha: new Date().toISOString()
  };

  // Guardar en la nube (Backend)
  fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'saveSesion', sesion: sessionData })
  })
  .then(() => {
    showToast('✅ Sesión guardada y sincronizada');
    resetTimer();
    showView('dashboard-view'); 
  })
  .catch(() => {
    // Guardado offline (Cola local)
    const queue = JSON.parse(localStorage.getItem('kf_queue') || '[]');
    queue.push(sessionData);
    localStorage.setItem('kf_queue', JSON.stringify(queue));
    showToast('⚠️ Sin internet. Sesión guardada localmente.');
    resetTimer();
    showView('dashboard-view');
  });
}

function sendWhatsApp() {
  const phone = state.currentPatient.telefono;
  if (!phone) return showToast('El paciente no tiene teléfono cargado', true);

  // Formatear mensaje lindo para el paciente
  let msg = `*Plan de Rehabilitación - KineFlow*\n\n`;
  msg += `¡Hola ${state.currentPatient.nombre}! 👋\n`;
  msg += `Acá tenés el resumen de tu sesión de hoy:\n\n`;
  
  if (state.currentSession.ejerciciosSeleccionados.length > 0) {
    msg += `*🏋️ Ejercicios para hacer en casa:*\n`;
    state.currentSession.ejerciciosSeleccionados.forEach((ej, i) => msg += `${i+1}. ${ej}\n`);
    msg += `\n*Dosis sugerida:* 2-3 series de 10 repeticiones, sin dolor.\n\n`;
  } else {
    msg += `_No se cargaron ejercicios para hoy._\n\n`;
  }
  
  if (state.currentSession.agentesSeleccionados.length > 0) {
    msg += `*⚡ Agentes físicos aplicados en consultorio:*\n`;
    state.currentSession.agentesSeleccionados.forEach(ag => msg += `- ${ag}\n`);
    msg += `\n`;
  }

  msg += `_Cualquier duda que tengas, escribime por acá. ¡A seguir mejorando!_ 💪`;

  // Abrir WhatsApp
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

// ============================================================
// 6. UTILIDADES
// ============================================================
function showToast(msg, isError = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast show ${isError ? 'error' : ''}`;
  setTimeout(() => t.className = 'toast hidden', 3500);
}
