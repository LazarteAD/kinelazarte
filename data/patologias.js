const DB = {};

function P(tipo, nombre, testN, testD, agentes, mov, control, fuerza, fuerzaFunc, funcional, extra) {
  return Object.assign({ tipo, nombre, testN, testD, agentes: agentes || [], mov: mov || [], control: control || [], fuerza: fuerza || [], fuerzaFunc: fuerzaFunc || [], funcional: funcional || [] }, extra || {});
}

const F = "frio", T = "tens", C = "calor", M = "manual", U = "us", G = "magneto";
const AV_FX = "Fractura: respetar inmovilización y carga. Derivar ante dolor, calor o rubor.";
const AV_POP = "Post-operatorio: seguir protocolo del cirujano.";
const AV_DESG = "Desgarro: evitar estiramientos forzados en fase aguda.";

Object.assign(DB, {
  lumbalgia: P("mecanico", "Lumbalgia mecánica", "Test de Lasègue", "Cribado neural.", [C, T, M], ["Movilidad lumbar"], ["Core"], ["Peso muerto"], ["Sit-to-stand"], ["Levantar cargas"], {aviso: "Evitar flexión forzada si hay dolor agudo."}),
  cervicalgia: P("mecanico", "Cervicalgia", "Test de Spurling", "Radiculopatía (alta especificidad).", [C, T, M], ["Movilidad cervical"], ["Chin tuck"], ["Remo"], ["Gesto laboral"], ["Postura"]),
  hombro: P("tendinopatia", "Manguito rotador", "Test de Jobe", "Supraespinoso.", [F, U, T], ["Péndulos"], ["Manguito pared"], ["Rotación banda"], ["Alcance"], ["Gesto overhead"], {aviso: "Evitar movimientos por encima de la cabeza si duele."}),
  rodilla: P("degenerativo", "Gonartrosis", "McMurray", "Meniscal.", [C, F, T], ["Bici"], ["Cuádriceps"], ["Sentadilla"], ["Sit-to-stand"], ["Marcha"]),
  cadera: P("degenerativo", "Coxartrosis", "FADIR", "Pinzamiento.", [C, T, M], ["Movilidad"], ["Glúteo medio"], ["Sentadilla"], ["Equilibrio"], ["Marcha"]),
  tobillo: P("ligamento", "Esguince tobillo", "Cajón anterior", "Inestabilidad.", [F, T, U], ["Bombeo"], ["Propiocepción"], ["Peroneos"], ["Equilibrio"], ["Carrera"], {aviso: "No cargar si hay edema severo."}),
  fascitis: P("tendinopatia", "Fascitis plantar", "Windlass", "Fascia.", [F, U, T], ["Estiramiento"], ["Short foot"], ["Elevación talones"], ["Marcha"], ["Carrera"]),
  epicondilitis: P("tendinopatia", "Epicondilitis", "Cozen", "Extensores.", [F, U, T], ["Movilidad"], ["Isométrico"], ["Excéntrico"], ["Agarre"], ["Gesto"]),
  tunel: P("nervio", "Túnel carpiano", "Phalen", "Mediano.", [F, T], ["Deslizamiento"], ["Postura"], ["Pinza"], ["Ergonomía"], ["Gesto"]),
  neuropatico: P("nervio", "Neuropático", "Slump", "Radicular.", [T], ["Movilización"], ["Control"], ["Fuerza gradual"], ["Marcha"], ["Función"]),
  ciatica: P("hernia", "Ciática", "Lasègue", "Radicular.", [T, C], ["Deslizamiento"], ["Core"], ["Puente"], ["Marcha"], ["Hip hinge"], {aviso: "Derivación urgente si hay déficit motor o alteración de esfínteres."}),
  hernia_lumbar: P("hernia", "Hernia lumbar", "Lasègue cruzado", "Radicular.", [T, C], ["Gato-camello"], ["Bird-dog"], ["Plancha"], ["Sit-to-stand"], ["Hip hinge"]),
  estenosis_lumbar: P("degenerativo", "Estenosis", "Bicicleta", "Claudicación.", [C, T], ["Flexión"], ["Core"], ["Bici"], ["Marcha"], ["Flexión"]),
  facetario: P("degenerativo", "Facetario", "Kemp", "Extensión.", [C, T, M], ["Flexión"], ["Bird-dog"], ["Puente"], ["Marcha"], ["Postura"]),
  espondilolistesis: P("degenerativo", "Espondilolistesis", "Stork", "Pars.", [C, T], ["Báscula"], ["Dead bug"], ["Plancha"], ["Sit-to-stand"], ["Deporte"]),
  piriforme: P("mecanico", "Piriforme", "FAIR", "Glúteo.", [C, T], ["Estiramiento"], ["Glúteo medio"], ["Rotadores"], ["Sentadilla"], ["Sedestación"]),
  sacroileitis: P("mecanico", "Sacroileitis", "Cluster", "Sacroilíaco.", [C, T, M], ["Movilidad"], ["Core"], ["Puente aductores"], ["Marcha"], ["Carga"]),
  hernia_dorsal: P("hernia", "Hernia dorsal", "Slump", "Torácica.", [F, T], ["Extensión"], ["Escapular"], ["Remo"], ["Sit-to-stand"], ["Carga"]),
  dorsalgia: P("mecanico", "Dorsalgia", "Palpación", "Contractura.", [C, T, M], ["Extensión"], ["Y-T-W"], ["Remo"], ["Tórax"], ["Ergonomía"]),
  fractura_vertebral: P("fractura", "Fractura vertebral", "Percusión", "Compresión.", [T, F], ["Respiración"], ["Extensores"], ["Remo"], ["Marcha"], ["Log roll"], {aviso: AV_FX}),
  espondilitis: P("reumatologico", "Espondilitis", "Schober", "Anquilosante.", [C, T], ["Esfinge"], ["Respiración"], ["Extensión"], ["Tórax"], ["Natación"]),
  costillas: P("fractura", "Fractura costillas", "Compresión", "Costal.", [T], ["Respiración"], ["Expansión"], ["Movilidad"], ["Marcha"], ["Tos"], {aviso: AV_FX}),
  cefalea_tensional: P("mecanico", "Cefalea tensional", "Palpación", "Tensional.", [C, T], ["Cervical"], ["Retracción"], ["Profundos"], ["Pausas"], ["Estrés"]),
  latigazo: P("ligamento", "Latigazo", "Quebec", "Whiplash.", [F, T], ["Movilidad"], ["Profundos"], ["Isométrico"], ["Función"], ["Retorno"]),
  rotura_manguito: P("desgarro", "Rotura manguito", "Drop arm", "Rotura.", [F, T], ["Péndulos"], ["Manguito"], ["Rotación"], ["Alcance"], ["Overhead"], {aviso: "En rotura aguda, no forzar elevación."}),
  capsulitis: P("mecanico", "Capsulitis", "Rotación pasiva", "Congelado.", [C, U], ["Movilización"], ["Manguito"], ["Fuerza"], ["AVD"], ["Rango"]),
  inestabilidad_hombro: P("ligamento", "Inestabilidad", "Aprensión", "Glenohumeral.", [F, T], ["Movilidad"], ["Estabilización"], ["Rotación"], ["Control"], ["Deporte"]),
  acromioclavicular: P("ligamento", "AC", "Cross-body", "Acromio.", [F, T], ["Movilidad"], ["Escapular"], ["Press"], ["Carga"], ["Deporte"]),
  fractura_clavicula: P("fractura", "Fx clavícula", "ROM", "Clavícula.", [F, T], ["Codo"], ["Escapular"], ["Remo"], ["AVD"], ["Carga"], {aviso: AV_FX}),
  epitrocleitis: P("tendinopatia", "Epitrocleitis", "Flexión resistida", "Flexores.", [F, U, T], ["Movilidad"], ["Isométrico"], ["Excéntrico"], ["Agarre"], ["Gesto"]),
  dequervain: P("tendinopatia", "De Quervain", "Finkelstein", "Pulgar.", [F, U], ["Pulgar"], ["Isométrico"], ["Pinza"], ["Agarre"], ["Tareas"]),
  tunel_cubital: P("nervio", "Túnel cubital", "Tinel", "Cubital.", [F, T], ["Deslizamiento"], ["Postura"], ["Mano"], ["Ergonomía"], ["Nocturno"]),
  fractura_colles: P("fractura", "Colles", "Dinamometría", "Radio distal.", [F, T], ["Dedos"], ["Prono-sup"], ["Agarre"], ["AVD"], ["Apoyo"], {aviso: AV_FX}),
  esguince_muneca: P("ligamento", "Esguince muñeca", "Fóvea", "TFCC.", [F, T], ["Movilidad"], ["Propiocepción"], ["Fuerza"], ["AVD"], ["Apoyo"]),
  dedo_gatillo: P("tendinopatia", "Dedo gatillo", "Bloqueo", "Polea A1.", [F, U], ["Deslizamiento"], ["Agarre"], ["Masilla"], ["Tareas"], ["Ergonomía"]),
  rizartrosis: P("degenerativo", "Rizartrosis", "Grind", "Pulgar.", [C, T], ["Pulgar"], ["Pinza"], ["Fuerza"], ["Agarre"], ["AVD"]),
  bursitis_trocanterea: P("tendinopatia", "Bursitis trocantérea", "Palpación", "Trocánter.", [F, T], ["Movilidad"], ["Glúteo medio"], ["Abducción"], ["Marcha"], ["Evitar cruce"]),
  gluteo_medio: P("tendinopatia", "Glúteo medio", "Apoyo unipodal", "Tendinopatía.", [F, T], ["Movilidad"], ["Isométrico"], ["Abducción"], ["Marcha"], ["Escalón"]),
  pubalgia: P("tendinopatia", "Pubalgia", "Aducción", "Pubis.", [F, T], ["Movilidad"], ["Core"], ["Aductores"], ["Marcha"], ["Carrera"]),
  fractura_cadera: P("fractura", "Fx cadera", "TUG", "Fémur.", [F, T], ["Isométrico"], ["Transferencia"], ["Sit-to-stand"], ["Marcha"], ["Equilibrio"], {aviso: AV_FX}),
  protesis_cadera: P("postquirurgico", "Prótesis cadera", "TUG", "Artroplastia.", [F, T], ["Tobillo"], ["Transferencia"], ["Abducción"], ["Marcha"], ["Escaleras"], {aviso: AV_POP}),
  desgarro_isquiotibial: P("desgarro", "Isquiotibiales", "Puranen", "Isquio.", [F, T], ["Puente"], ["Puente"], ["Nórdico"], ["Sit-to-stand"], ["Carrera"], {aviso: AV_DESG}),
  patelofemoral: P("mecanico", "Patelofemoral", "Aprensión", "Rótula.", [F, T], ["Movilidad"], ["Valgo"], ["Glúteo"], ["Escalón"], ["Impacto"]),
  tendinopatia_rotuliana: P("tendinopatia", "Rotuliana", "Decline", "Tendón.", [F, U], ["Movilidad"], ["Isométrico"], ["HSR"], ["Escalón"], ["Salto"]),
  lca: P("ligamento", "LCA", "Lachman", "Cruzado.", [F, T], ["Extensión"], ["Equilibrio"], ["Sentadilla"], ["Marcha"], ["Pivote"]),
  lesion_meniscal: P("desgarro", "Menisco", "Thessaly", "Meniscal.", [F, T], ["Movilidad"], ["Cuádriceps"], ["Sentadilla"], ["Escalón"], ["Marcha"]),
  itb: P("tendinopatia", "Cintilla IT", "Noble", "ITB.", [F, T], ["Movilidad"], ["Glúteo medio"], ["Abducción"], ["Escalón"], ["Carrera"]),
  protesis_rodilla: P("postquirurgico", "Prótesis rodilla", "Goniometría", "Artroplastia.", [F, T], ["Talón"], ["Cuádriceps"], ["Sentadilla"], ["Marcha"], ["Escaleras"], {aviso: AV_POP}),
  fractura_rotula: P("fractura", "Fx rótula", "Lag", "Rótula.", [F, T], ["Tobillo"], ["Cuádriceps"], ["SLR"], ["Marcha"], ["Deporte"], {aviso: AV_FX}),
  osgood: P("pediatrico", "Osgood-Schlatter", "Palpación", "Tuberosidad.", [F], ["Estiramiento"], ["Isométrico"], ["Sentadilla"], ["Marcha"], ["Carga"]),
  rotura_aquiles: P("desgarro", "Rotura Aquiles", "Thompson", "Aquiles.", [F, T], ["Bota"], ["Isométrico"], ["Talones"], ["Marcha"], ["Carrera"], {aviso: "Post-op: no forzar dorsiflexión."}),
  inestabilidad_tobillo: P("ligamento", "Inestabilidad tobillo", "Cajón", "Crónica.", [T], ["Movilidad"], ["Equilibrio"], ["Peroneos"], ["Inestable"], ["Deporte"]),
  fractura_tobillo: P("fractura", "Fx tobillo", "Lunge", "Maleolar.", [F, T], ["Dedos"], ["Propiocepción"], ["Talones"], ["Marcha"], ["Deporte"], {aviso: AV_FX}),
  hallux_valgus: P("degenerativo", "Hallux valgus", "Ángulo", "Juanete.", [C, T], ["Movilización"], ["Abductor"], ["Abducción"], ["Marcha"], ["Calzado"]),
  pie_plano: P("mecanico", "Pie plano", "Navicular drop", "Pronación.", [], ["Estiramiento"], ["Short foot"], ["Talones"], ["Marcha"], ["Calzado"]),
  metatarsalgia: P("mecanico", "Metatarsalgia", "Squeeze", "Metatarso.", [F, U], ["Pie"], ["Intrínsecos"], ["Talones"], ["Marcha"], ["Calzado"]),
  pie_diabetico: P("nervio", "Pie diabético", "Monofilamento", "Neuropatía.", [], ["Tobillo"], ["Equilibrio"], ["Piernas"], ["Marcha"], ["Cuidado"], {aviso: "No aplicar calor ni frío (riesgo de quemadura)."}),
  acv: P("neurologico", "ACV", "Ashworth", "Hemi.", [T, G], ["Pasiva"], ["Tronco"], ["Tarea"], ["Transferencia"], ["AVD"], {aviso: "Controlar presión arterial y fatiga."}),
  lesion_medular: P("neurologico", "Lesión medular", "ASIA", "Médula.", [T, G], ["Pasiva"], ["Tronco"], ["Fuerza"], ["Silla"], ["AVD"], {aviso: "Vigilar disreflexia autonómica."}),
  parkinson: P("neurologico", "Parkinson", "Hoehn-Yahr", "Parkinson.", [], ["Rotación"], ["Equilibrio"], ["Extensores"], ["Marcha"], ["Transferencias"], {aviso: "Entrenar en fase ON de medicación."}),
  artritis_reumatoide: P("reumatologico", "AR", "Dinamometría", "Artritis.", [T, F], ["Movilidad"], ["Protección"], ["Isométrico"], ["Sit-to-stand"], ["Ahorro"]),
  fibromialgia: P("reumatologico", "Fibromialgia", "ACR", "Dolor.", [C, T], ["Movilidad"], ["Relajación"], ["Baja carga"], ["Marcha"], ["Pacing"]),
  osteoporosis: P("reumatologico", "Osteoporosis", "Sit-to-stand", "Hueso.", [], ["Extensión"], ["Equilibrio"], ["Extensores"], ["Marcha"], ["Caídas"]),
  riesgo_caidas: P("geriatria", "Riesgo caídas", "TUG", "Fragilidad.", [], ["Movilidad"], ["Equilibrio"], ["Sit-to-stand"], ["Tándem"], ["Dual"]),
  epoc: P("cardiorrespiratorio", "EPOC", "Marcha 6min", "Pulmón.", [], ["Labios"], ["Ahorro"], ["Fuerza"], ["Caminata"], ["Educación"]),
  pci: P("pediatrico", "PCI", "GMFCS", "Cerebral.", [], ["Estiramiento"], ["Tronco"], ["Juego"], ["Marcha"], ["Escuela"])
});

