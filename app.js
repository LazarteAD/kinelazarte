const API_URL = "https://script.google.com/macros/s/AKfycbyErK_S5Wb5EmAkq6QPwnNqPZ9wL2LZS2lwEgR1aYDI5C_eEEVhT-8CGIJN34drhncr/exec"; 
let chartInstance = null;
let calendar = null;

let state = {
  user: null, patients: [], currentPatient: null, turnos: [],
  currentSession: { n: 1, patologia: "", consultorio: [], casa: [], agentes: [], eva_reposo: 0, eva_movimiento: 0, notas: "", zonasDolor: [] }
};

const TIEMPOS_AGENTES = { calor: 15, frio: 10, tens: 20, magneto: 20, us: 8, manual: 15 };
const ZONAS_PATOLOGIA = { lumbalgia: "zone-lumbar", ciatica: "zone-lumbar", hernia_lumbar: "zone-lumbar", cervicalgia: "zone-cuello", hombro_manguito: "zone-hombro-izq", capsulitis: "zone-hombro-izq", epicondilitis: "zone-codo-izq", tunel_carpiano: "zone-muneca-izq", gonartrosis: "zone-rodilla-izq", lca: "zone-rodilla-izq", esguince_tobillo: "zone-tobillo-izq", fascitis: "zone-tobillo-izq" };

document.addEventListener('DOMContentLoaded', () => { showView('login-view'); checkPendingSync(); });
function showView(viewId) { document.querySelectorAll('.view').forEach(v => v.classList.add('hidden')); const target = document.getElementById(viewId); if (target) target.classList.remove('hidden'); window.scrollTo(0, 0); }

async function hashPassword(password) { const encoder = new TextEncoder(); const data = encoder.encode(password); const hashBuffer = await crypto.subtle.digest('SHA-256', data); const hashArray = Array.from(new Uint8Array(hashBuffer)); return hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); }

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
  showView('dashboard-view'); renderPatientList(); syncPendingData();
}

function checkPendingSync() {
  window.addEventListener('online', () => { const el = document.getElementById('sync-status'); if(el) { el.textContent = 'Online'; el.classList.add('online'); } });
  window.addEventListener('offline', () => { const el = document.getElementById('sync-status'); if(el) { el.textContent = 'Offline'; el.classList.remove('online'); } });
}

function generarNumeroPaciente() { const maxNum = state.patients.reduce((max, p) => { const num = parseInt(p.numero?.replace('PAC-', '') || '0'); return num > max ? num : max; }, 0); return 'PAC-' + String(maxNum + 1).padStart(3, '0'); }

function createPatient() {
  const name = document.getElementById('new-patient-name').value.trim();
  const phone = document.getElementById('new-patient-phone').value.trim();
  const age = document.getElementById('new-patient-age').value;
  const weight = document.getElementById('new-patient-weight').value;
  const activity = document.getElementById('new-patient-activity').value;
  const anamnesis = document.getElementById('new-patient-anamnesis').value.trim();
  const meds = document.getElementById('new-patient-meds').value.trim();
  const redFlags = [...document.querySelectorAll('.red-flag:checked')].map(c => c.value);
  const yellowFlags = [...document.querySelectorAll('.yellow-flag:checked')].map(c => c.value);

  if (!name || !phone) return showToast('Completa nombre y teléfono', true);
  const numero = generarNumeroPaciente();
  const newPatient = { numero, nombre: name, telefono: phone, edad: age, peso: weight, nivelActividad: activity, anamnesis, medicacionTexto: meds, banderasRojas: redFlags, banderasAmarillas: yellowFlags, patologias: [], sesionesCompletadas: {}, historial: {} };
  state.patients.push(newPatient);
  localStorage.setItem('kf_patients_' + state.user.email, JSON.stringify(state.patients));
  document.getElementById('new-patient-name').value = ''; document.getElementById('new-patient-phone').value = ''; document.getElementById('new-patient-anamnesis').value = ''; document.getElementById('new-patient-meds').value = '';
  document.querySelectorAll('.red-flag, .yellow-flag').forEach(c => c.checked = false);
  showView('dashboard-view'); renderPatientList(); showToast(`Paciente ${numero} creado. Agregale una patología.`);
}

