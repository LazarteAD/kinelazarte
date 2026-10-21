/* ============================================================
   KINEFLOW - Catálogo Masivo de Patologías (190+)
   ============================================================ */

const AGENTES = {
  calor: { nombre: "Termoterapia", dosis: "15-20 min", contra: ["cancer","tvp","infeccion","sensib"] },
  frio: { nombre: "Crioterapia", dosis: "10-15 min", contra: ["sensib"] },
  tens: { nombre: "TENS", dosis: "20-30 min", contra: ["cardio","marcapasos","infeccion","embarazo"] },
  magneto: { nombre: "Magnetoterapia", dosis: "20-30 min", contra: ["cardio","marcapasos","implante","cancer"] },
  us: { nombre: "Ultrasonido", dosis: "5-8 min", contra: ["cancer","tvp","infeccion"] },
  manual: { nombre: "Terapia Manual", dosis: "Movilización", contra: ["osteoporosis","cancer","tvp"] },
  puncion: { nombre: "Punción Seca", dosis: "10-20 seg", contra: ["anticoagulantes","cardio"] }
};

const SESIONES_PLAN = [
  { n: 1, fase: "Evaluación y Movilidad Protegida" },
  { n: 2, fase: "Movilidad y Control" },
  { n: 3, fase: "Activación Muscular" },
  { n: 4, fase: "Consolidación de Control" },
  { n: 5, fase: "Reevaluación y Primera Carga" },
  { n: 6, fase: "Fuerza Progresiva" },
  { n: 7, fase: "Consolidación de Fuerza" },
  { n: 8, fase: "Transferencia Funcional" },
  { n: 9, fase: "Integración Funcional" },
  { n: 10, fase: "Alta" }
];

const ej = (nombre, series, reps, tiempo, descanso) => ({ nombre, series, reps, tiempo, descanso });
const F="frio", T="tens", C="calor", M="manual", U="us", G="magneto";