const ZONAS = {
  "Columna": ["lumbalgia", "cervicalgia", "ciatica", "hernia_lumbar", "estenosis_lumbar", "facetario", "espondilolistesis", "piriforme", "sacroileitis", "hernia_dorsal", "dorsalgia", "fractura_vertebral", "espondilitis", "latigazo"],
  "Hombro": ["hombro", "rotura_manguito", "capsulitis", "inestabilidad_hombro", "acromioclavicular", "fractura_clavicula"],
  "Codo y Mano": ["epicondilitis", "epitrocleitis", "dequervain", "tunel", "tunel_cubital", "fractura_colles", "esguince_muneca", "dedo_gatillo", "rizartrosis"],
  "Cadera": ["cadera", "bursitis_trocanterea", "gluteo_medio", "pubalgia", "fractura_cadera", "protesis_cadera", "desgarro_isquiotibial"],
  "Rodilla": ["rodilla", "patelofemoral", "tendinopatia_rotuliana", "lca", "lesion_meniscal", "itb", "protesis_rodilla", "fractura_rotula", "osgood"],
  "Tobillo y Pie": ["tobillo", "fascitis", "rotura_aquiles", "inestabilidad_tobillo", "fractura_tobillo", "hallux_valgus", "pie_plano", "metatarsalgia", "pie_diabetico"],
  "Neuro": ["acv", "lesion_medular", "parkinson", "neuropatico"],
  "Otros": ["artritis_reumatoide", "fibromialgia", "osteoporosis", "riesgo_caidas", "epoc", "pci", "cefalea_tensional", "costillas"]
};