function renderPatientList() {
  const list = document.getElementById('patient-list');
  if (state.patients.length === 0) { list.innerHTML = `<p style="text-align:center; color:var(--text-muted); margin-top:2rem;">No hay pacientes. ¡Toca "+"!</p>`; return; }
  list.innerHTML = state.patients.map((p, index) => {
    const numPats = (p.patologias || []).length;
    return `<div class="patient-card" style="display:flex; justify-content:space-between; align-items:center;">
      <div style="display:flex; align-items:center; gap:15px; cursor:pointer; flex:1;" onclick="abrirPaciente(${index})">
        <div class="patient-avatar">${p.nombre.charAt(0).toUpperCase()}</div>
        <div class="patient-info"><h3>${p.numero} - ${p.nombre}</h3><p>${numPats} patología(s) · ${p.edad} años</p></div>
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
    <div class="header-actions"><h2>${p.numero} - ${p.nombre}</h2><button onclick="showView('dashboard-view'); renderPatientList();" class="btn-text">← Volver</button></div>
    <div class="card">
      <div class="anamnesis-card card"><h3>📋 Anamnesis</h3><p style="font-style:italic;">"${p.anamnesis || 'Sin anamnesis'}"</p>${p.medicacionTexto ? `<div style="background:var(--warning-bg); padding:8px; border-radius:6px; margin-top:10px; font-size:0.85rem;"><b>💊 ${p.medicacionTexto}</b></div>` : ''}</div>
      <h3 style="margin-top:20px;">Patologías</h3>`;
  if (p.patologias.length === 0) html += `<p class="sub">No hay patologías.</p>`;
  else html += p.patologias.map((pat, i) => {
      const completadas = (p.sesionesCompletadas && p.sesionesCompletadas[pat]) || 0;
      return `<div style="padding:12px; background:var(--bg); border-radius:10px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
        <div onclick="iniciarSesion('${pat}')" style="flex:1; cursor:pointer;"><b>${DB[pat] ? DB[pat].nombre : pat}</b><p style="font-size:0.8rem; color:var(--text-muted); margin:4px 0 0;">Sesión ${completadas}/10</p></div>
        <button onclick="event.stopPropagation(); eliminarPatologia('${pat}')" class="btn-delete" style="font-size:0.7rem;">🗑️</button>
      </div>`;
    }).join('');
  html += `<button onclick="agregarPatologia()" class="btn-primary mt-2">+ Agregar otra patología</button></div></div>`;
  const temp = document.createElement('div'); temp.innerHTML = html; document.body.appendChild(temp); window.scrollTo(0, 0);
}

function agregarPatologia() {
  const p = state.currentPatient;
  const patologiasDisponibles = Object.keys(DB).filter(k => !(p.patologias || []).includes(k));
  let opciones = patologiasDisponibles.map(k => `<option value="${k}">${DB[k].nombre}</option>`).join('');
  let html = `<div class="view"><div class="header-actions"><h2>Agregar Patología a ${p.numero}</h2><button onclick="showView('dashboard-view'); renderPatientList();" class="btn-text">Cancelar</button></div><div class="card"><label>Patología</label><select id="nueva-patologia">${opciones}</select><button onclick="confirmarPatologia()" class="btn-primary mt-2">Agregar</button></div></div>`;
  const temp = document.createElement('div'); temp.innerHTML = html; document.body.appendChild(temp);
}

function confirmarPatologia() {
  const pat = document.getElementById('nueva-patologia').value;
  const p = state.currentPatient;
  if (!p.patologias) p.patologias = [];
  if (!p.sesionesCompletadas) p.sesionesCompletadas = {};
  if (!p.historial) p.historial = {};
  if (!p.patologias.includes(pat)) { p.patologias.push(pat); p.sesionesCompletadas[pat] = 0; p.historial[pat] = []; }
  localStorage.setItem('kf_patients_' + state.user.email, JSON.stringify(state.patients));
  document.body.lastChild.remove(); showView('dashboard-view'); renderPatientList(); showToast('Patología agregada');
}

function eliminarPatologia(pat) {
  if (!confirm(`¿Eliminar ${DB[pat].nombre}?`)) return;
  const p = state.currentPatient;
  p.patologias = p.patologias.filter(x => x !== pat); delete p.sesionesCompletadas[pat]; delete p.historial[pat];
  localStorage.setItem('kf_patients_' + state.user.email, JSON.stringify(state.patients));
  document.body.lastChild.remove(); mostrarPatologiasPaciente();
}

function toggleZone(zoneId) {
  const el = document.getElementById(zoneId); if (!el) return;
  el.classList.toggle('active');
  if (!state.currentSession.zonasDolor) state.currentSession.zonasDolor = [];
  if (el.classList.contains('active')) { if (!state.currentSession.zonasDolor.includes(zoneId)) state.currentSession.zonasDolor.push(zoneId); }
  else { state.currentSession.zonasDolor = state.currentSession.zonasDolor.filter(z => z !== zoneId); }
  actualizarResumenZonas();
}

function actualizarResumenZonas() {
  const el = document.getElementById('pain-zones-summary'); if (!el) return;
  const count = (state.currentSession.zonasDolor || []).length;
  if (count === 0) { el.textContent = "No has seleccionado ninguna zona de dolor."; el.style.color = "var(--text-muted)"; }
  else { el.textContent = `Has marcado ${count} zona(s) de dolor.`; el.style.color = "var(--danger)"; }
}

function iniciarSesion(pat) {
  const p = state.currentPatient;
  const patData = DB[pat];
  const completadas = (p.sesionesCompletadas && p.sesionesCompletadas[pat]) || 0;
  state.currentSession = { n: completadas + 1, patologia: pat, consultorio: [], casa: [], agentes: [], eva_reposo: 0, eva_movimiento: 0, notas: "", zonasDolor: [] };
  document.body.querySelectorAll('.view').forEach(v => { if (v !== document.getElementById('dashboard-view') && v !== document.getElementById('session-view')) v.remove(); });
  document.getElementById('session-patient-name').textContent = `${p.numero} - ${p.nombre}`;
  document.getElementById('patologia-nombre').textContent = patData.nombre;
  document.getElementById('patologia-test').innerHTML = `Test: <b>${patData.test}</b><br><small>📚 ${patData.bib}</small>`;
  let flagsHTML = '';
  if (p.banderasRojas && p.banderasRojas.length > 0) flagsHTML += `<div class="alert red">🚩 Banderas Rojas: ${p.banderasRojas.join(', ')}</div>`;
  if (p.banderasAmarillas && p.banderasAmarillas.length > 0) flagsHTML += `<div class="alert yellow">🟡 Banderas Amarillas: ${p.banderasAmarillas.join(', ')}</div>`;
  document.getElementById('flags-alert').innerHTML = flagsHTML;
  document.querySelectorAll('.zone').forEach(z => z.classList.remove('active'));
  const zonaDefecto = ZONAS_PATOLOGIA[pat];
  if (zonaDefecto) { const el = document.getElementById(zonaDefecto); if (el) { el.classList.add('active'); state.currentSession.zonasDolor = [zonaDefecto]; } }
  actualizarResumenZonas();
  document.getElementById('lista-sesiones').innerHTML = SESIONES_PLAN.map(s => {
    let estado = s.n < completadas ? '✅' : (s.n === completadas + 1 ? '▶️' : '🔒');
    return `<div class="sesion-item ${s.n < completadas ? 'completada' : (s.n > completadas + 1 ? 'bloqueada' : '')}"><span>${estado} <b>${s.n}:</b> ${s.fase}</span></div>`;
  }).join('');
  const ejContainer = document.getElementById('suggested-exercises'); ejContainer.innerHTML = '';
  if (patData.ejercicios) {
    let todos = []; for (const tipo in patData.ejercicios) todos = todos.concat(patData.ejercicios[tipo]);
    todos.forEach(ejercicio => {
      const chip = document.createElement('div'); chip.className = 'chip'; chip.innerHTML = `${ejercicio.nombre} <small>(${ejercicio.series}x${ejercicio.reps})</small>`;
      chip.onclick = () => { if (!state.currentSession.consultorio.find(e => e.nombre === ejercicio.nombre)) { state.currentSession.consultorio.push(ejercicio); chip.classList.add('selected'); renderLists(); } };
      ejContainer.appendChild(chip);
    });
  }
  const agentContainer = document.getElementById('agents-list'); agentContainer.innerHTML = '';
  if (patData.agentes) {
    patData.agentes.forEach(agentKey => {
      const agent = AGENTES[agentKey]; if (!agent) return;
      const isContra = agent.contra && p.banderasRojas && agent.contra.some(c => p.banderasRojas.includes(c));
      const div = document.createElement('div'); div.className = `agent-item ${isContra ? 'contra' : ''}`;
      div.innerHTML = `<div><h4>${agent.nombre}</h4><small>${agent.dosis}</small>${isContra ? `<span class="agent-alert">⚠️ Contraindicado</span>` : ''}</div><input type="checkbox" ${isContra ? 'disabled' : ''} onchange="toggleAgent('${agent.nombre}', this.checked, '${agentKey}')">`;
      agentContainer.appendChild(div);
    });
  }
  document.getElementById('eva-reposo').value = 0; document.getElementById('eva-reposo-val').textContent = "0";
  document.getElementById('eva-movimiento').value = 0; document.getElementById('eva-movimiento-val').textContent = "0";
  document.getElementById('session-notes').value = ""; document.getElementById('selected-consultorio').innerHTML = ""; document.getElementById('selected-casa').innerHTML = "";
  showView('session-view'); switchTab('mapa', document.querySelectorAll('.tab-btn')[0]);
}

function renderLists() {
  document.getElementById('selected-consultorio').innerHTML = state.currentSession.consultorio.map((ej, i) => `
    <li><div style="flex:1;"><b>${ej.nombre}</b><br><small style="color:var(--primary); font-weight:bold;">${ej.series} series × ${ej.reps} reps · ${ej.tiempo}</small></div>
    <div class="action-buttons"><button class="btn-play" onclick="verMedia('${ej.nombre}')">▶</button><button class="btn-move" onclick="pasarACasa(${i})">→</button><button class="btn-remove" onclick="removeItem('consultorio', ${i})">×</button></div></li>
  `).join('');
  document.getElementById('selected-casa').innerHTML = state.currentSession.casa.map((ej, i) => `
    <li style="border-left-color:var(--whatsapp);"><div style="flex:1;"><b>${ej.nombre}</b><br><small style="color:var(--whatsapp); font-weight:bold;">${ej.series} series × ${ej.reps} reps</small></div>
    <div class="action-buttons"><button class="btn-play" onclick="verMedia('${ej.nombre}')">▶</button><button class="btn-remove" onclick="removeItem('casa', ${i})">×</button></div></li>
  `).join('');
  calcularTiempoTotal();
}

function calcularTiempoTotal() {
  let minEjercicios = 0;
  state.currentSession.consultorio.forEach(e => { const series = e.series || 3, reps = e.reps || 10, descanso = parseInt(e.descanso) || 45; minEjercicios += (series * (reps * 3 + descanso)) / 60; });
  let minAgentes = 0; state.currentSession.agentes.forEach(a => minAgentes += TIEMPOS_AGENTES[a] || 15);
  const total = Math.round(minEjercicios + minAgentes);
  if (document.getElementById('time-ejercicios')) {
    document.getElementById('time-ejercicios').textContent = Math.round(minEjercicios) + ' min';
    document.getElementById('time-agentes').textContent = minAgentes + ' min';
    document.getElementById('time-total').textContent = total + ' min';
    const alert = document.getElementById('time-alert');
    if (total < 40) alert.textContent = '⚠️ Menos de 40 min.';
    else if (total > 60) alert.textContent = '⚠️ Más de 60 min.';
    else alert.textContent = '✅ Dentro del rango (40-60 min).';
  }
}

function toggleAgent(nombre, checked, key) { if (checked) state.currentSession.agentes.push(key); else state.currentSession.agentes = state.currentSession.agentes.filter(a => a !== key); calcularTiempoTotal(); }
function pasarACasa(i) { const ej = state.currentSession.consultorio.splice(i, 1)[0]; state.currentSession.casa.push(ej); renderLists(); }
function removeItem(lista, i) { state.currentSession[lista].splice(i, 1); renderLists(); }
function updateEva(type, val) { document.getElementById(`eva-${type}-val`).textContent = val; state.currentSession[`eva_${type}`] = parseInt(val); }
function verMedia(nombre) { document.getElementById('modal-title').textContent = nombre; document.getElementById('modal-yt-link').href = `https://www.youtube.com/results?search_query=${encodeURIComponent('ejercicio kinesiologia ' + nombre)}`; document.getElementById('modal-img-link').href = `https://www.google.com/search?q=${encodeURIComponent('ejercicio kinesiologia ' + nombre + ' posicion inicial y final')}&tbm=isch`; document.getElementById('media-modal').classList.remove('hidden'); }
function verTest() { verMedia(DB[state.currentSession.patologia].test); }
function closeModal() { document.getElementById('media-modal').classList.add('hidden'); }

function switchTab(tabId, btn) {
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.add('hidden'));
  document.getElementById('tab-' + tabId).classList.remove('hidden');
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  if (tabId === 'ejercicios') calcularTiempoTotal();
  if (tabId === 'evolucion') renderGrafico();
}

function renderGrafico() {
  const ctx = document.getElementById('chart-evolucion').getContext('2d');
  if (chartInstance) chartInstance.destroy();
  const pat = state.currentSession.patologia;
  const historial = (state.currentPatient.historial && state.currentPatient.historial[pat]) || [];
  if (historial.length === 0) return;
  chartInstance = new Chart(ctx, { type: 'line', data: { labels: historial.map(h => 'S' + h.sesion), datasets: [ { label: 'Reposo', data: historial.map(h => h.eva_reposo), borderColor: '#0f766e', tension: 0.3, fill: true, backgroundColor: 'rgba(15,118,110,0.1)' }, { label: 'Movimiento', data: historial.map(h => h.eva_movimiento), borderColor: '#e11d48', tension: 0.3, fill: true, backgroundColor: 'rgba(225,29,72,0.1)' } ] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 10 } } } });
}

