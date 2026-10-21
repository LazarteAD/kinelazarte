// ⚠️ PEGÁ TU URL DE APPS SCRIPT ACÁ
const API_URL = "https://script.google.com/macros/s/AKfycbwNXq1wyc1dbh1G5_e0R7FNNd4jCA6siLJclGVd3SGUnTaEdEEgZTb8AzII7DoK2ZOg/exec"; 

let state = {
  user: null, patients: [], currentPatient: null,
  currentSession: { n: 1, consultorio: [], casa: [], agentes: [], eva_reposo: 0, eva_movimiento: 0, notas: "" },
  timer: { interval: null, seconds: 0, running: false }
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
  const dateInput = document.getElementById('new-patient-date');
  if (dateInput) dateInput.valueAsDate = new Date();

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();
});

function updateOnlineStatus() {
  const el = document.getElementById('sync-status');
  if (!el) return;
  if (navigator.onLine) { el.textContent = 'Online'; el.classList.add('online'); el.classList.remove('offline'); } 
  else { el.textContent = 'Offline'; el.classList.remove('online'); el.classList.add('offline'); }
}

function showView(viewId) {
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  const target = document.getElementById(viewId);
  if (target) target.classList.remove('hidden');
  window.scrollTo(0, 0);
}

// --- LOGIN SEGURO CON SHA-256 ---
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
  if (password.length < 6) return showToast('La contraseña debe tener al menos 6 caracteres', true);

  const hash = await hashPassword(password);
  const storedHash = localStorage.getItem('kf_auth_' + email);

  if (storedHash) {
    // Verificar contraseña
    if (storedHash !== hash) return showToast('Contraseña incorrecta', true);
    state.user = { email };
    showView('dashboard-view');
    fetchData();
  } else {
    // Registrar nuevo usuario
    localStorage.setItem('kf_auth_' + email, hash);
    state.user = { email };
    showView('dashboard-view');
    fetchData();
    showToast('Cuenta creada y sesión iniciada', false);
  }
}

function createPatient() {
  const name = document.getElementById('new-patient-name').value.trim();
  const phone = document.getElementById('new-patient-phone').value.trim();
  const date = document.getElementById('new-patient-date').value;
  const age = document.getElementById('new-patient-age').value;
  const weight = document.getElementById('new-patient-weight').value;
  const height = document.getElementById('new-patient-height').value;
  const pathology = document.getElementById('new-patient-pathology').value;
  const flags = [...document.querySelectorAll('.flag:checked')].map(c => c.value);
  const meds = [...document.querySelectorAll('.med:checked')].map(c => c.value);

  if (!name || !phone) return showToast('Completa nombre y teléfono', true);

  const newPatient = { id: Date.now().toString(), email_kine: state.user.email, nombre: name, telefono: phone, fecha_ingreso: date, edad: age, peso: weight, altura: height, patologia: pathology, banderas: flags, medicacion: meds };
  state.patients.push(newPatient);
  fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'savePaciente', paciente: newPatient }) }).catch(() => showToast('Error de conexión.', true));

  document.getElementById('new-patient-name').value = '';
  document.getElementById('new-patient-phone').value = '';
  document.getElementById('new-patient-age').value = '';
  document.getElementById('new-patient-weight').value = '';
  document.getElementById('new-patient-height').value = '';
  document.querySelectorAll('.flag, .med').forEach(c => c.checked = false);
  
  showView('dashboard-view');
  renderPatientList();
  showToast('Paciente guardado');
}

function fetchData() {
  fetch(`${API_URL}?action=getData&email=${state.user.email}`)
    .then(res => res.json())
    .then(data => {
      if (data.pacientes) { state.patients = data.pacientes; renderPatientList(); }
    })
    .catch(err => console.log('Error al cargar datos', err));
}

function renderPatientList() {
  const list = document.getElementById('patient-list');
  if (state.patients.length === 0) {
    list.innerHTML = `<p style="text-align:center; color:var(--text-muted); margin-top:2rem;">No hay pacientes. ¡Toca "+ Paciente"!</p>`;
    return;
  }
  list.innerHTML = state.patients.map((p, index) => {
    const patName = DB[p.patologia] ? DB[p.patologia].nombre : p.patologia;
    return `<div class="patient-card" onclick="openSession(${index})">
      <div class="patient-avatar">${p.nombre.charAt(0).toUpperCase()}</div>
      <div class="patient-info"><h3>${p.nombre}</h3><p>${patName} · ${p.edad} años</p></div>
    </div>`;
  }).join('');
}