const TIPOS = { fractura: "Fracturas", desgarro: "Desgarros", hernia: "Hernias", ligamento: "Ligamentos", tendinopatia: "Tendinopatías", postquirurgico: "Post-op", degenerativo: "Artrosis", mecanico: "Mecánico", nervio: "Nervio", neurologico: "Neuro", reumatologico: "Reuma", cardiorrespiratorio: "Cardio", geriatria: "Geriatría", pediatrico: "Pediátrico" };

const SES_META = [
  { fase: "Evaluación", meta: "Línea base.", eval: "Evaluación.", plan: [['mov', 0], ['mov', 1], ['control', 0]], dosis: "2x10" },
  { fase: "Movilidad", meta: "Rango.", eval: "Control.", plan: [['mov', 1], ['control', 0], ['control', 1]], dosis: "2x12" },
  { fase: "Activación", meta: "Control.", eval: "Control.", plan: [['control', 0], ['control', 1], ['mov', 0]], dosis: "3x10" },
  { fase: "Activación", meta: "Consolidar.", eval: "Control.", plan: [['control', 1], ['control', 0], ['fuerza', 0]], dosis: "3x12" },
  { fase: "Reevaluación", meta: "Carga.", eval: "Reevaluación.", plan: [['control', 0], ['fuerza', 0], ['fuerza', 1]], dosis: "3x12" },
  { fase: "Fuerza", meta: "Resistencia.", eval: "Control.", plan: [['fuerza', 0], ['fuerza', 1], ['control', 1]], dosis: "3x10" },
  { fase: "Fuerza", meta: "Consolidar.", eval: "Control.", plan: [['fuerza', 1], ['fuerza', 0], ['funcional', 0]], dosis: "3x12" },
  { fase: "Transferencia", meta: "Función.", eval: "Control.", plan: [['fuerza', 0], ['funcional', 0], ['funcional', 1]], dosis: "3x10" },
  { fase: "Integración", meta: "Gesto.", eval: "Control.", plan: [['funcional', 0], ['funcional', 1], ['fuerza', 1]], dosis: "4x8" },
  { fase: "Alta", meta: "Resultado.", eval: "Reevaluación final.", plan: [['funcional', 1], ['funcional', 0], ['fuerza', 0]], dosis: "3x10" }
];

const FILLER = {
  mov: "Movilidad activa de la zona y de las articulaciones vecinas, en rango sin dolor",
  control: "Control motor y propiocepción de la zona (equilibrio y estabilidad)",
  fuerza: "Fortalecimiento global de la cadena cinética con banda o peso corporal",
  funcional: "Gesto funcional específico de la actividad del paciente (trabajo, deporte o vida diaria)"
};

const CRITERIO = "Criterio de progresión: subir un nivel si el dolor es <=3/10 a las 24h.";