function saveSession() {
  const pat = state.currentSession.patologia;
  const notas = document.getElementById('session-notes').value;
  const p = state.currentPatient;
  if (!p.historial[pat]) p.historial[pat] = [];
  p.historial[pat].push({ sesion: state.currentSession.n, fecha: new Date().toISOString(), eva_reposo: state.currentSession.eva_reposo, eva_movimiento: state.currentSession.eva_movimiento, notas, zonasDolor: state.currentSession.zonasDolor });
  let avanzar = true;
  if (state.currentSession.eva_reposo > 3 || state.currentSession.eva_movimiento > 3) { avanzar = confirm("El dolor es mayor a 3/10. \n\n¿Querés avanzar a la siguiente sesión de todos modos?"); }
  if (avanzar) { if (p.sesionesCompletadas[pat] < state.currentSession.n) p.sesionesCompletadas[pat] = state.currentSession.n; showToast('✅ Sesión guardada. Siguiente desbloqueada.'); }
  else { showToast('✅ Sesión guardada. Paciente se mantiene en la misma sesión.'); }
  localStorage.setItem('kf_patients_' + state.user.email, JSON.stringify(state.patients));
  queueForSync('saveSesion', { ...state.currentSession, email_kine: state.user.email, paciente_numero: p.numero });
  showView('dashboard-view'); renderPatientList();
}