const DB = {
  // --- COLUMNA LUMBAR ---
  lumbalgia: { nombre: "Lumbalgia mecánica", test: "Test de Lasègue", bib: "Kapandji, T.1; Neumann", agentes: [C,T,M], ejercicios: { consultorio: [ej("Movilidad pélvica", 2, 10, "3 min", "30s"), ej("Activación de core", 3, 10, "5 min", "45s"), ej("Puente de glúteos", 3, 12, "4 min", "45s")], casa: [ej("Sit-to-stand", 3, 10, "5 min", "60s"), ej("Caminata", 1, 1, "10 min", "0s")] } },
  hernia_lumbar: { nombre: "Hernia discal lumbar", test: "Slump test", bib: "Kapandji, T.1", agentes: [T,C], ejercicios: { consultorio: [ej("Movilización neural", 3, 10, "5 min", "45s"), ej("Extensión en prono", 3, 10, "4 min", "60s")], casa: [ej("Caminata corta", 1, 1, "10 min", "0s"), ej("Rodillas al pecho", 2, 10, "3 min", "30s")] } },
  ciatica: { nombre: "Ciática", test: "Lasègue cruzado", bib: "Kapandji, T.1", agentes: [T,C], ejercicios: { consultorio: [ej("Movilización neural", 3, 10, "5 min", "45s"), ej("Estabilización lumbar", 3, 10, "5 min", "60s")], casa: [ej("Marcha corta", 1, 1, "10 min", "0s"), ej("Bisagra de cadera", 3, 10, "5 min", "60s")] } },
  estenosis_lumbar: { nombre: "Estenosis lumbar", test: "Test de la bicicleta", bib: "Neumann", agentes: [C,T], ejercicios: { consultorio: [ej("Flexión de rodillas al pecho", 3, 10, "4 min", "30s"), ej("Bicicleta fija", 1, 1, "15 min", "0s")], casa: [ej("Marcha con carro", 1, 1, "15 min", "120s")] } },
  espondilolistesis: { nombre: "Espondilolistesis", test: "Test de Stork", bib: "Neumann", agentes: [C,T], ejercicios: { consultorio: [ej("Báscula pélvica", 3, 10, "4 min", "30s"), ej("Plancha frontal", 3, 20, "3 min", "45s")], casa: [ej("Sit-to-stand", 3, 10, "5 min", "45s"), ej("Bird-dog", 3, 10, "4 min", "45s")] } },
  facetario: { nombre: "Síndrome facetario", test: "Test de Kemp", bib: "Neumann", agentes: [C,T,M], ejercicios: { consultorio: [ej("Rodillas al pecho", 3, 10, "4 min", "30s"), ej("Bird-dog", 3, 10, "4 min", "45s")], casa: [ej("Gato-camello", 2, 10, "3 min", "30s"), ej("Puente de glúteos", 3, 12, "4 min", "45s")] } },
  
  // --- COLUMNA CERVICAL Y DORSAL ---
  cervicalgia: { nombre: "Cervicalgia mecánica", test: "Spurling", bib: "Kapandji, T.3", agentes: [C,M], ejercicios: { consultorio: [ej("Movilidad cervical", 2, 10, "4 min", "30s"), ej("Chin tuck", 3, 10, "3 min", "30s")], casa: [ej("Chin tuck sentado", 3, 10, "3 min", "30s"), ej("Corrección postural", 2, 10, "4 min", "30s")] } },
  cervicobraquialgia: { nombre: "Cervicobraquialgia", test: "Cluster de Wainner", bib: "Neumann", agentes: [T,C], ejercicios: { consultorio: [ej("Retracción cervical", 3, 10, "3 min", "30s"), ej("Deslizamiento neural", 3, 10, "4 min", "45s")], casa: [ej("Remo con banda", 3, 12, "4 min", "45s"), ej("Postura", 2, 10, "4 min", "30s")] } },
  dorsalgia: { nombre: "Dorsalgia mecánica", test: "Palpación segmentaria", bib: "Neumann", agentes: [C,T,M], ejercicios: { consultorio: [ej("Extensión torácica", 3, 10, "4 min", "30s"), ej("Rotación torácica", 3, 10, "4 min", "30s")], casa: [ej("Y-T-W en prono", 3, 10, "4 min", "45s"), ej("Remo con banda", 3, 12, "4 min", "45s")] } },
  escoliosis: { nombre: "Escoliosis", test: "Test de Adams", bib: "SOSORT", agentes: [M], ejercicios: { consultorio: [ej("Elongación axial", 3, 10, "4 min", "30s"), ej("Respiración rotacional", 3, 10, "5 min", "45s")], casa: [ej("Auto-corrección", 3, 10, "4 min", "30s"), ej("Plancha lateral", 3, 20, "3 min", "45s")] } },
  hipercifosis: { nombre: "Hipercifosis", test: "Distancia pared-occipucio", bib: "Neumann", agentes: [C,T], ejercicios: { consultorio: [ej("Extensión torácica en rodillo", 3, 10, "4 min", "30s"), ej("Retracción escapular", 3, 10, "4 min", "45s")], casa: [ej("Remo con banda", 3, 12, "4 min", "45s"), ej("Postura en pared", 2, 10, "4 min", "30s")] } },

  // --- HOMBRO ---
  hombro_manguito: { nombre: "Manguito rotador", test: "Jobe", bib: "Kapandji, T.1", agentes: [F,U,T], ejercicios: { consultorio: [ej("Péndulos Codman", 3, 15, "4 min", "30s"), ej("Movilidad con bastón", 3, 10, "4 min", "45s"), ej("Manguito en pared", 3, 10, "4 min", "45s")], casa: [ej("Alcance a estantes", 3, 10, "4 min", "45s"), ej("AVD", 1, 1, "10 min", "0s")] } },
  capsulitis: { nombre: "Capsulitis adhesiva", test: "Rotación externa pasiva", bib: "Neumann", agentes: [C,U,M], ejercicios: { consultorio: [ej("Elevación con bastón", 3, 10, "5 min", "45s"), ej("Movilización pasiva", 3, 10, "5 min", "45s")], casa: [ej("Alcance en higiene", 1, 1, "10 min", "0s"), ej("Deslizamiento en pared", 3, 10, "4 min", "30s")] } },
  inestabilidad_hombro: { nombre: "Inestabilidad glenohumeral", test: "Aprensión", bib: "Neumann", agentes: [F,T], ejercicios: { consultorio: [ej("Movilidad pasiva-asistida", 3, 10, "4 min", "45s"), ej("Estabilización rítmica", 3, 10, "4 min", "45s")], casa: [ej("Rotación externa con banda", 3, 12, "4 min", "45s"), ej("Empuje en pared", 3, 10, "4 min", "45s")] } },
  acromioclavicular: { nombre: "Esguince acromioclavicular", test: "Cross-body", bib: "Neumann", agentes: [F,T], ejercicios: { consultorio: [ej("Movilidad pasiva", 3, 10, "4 min", "30s"), ej("Isométricos de deltoides", 3, 10, "3 min", "45s")], casa: [ej("Press en plano escapular", 3, 10, "4 min", "45s"), ej("Remo con banda", 3, 12, "4 min", "45s")] } },
  slap: { nombre: "Lesión labral SLAP", test: "O'Brien", bib: "Neumann", agentes: [F,T], ejercicios: { consultorio: [ej("Movilidad pasiva", 3, 10, "4 min", "30s"), ej("Estiramiento posterior", 3, 30, "3 min", "30s")], casa: [ej("Rotación externa con banda", 3, 12, "4 min", "45s"), ej("Remo con banda", 3, 12, "4 min", "45s")] } },
  tendinopatia_bicipital: { nombre: "Tendinopatía bicipital", test: "Speed", bib: "Kapandji", agentes: [F,U,T], ejercicios: { consultorio: [ej("Movilidad de hombro", 3, 10, "4 min", "30s"), ej("Isométrico de bíceps", 3, 10, "3 min", "45s")], casa: [ej("Flexión de codo excéntrica", 3, 12, "4 min", "45s"), ej("Rotación externa", 3, 12, "4 min", "45s")] } },

  // --- CODO Y MUÑECA ---
  epicondilitis: { nombre: "Epicondilitis lateral", test: "Cozen", bib: "Kapandji, T.1", agentes: [F,U,M], ejercicios: { consultorio: [ej("Movilidad de muñeca", 3, 10, "4 min", "30s"), ej("Isométrico de extensores", 3, 10, "3 min", "45s"), ej("Excéntrico de extensores", 3, 12, "5 min", "45s")], casa: [ej("Tareas livianas", 1, 1, "10 min", "0s"), ej("Agarre funcional", 3, 10, "4 min", "45s")] } },
  epitrocleitis: { nombre: "Epitrocleitis", test: "Flexión resistida", bib: "Kapandji", agentes: [F,U,T], ejercicios: { consultorio: [ej("Movilidad de muñeca", 3, 10, "4 min", "30s"), ej("Isométrico de flexores", 3, 10, "3 min", "45s")], casa: [ej("Tareas livianas", 1, 1, "10 min", "0s"), ej("Agarre funcional", 3, 10, "4 min", "45s")] } },
  tunel_carpiano: { nombre: "Túnel carpiano", test: "Phalen", bib: "Kapandji, T.1", agentes: [F,T], ejercicios: { consultorio: [ej("Deslizamiento del mediano", 3, 10, "4 min", "30s"), ej("Fortalecimiento de pinza", 3, 12, "4 min", "45s")], casa: [ej("Adaptación ergonómica", 1, 1, "10 min", "0s"), ej("Prensión con pausas", 3, 10, "4 min", "45s")] } },
  dequervain: { nombre: "De Quervain", test: "Finkelstein", bib: "Kapandji", agentes: [F,U], ejercicios: { consultorio: [ej("Movilidad de pulgar", 3, 10, "4 min", "30s"), ej("Isométrico de pulgar", 3, 10, "3 min", "45s")], casa: [ej("Adaptación de agarre", 1, 1, "10 min", "0s"), ej("Pinza con masilla", 3, 10, "4 min", "45s")] } }
   // ========== CONTINUACIÓN DB ==========
Object.assign(DB, {
  // --- CADERA ---
  gonartrosis: { nombre: "Gonartrosis", test: "McMurray", bib: "Kapandji, T.2", agentes: [C,F,T,G], ejercicios: { consultorio: [ej("Movilidad activa", 3, 10, "5 min", "30s"), ej("Bicicleta", 1, 1, "10 min", "0s"), ej("Cuádriceps isométrico", 3, 10, "4 min", "45s")], casa: [ej("Sit-to-stand", 3, 10, "5 min", "45s"), ej("Escalón bajo", 3, 10, "4 min", "60s")] } },
  coxartrosis: { nombre: "Coxartrosis", test: "FADIR", bib: "Neumann", agentes: [C,T,M], ejercicios: { consultorio: [ej("Movilidad de cadera", 3, 10, "4 min", "30s"), ej("Glúteo medio", 3, 12, "4 min", "45s")], casa: [ej("Sentadilla", 3, 10, "4 min", "45s"), ej("Equilibrio unipodal", 3, 30, "3 min", "45s")] } },
  bursitis_trocanterea: { nombre: "Bursitis trocantérea", test: "Palpación + Trendelenburg", bib: "Neumann", agentes: [F,T,G], ejercicios: { consultorio: [ej("Movilidad de cadera", 3, 10, "4 min", "30s"), ej("Abducción en decúbito", 3, 12, "4 min", "45s")], casa: [ej("Puente glúteo", 3, 12, "4 min", "45s"), ej("Escalones laterales", 3, 10, "4 min", "45s")] } },
  pubalgia: { nombre: "Pubalgia", test: "Aducción resistida", bib: "Kendall", agentes: [F,T,G], ejercicios: { consultorio: [ej("Aducción isométrica", 3, 10, "3 min", "45s"), ej("Movilidad de cadera", 2, 10, "4 min", "30s")], casa: [ej("Marcha lateral", 3, 10, "4 min", "45s"), ej("Sit-to-stand", 3, 10, "4 min", "45s")] } },

  // --- RODILLA ---
  lca: { nombre: "Rehabilitación LCA", test: "Lachman", bib: "Kapandji, T.2", agentes: [F,T,G], ejercicios: { consultorio: [ej("Extensión completa", 3, 10, "4 min", "45s"), ej("Flexión progresiva", 3, 10, "4 min", "45s"), ej("Equilibrio unipodal", 3, 30, "4 min", "45s")], casa: [ej("Marcha simétrica", 1, 1, "10 min", "0s"), ej("Escalones", 3, 10, "5 min", "60s")] } },
  menisco: { nombre: "Lesión meniscal", test: "Thessaly", bib: "Neumann", agentes: [F,T], ejercicios: { consultorio: [ej("Movilidad en rango indoloro", 3, 10, "4 min", "30s"), ej("Cuádriceps isométrico", 3, 10, "4 min", "45s")], casa: [ej("Sit-to-stand", 3, 10, "4 min", "45s"), ej("Escalón bajo", 3, 10, "4 min", "60s")] } },
  patelofemoral: { nombre: "Síndrome patelofemoral", test: "Aprensión rotuliana", bib: "Neumann", agentes: [F,T], ejercicios: { consultorio: [ej("Movilidad de rodilla", 3, 10, "4 min", "30s"), ej("Vasto medial", 3, 10, "4 min", "45s")], casa: [ej("Escalón controlado", 3, 10, "4 min", "45s"), ej("Sentadilla parcial", 3, 10, "4 min", "45s")] } },
  itb: { nombre: "Cintilla iliotibial", test: "Noble", bib: "Kendall", agentes: [F,T], ejercicios: { consultorio: [ej("Estiramiento ITB", 3, 30, "4 min", "30s"), ej("Abducción de cadera", 3, 12, "4 min", "45s")], casa: [ej("Escalones laterales", 3, 10, "4 min", "45s"), ej("Corrección técnica", 1, 1, "10 min", "0s")] } },
  tendinopatia_rotuliana: { nombre: "Tendinopatía rotuliana", test: "Decline squat", bib: "Kendall", agentes: [F,U], ejercicios: { consultorio: [ej("Movilidad de rodilla", 3, 10, "4 min", "30s"), ej("Isométrico 60°", 3, 10, "4 min", "45s")], casa: [ej("Sentadilla declive", 3, 12, "4 min", "60s"), ej("Escalón", 3, 10, "4 min", "45s")] } },

  // --- TOBILLO Y PIE ---
  esguince_tobillo: { nombre: "Esguince de tobillo", test: "Cajón anterior", bib: "Kapandji, T.2", agentes: [F,T,U], ejercicios: { consultorio: [ej("Bombeo", 3, 15, "3 min", "30s"), ej("Propiocepción", 3, 30, "4 min", "30s"), ej("Peroneos", 3, 15, "4 min", "45s")], casa: [ej("Equilibrio unipodal", 3, 30, "4 min", "30s"), ej("Marcha funcional", 1, 1, "10 min", "0s")] } },
  fascitis: { nombre: "Fascitis plantar", test: "Windlass", bib: "Neumann", agentes: [F,U], ejercicios: { consultorio: [ej("Estiramiento fascia", 3, 30, "4 min", "30s"), ej("Short foot", 3, 10, "4 min", "45s"), ej("Elevación talones", 3, 15, "4 min", "45s")], casa: [ej("Rodamiento pelota", 3, 30, "3 min", "30s"), ej("Pie sentado", 3, 10, "3 min", "30s")] } },
  aquiles: { nombre: "Tendinopatía de Aquiles", test: "Thompson", bib: "Kendall", agentes: [F,U], ejercicios: { consultorio: [ej("Movilidad tobillo", 3, 10, "4 min", "30s"), ej("Isométrico", 3, 10, "4 min", "45s"), ej("Excéntrico", 3, 10, "5 min", "60s")], casa: [ej("Marcha progresiva", 1, 1, "10 min", "0s"), ej("Saltos suaves", 3, 10, "4 min", "60s")] } },
  metatarsalgia: { nombre: "Metatarsalgia", test: "Squeeze test", bib: "Kapandji", agentes: [F,U], ejercicios: { consultorio: [ej("Movilidad dedos", 3, 15, "3 min", "30s"), ej("Intrínsecos", 3, 10, "4 min", "45s")], casa: [ej("Marcha calzado adecuado", 1, 1, "10 min", "0s"), ej("Equilibrio", 3, 30, "3 min", "30s")] } },

  // --- DESGARROS ---
  desgarro_isquios: { nombre: "Desgarro isquiotibiales", test: "Puranen-Orava", bib: "Kendall", agentes: [F,T,U], ejercicios: { consultorio: [ej("Puente isométrico", 3, 10, "4 min", "45s"), ej("Curl nórdico", 3, 6, "5 min", "90s")], casa: [ej("Marcha controlada", 1, 1, "10 min", "0s"), ej("Peso muerto banda", 3, 10, "5 min", "60s")] } },
  desgarro_cuadriceps: { nombre: "Desgarro cuádriceps", test: "Extensión resistida", bib: "Kendall", agentes: [F,U], ejercicios: { consultorio: [ej("Isométrico", 3, 10, "4 min", "45s"), ej("Deslizamiento talón", 3, 10, "4 min", "45s")], casa: [ej("Elevación pierna recta", 3, 10, "5 min", "45s"), ej("Sentadilla parcial", 3, 10, "4 min", "60s")] } },
  desgarro_aductor: { nombre: "Desgarro aductores", test: "Squeeze test", bib: "Kendall", agentes: [F,T], ejercicios: { consultorio: [ej("Aducción isométrica", 3, 10, "3 min", "45s"), ej("Movilidad cadera", 2, 10, "4 min", "30s")], casa: [ej("Marcha lateral banda", 3, 10, "4 min", "45s"), ej("Sit-to-stand", 3, 10, "4 min", "45s")] } },
  desgarro_gemelo: { nombre: "Desgarro gemelo", test: "Thompson", bib: "Kendall", agentes: [F,T], ejercicios: { consultorio: [ej("Bombeo tobillo", 3, 15, "3 min", "30s"), ej("Isométrico tríceps", 3, 10, "4 min", "45s")], casa: [ej("Marcha talón levantado", 1, 1, "10 min", "0s"), ej("Elevación talones", 3, 15, "4 min", "45s")] } },

  // --- FRACTURAS ---
  fractura_colles: { nombre: "Fractura radio distal", test: "Dinamometría", bib: "Kapandji", agentes: [F,T], ejercicios: { consultorio: [ej("Movilidad dedos", 3, 15, "3 min", "30s"), ej("Prono-supinación", 3, 10, "4 min", "45s")], casa: [ej("Tareas bimanuales", 1, 1, "10 min", "0s"), ej("Apoyo mano", 3, 10, "4 min", "60s")] } },
  fractura_tobillo: { nombre: "Fractura de tobillo", test: "Lunge test", bib: "Neumann", agentes: [F,T], ejercicios: { consultorio: [ej("Movilidad dedos", 3, 15, "3 min", "30s"), ej("Propiocepción", 3, 30, "4 min", "45s")], casa: [ej("Marcha bastones", 1, 1, "10 min", "0s"), ej("Escalón bajo", 3, 10, "4 min", "60s")] } }
});
// ========== CONTINUACIÓN DB ==========
Object.assign(DB, {
  // --- NEUROLOGÍA ---
  acv: { nombre: "ACV / Hemiparesia", test: "Ashworth", bib: "Tortora", agentes: [T], ejercicios: { consultorio: [ej("Movilización pasiva", 3, 10, "6 min", "60s"), ej("Control tronco", 3, 10, "5 min", "45s")], casa: [ej("Transferencias", 3, 10, "5 min", "60s"), ej("AVD", 1, 1, "15 min", "0s")] } },
  parkinson: { nombre: "Parkinson", test: "Hoehn-Yahr", bib: "Tortora", agentes: [], ejercicios: { consultorio: [ej("Movilidad axial", 3, 10, "5 min", "45s"), ej("Equilibrio", 3, 10, "5 min", "60s")], casa: [ej("Marcha pistas", 1, 1, "10 min", "0s"), ej("Giros", 3, 10, "4 min", "45s")] } },
  esclerosis_multiple: { nombre: "Esclerosis Múltiple", test: "T25-FW", bib: "Tortora", agentes: [T], ejercicios: { consultorio: [ej("Movilidad global", 3, 10, "5 min", "45s"), ej("Equilibrio", 3, 30, "4 min", "60s")], casa: [ej("Marcha", 1, 1, "10 min", "0s"), ej("Energía", 1, 1, "10 min", "0s")] } },
  guillain_barre: { nombre: "Guillain-Barré", test: "MRC", bib: "Tortora", agentes: [], ejercicios: { consultorio: [ej("Movilización pasiva", 3, 10, "5 min", "60s"), ej("Control tronco", 3, 10, "4 min", "45s")], casa: [ej("Marcha asistida", 1, 1, "10 min", "0s"), ej("AVD", 1, 1, "15 min", "0s")] } },
  lesion_medular: { nombre: "Lesión medular", test: "ASIA", bib: "Tortora", agentes: [T], ejercicios: { consultorio: [ej("Movilización pasiva", 3, 10, "6 min", "60s"), ej("Control tronco", 3, 10, "5 min", "45s")], casa: [ej("Transferencias", 3, 10, "5 min", "60s"), ej("Propulsión silla", 1, 1, "10 min", "0s")] } },
  paralisis_facial: { nombre: "Parálisis facial", test: "House-Brackmann", bib: "Tortora", agentes: [], ejercicios: { consultorio: [ej("Ejercicios frente espejo", 3, 10, "5 min", "30s"), ej("Masaje facial", 3, 10, "4 min", "30s")], casa: [ej("Elevar cejas", 3, 10, "3 min", "30s"), ej("Sonreír", 3, 10, "3 min", "30s")] } },

  // --- REUMATOLOGÍA ---
  artritis_reumatoide: { nombre: "Artritis Reumatoide", test: "Dinamometría", bib: "Tortora", agentes: [T,F], ejercicios: { consultorio: [ej("Movilidad suave", 3, 10, "5 min", "30s"), ej("Protección articular", 3, 10, "4 min", "30s")], casa: [ej("Ahorro articular", 1, 1, "10 min", "0s"), ej("AVD adaptadas", 1, 1, "10 min", "0s")] } },
  fibromialgia: { nombre: "Fibromialgia", test: "Criterios ACR", bib: "Tortora", agentes: [C,T], ejercicios: { consultorio: [ej("Movilidad suave", 3, 10, "5 min", "30s"), ej("Respiración", 3, 10, "3 min", "30s")], casa: [ej("Marcha", 1, 1, "10 min", "0s"), ej("Pacing", 1, 1, "10 min", "0s")] } },
  osteoporosis: { nombre: "Osteoporosis", test: "Sit-to-stand", bib: "Tortora", agentes: [], ejercicios: { consultorio: [ej("Extensión columna", 3, 10, "4 min", "45s"), ej("Equilibrio", 3, 30, "4 min", "30s")], casa: [ej("Caminata", 1, 1, "15 min", "0s"), ej("Prevención caídas", 3, 10, "4 min", "45s")] } },

  // --- POST QUIRÚRGICOS ---
  protesis_cadera: { nombre: "Prótesis de cadera", test: "TUG", bib: "Neumann", agentes: [F,T], ejercicios: { consultorio: [ej("Bombeo tobillo", 3, 15, "3 min", "30s"), ej("Abducción decúbito", 3, 10, "4 min", "45s"), ej("Puente glúteo", 3, 10, "4 min", "45s")], casa: [ej("Sit-to-stand silla alta", 3, 10, "5 min", "60s"), ej("Marcha andador", 1, 1, "10 min", "0s")] } },
  protesis_rodilla: { nombre: "Prótesis de rodilla", test: "Goniometría", bib: "Neumann", agentes: [F,T], ejercicios: { consultorio: [ej("Deslizamiento talón", 3, 10, "4 min", "45s"), ej("Extensión pasiva", 3, 10, "5 min", "45s"), ej("Cuádriceps isométrico", 3, 10, "4 min", "45s")], casa: [ej("Mini sentadilla", 3, 10, "4 min", "60s"), ej("Marcha bastones", 1, 1, "10 min", "0s")] } },

  // --- OTROS ---
  sindrome_piriforme: { nombre: "Síndrome piriforme", test: "FAIR", bib: "Kendall", agentes: [C,T], ejercicios: { consultorio: [ej("Estiramiento piriforme", 3, 30, "4 min", "30s"), ej("Glúteo medio", 3, 12, "4 min", "45s")], casa: [ej("Sentadilla banda", 3, 10, "4 min", "45s"), ej("Pausas sedestación", 1, 1, "10 min", "0s")] } },
  cefalea_tensional: { nombre: "Cefalea tensional", test: "Palpación pericraneal", bib: "Kendall", agentes: [C,T], ejercicios: { consultorio: [ej("Movilidad cervical", 3, 10, "4 min", "30s"), ej("Respiración", 3, 10, "3 min", "30s")], casa: [ej("Chin tuck", 3, 10, "3 min", "30s"), ej("Relajación", 1, 1, "10 min", "0s")] } },
  vertigo: { nombre: "Vértigo (VPPB)", test: "Dix-Hallpike", bib: "Tortora", agentes: [], ejercicios: { consultorio: [ej("Maniobra Epley", 1, 1, "5 min", "0s"), ej("Movimientos cefálicos", 3, 10, "4 min", "30s")], casa: [ej("Brandt-Daroff", 3, 10, "5 min", "30s"), ej("Equilibrio", 3, 30, "3 min", "30s")] } }
});