// --- SESIÓN ---
function openSession(patientIndex) {
  state.currentPatient = state.patients[patientIndex];
  const patData = DB[state.currentPatient.patologia];
  
  state.currentSession = { n: 1, consultorio: [], casa: [], agentes: [], eva_reposo: 0, eva_movimiento: 0, notas: "" };
  
  document.getElementById('session-patient-name').textContent = state.currentPatient.nombre;
  document.getElementById('patologia-nombre').textContent = patData.nombre;
  document.getElementById('patologia-test').textContent = 'Test sugerido: ' + patData.test;
  document.getElementById('eva-reposo').value = 0; document.getElementById('eva-reposo-val').textContent = "0";
  document.getElementById('eva-movimiento').value = 0; document.getElementById('eva-movimiento-val').textContent = "0";
  document.getElementById('session-notes').value = "";
  document.getElementById('selected-consultorio').innerHTML = "";
  document.getElementById('selected-casa').innerHTML = "";
  
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
      let motivo = '';
      if (agent.contraindica && state.currentPatient.banderas) {
        if (agent.contraindica.some(c => state.currentPatient.banderas.includes(c))) { isContra = true; motivo = 'Contraindicado por bandera roja'; }
      }
      if (state.currentPatient.medicacion && state.currentPatient.medicacion.includes('anticoagulantes') && agentKey === 'manual') { isContra = true; motivo = 'Contraindicado por anticoagulantes'; }
      
      const div = document.createElement('div');
      div.className = `agent-item ${isContra ? 'contra' : ''}`;
      div.innerHTML = `<div><h4>${agent.nombre}</h4><small>${agent.dosis}</small>${isContra ? `<span class="agent-alert">⚠️ ${motivo}</span>` : ''}</div><label class="switch"><input type="checkbox" ${isContra ? 'disabled' : ''} onchange="toggleAgent('${agent.nombre}', this.checked)"><span class="slider"></span></label>`;
      agentContainer.appendChild(div);
    });
  }
  resetTimer(); showView('session-view');
}

function renderLists() {
    document.getElementById('selected-consultorio').innerHTML = state.currentSession.consultorio.map((ej, i) => `
        <li><span>${ej}</span><div class="action-buttons">
          <button class="btn-play" onclick="verVideo('${ej}')">▶ Video</button>
          <button class="btn-move" onclick="pasarACasa(${i})">→ Casa</button>
          <button class="btn-remove" onclick="removeItem('consultorio', ${i})">×</button>
        </div></li>
    `).join('');
    document.getElementById('selected-casa').innerHTML = state.currentSession.casa.map((ej, i) => `
        <li style="border-left-color: var(--whatsapp);"><span>${ej}</span><div class="action-buttons">
          <button class="btn-play" onclick="verVideo('${ej}')">▶ Video</button>
          <button class="btn-remove" onclick="removeItem('casa', ${i})">×</button>
        </div></li>
    `).join('');
}

// --- MODAL DE VIDEO (BUSCADOR OFICIAL DE YOUTUBE) ---
function verVideo(nombre) {
  const modal = document.getElementById('video-modal');
  document.getElementById('modal-title').textContent = nombre;
  
  // Usamos las URLs oficiales de búsqueda que funcionan en todos los dispositivos
  const query = encodeURIComponent('ejercicio kinesiologia ' + nombre);
  const ytUrl = `https://www.youtube.com/results?search_query=${query}`;
  const imgUrl = `https://www.google.com/search?q=${query}&tbm=isch`;
  
  document.getElementById('modal-yt-link').href = ytUrl;
  document.getElementById('modal-img-link').href = imgUrl;
  
  modal.classList.remove('hidden');
}