function editarAnamnesis() {
  const p = state.currentPatient;
  const nueva = prompt("Editar Anamnesis:", p.anamnesis);
  if (nueva !== null && nueva.trim() !== "") { p.anamnesis = nueva.trim(); document.getElementById('anamnesis-resumen').textContent = `"${p.anamnesis}"`; localStorage.setItem('kf_patients_' + state.user.email, JSON.stringify(state.patients)); showToast('Anamnesis actualizada'); }
}

function eliminarPaciente(index) { if (confirm(`¿Eliminar a ${state.patients[index].nombre}?`)) { state.patients.splice(index, 1); localStorage.setItem('kf_patients_' + state.user.email, JSON.stringify(state.patients)); renderPatientList(); showToast('Paciente eliminado'); } }

function autocompletarCasa() {
  const pat = state.currentSession.patologia;
  const patData = DB[pat];
  if (patData && patData.ejercicios && patData.ejercicios.casa) {
    patData.ejercicios.casa.forEach(ej => { if (!state.currentSession.casa.find(e => e.nombre === ej.nombre)) state.currentSession.casa.push(ej); });
    renderLists(); showToast('Rutina de casa autocompletada');
  }
}

function imprimirPlanCasa() {
  if (state.currentSession.casa.length === 0) return showToast('No hay ejercicios en casa.', true);
  let html = `<div class="print-header-home"><h1>Plan de Ejercicios para Casa</h1><p><b>Paciente:</b> ${state.currentPatient.numero} - ${state.currentPatient.nombre}</p><p><b>Fecha:</b> ${new Date().toLocaleDateString()}</p></div><ol class="print-list-home">`;
  state.currentSession.casa.forEach(ej => { html += `<li><b>${ej.nombre}</b> - ${ej.series} series × ${ej.reps} reps</li>`; });
  html += `</ol>`;
  document.getElementById('print-home-area').innerHTML = html; document.body.classList.add('printing-home'); window.print(); document.body.classList.remove('printing-home');
}

function exportarHistoria() {
  const p = state.currentPatient;
  let html = `<div class="print-header"><h1>Historia Clínica - ${p.numero}</h1><p><b>${p.nombre}</b> | ${p.edad} años</p><p><b>Anamnesis:</b> ${p.anamnesis || '-'}</p><p><b>Medicación:</b> ${p.medicacionTexto || '-'}</p></div>`;
  (p.patologias || []).forEach(pat => {
    const hist = (p.historial && p.historial[pat]) || [];
    html += `<h2 style="margin-top:20px;">${DB[pat].nombre}</h2><p><b>Test:</b> ${DB[pat].test}</p><p><b>Bibliografía:</b> ${DB[pat].bib}</p>`;
    if (hist.length) {
      html += `<table><tr><th>Sesión</th><th>Fecha</th><th>EVA Reposo</th><th>EVA Movimiento</th><th>Zonas de Dolor</th><th>Notas</th></tr>`;
      hist.forEach(h => html += `<tr><td>${h.sesion}</td><td>${new Date(h.fecha).toLocaleDateString()}</td><td>${h.eva_reposo}/10</td><td>${h.eva_movimiento}/10</td><td>${(h.zonasDolor||[]).join(', ') || '-'}</td><td>${h.notas || '-'}</td></tr>`);
      html += `</table>`;
    }
  });
  document.getElementById('print-area').innerHTML = html; window.print();
}