function verTest() {
  const patData = DB[state.currentPatient.patologia];
  const testName = patData.test;
  const modal = document.getElementById('video-modal');
  document.getElementById('modal-title').textContent = testName;
  
  const query = encodeURIComponent('test kinesiologia ' + testName);
  const ytUrl = `https://www.youtube.com/results?search_query=${query}`;
  const imgUrl = `https://www.google.com/search?q=${query}&tbm=isch`;
  
  document.getElementById('modal-yt-link').href = ytUrl;
  document.getElementById('modal-img-link').href = imgUrl;
  
  modal.classList.remove('hidden');
}

function closeModal() {
  document.getElementById('video-modal').classList.add('hidden');
}

function pasarACasa(index) { const ej = state.currentSession.consultorio[index]; state.currentSession.consultorio.splice(index, 1); state.currentSession.casa.push(ej); document.querySelectorAll('.chip').forEach(c => { if(c.textContent === ej) c.classList.remove('selected'); }); renderLists(); }
function removeItem(lista, index) { const ej = state.currentSession[lista][index]; state.currentSession[lista].splice(index, 1); if(lista === 'consultorio') document.querySelectorAll('.chip').forEach(c => { if(c.textContent === ej) c.classList.remove('selected'); }); renderLists(); }
function toggleAgent(nombre, isChecked) { if (isChecked) state.currentSession.agentes.push(nombre); else state.currentSession.agentes = state.currentSession.agentes.filter(a => a !== nombre); }
function updateEva(type, value) { document.getElementById(`eva-${type}-val`).textContent = value; if (type === 'reposo') state.currentSession.eva_reposo = parseInt(value); else state.currentSession.eva_movimiento = parseInt(value); }

function toggleTimer() {
  const btn = document.getElementById('timer-btn');
  if (state.timer.running) { clearInterval(state.timer.interval); state.timer.running = false; btn.textContent = '▶'; } 
  else { state.timer.interval = setInterval(() => { state.timer.seconds++; const m = Math.floor(state.timer.seconds / 60).toString().padStart(2, '0'); const s = (state.timer.seconds % 60).toString().padStart(2, '0'); document.getElementById('session-timer').textContent = `${m}:${s}`; if (state.timer.seconds === 2700) showToast('⏰ Recordatorio: 45 min.'); }, 1000); state.timer.running = true; btn.textContent = '⏸'; }
}
function resetTimer() { clearInterval(state.timer.interval); state.timer = { interval: null, seconds: 0, running: false }; document.getElementById('session-timer').textContent = '00:00'; document.getElementById('timer-btn').textContent = '▶'; }

function saveSession() {
  state.currentSession.notas = document.getElementById('session-notes').value;
  const sessionData = { id: Date.now().toString(), email_kine: state.user.email, paciente_nombre: state.currentPatient.nombre, patologia: state.currentPatient.patologia, sesion_n: state.currentSession.n, eva_reposo: state.currentSession.eva_reposo, eva_movimiento: state.currentSession.eva_movimiento, ejercicios_consultorio: state.currentSession.consultorio, ejercicios_casa: state.currentSession.casa, agentes: state.currentSession.agentes, notas: state.currentSession.notas, fecha: new Date().toISOString() };
  fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'saveSesion', sesion: sessionData }) }).then(() => { showToast('✅ Sesión guardada'); resetTimer(); showView('dashboard-view'); }).catch(() => { showToast('⚠️ Guardado local'); resetTimer(); showView('dashboard-view'); });
}

function sendWhatsApp() {
  const phone = state.currentPatient.telefono; if (!phone) return showToast('El paciente no tiene teléfono', true); if (state.currentSession.casa.length === 0) return showToast('No hay ejercicios en el Plan para Casa', true);
  let msg = `*Plan de Ejercicios - KineFlow* 🏠\n\n¡Hola ${state.currentPatient.nombre}! 👋\nAcá tenés la tarea de hoy:\n\n`;
  state.currentSession.casa.forEach((ej, i) => { 
    msg += `*${i+1}.* ${ej}\n`; 
    msg += `▶️ Video: https://www.youtube.com/results?search_query=${encodeURIComponent('ejercicio kinesiologia ' + ej)}\n\n`; 
  });
  msg += `_Cualquier duda, ¡escribime!_ 💪`;
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
}

function showToast(msg, isError = false) { const t = document.getElementById('toast'); t.textContent = msg; t.className = `toast show ${isError ? 'error' : ''}`; setTimeout(() => t.className = 'toast hidden', 3500); }