function sendWhatsApp() {
  if (state.currentSession.casa.length === 0) return showToast('No hay ejercicios en casa.', true);
  let msg = `*Plan de Ejercicios para Casa* 🏠\nHola ${state.currentPatient.nombre}:\n\n`;
  state.currentSession.casa.forEach((ej, i) => { msg += `${i+1}. *${ej.nombre}*\n   ${ej.series} series × ${ej.reps} reps\n   Video: https://www.youtube.com/results?search_query=${encodeURIComponent(ej.nombre)}\n\n`; });
  window.open(`https://wa.me/${state.currentPatient.telefono}?text=${encodeURIComponent(msg)}`, '_blank');
}

function showToast(m, e=false) { const t = document.getElementById('toast'); t.textContent = m; t.className = `toast show ${e ? 'error' : ''}`; setTimeout(() => t.className = 'toast', 3000); }
function queueForSync(action, data) { const queue = JSON.parse(localStorage.getItem('kf_sync_queue') || '[]'); queue.push({ action, data, timestamp: Date.now() }); localStorage.setItem('kf_sync_queue', JSON.stringify(queue)); }
async function syncPendingData() {
  const queue = JSON.parse(localStorage.getItem('kf_sync_queue') || '[]');
  if (queue.length === 0 || !API_URL || API_URL === "TU_URL_AQUI") return;
  const remaining = [];
  for (const item of queue) {
    try { const r = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: item.action, ...item.data }), redirect: 'follow' }); if (!(await r.json()).success) throw new Error(); }
    catch (e) { remaining.push(item); }
  }
  localStorage.setItem('kf_sync_queue', JSON.stringify(remaining));
  if (remaining.length === 0) showToast('✅ Sincronizado');
}
