/* ============================================================
   KINEFLOW PRO - Base de Datos Clínica
   ============================================================ */

// 1. Definición de Agentes Físicos con sus Contraindicaciones (Alertas rojas)
const AGENTES = {
  calor: { 
    nombre: "Termoterapia (Calor)", 
    dosis: "15-20 min · 40-45°C", 
    contraindica: ["cancer", "tvp", "infeccion", "sensib"] 
  },
  frio: { 
    nombre: "Crioterapia", 
    dosis: "10-15 min · fase aguda", 
    contraindica: ["sensib"] 
  },
  tens: { 
    nombre: "TENS (Electroestimulación)", 
    dosis: "80-100 Hz, 20-30 min", 
    contraindica: ["cardio", "marcapasos", "infeccion", "embarazo"] 
  },
  magneto: { 
    nombre: "Magnetoterapia", 
    dosis: "Baja frecuencia, 20-30 min", 
    contraindica: ["cardio", "marcapasos", "implante", "cancer"] 
  },
  us: { 
    nombre: "Ultrasonido Terapéutico", 
    dosis: "1 MHz · 1.0-1.5 W/cm²", 
    contraindica: ["cancer", "tvp", "infeccion"] 
  },
  manual: { 
    nombre: "Terapia Manual", 
    dosis: "Movilización articular", 
    contraindica: ["osteoporosis", "cancer", "tvp"] 
  },
  puncion: { 
    nombre: "Punción Seca", 
    dosis: "10-20 seg por punto gatillo", 
    contraindica: ["anticoagulantes", "cardio", "cancer"] 
  }
};

// 2. Base de Datos de Patologías
// Estructura: { nombre, test, agentes: [keys], ejercicios: { movilidad, control, fuerza, funcional } }
const DB = {
  lumbalgia: {
    nombre: "Lumbalgia mecánica",
    test: "Test de Lasègue",
    agentes: ["calor", "tens", "manual"],
    ejercicios: {
      movilidad: ["Movilidad lumbo-pélvica activa en rango libre de dolor", "Respiración diafragmática + básculas pélvicas"],
      control: ["Activación de core (transverso/multífidos) en decúbito", "Puente glúteo bajo umbral de dolor"],
      fuerza: ["Peso muerto rumano con banda", "Ejercicio de extensión tipo McKenzie"],
      funcional: ["Sit-to-stand asistido", "Marcha con obstáculos bajos"]
    }
  },
  cervicalgia: {
    nombre: "Cervicalgia mecánica",
    test: "Test de Spurling",
    agentes: ["calor", "manual"],
    ejercicios: {
      movilidad: ["Movilidad cervical activa multidireccional", "Retracción cervical (chin tuck) suave"],
      control: ["Activación de flexores profundos", "Control escapular en cadena cerrada"],
      fuerza: ["Fortalecimiento isométrico cervical", "Remo con banda para estabilizadores escapulares"],
      funcional: ["Chin tuck funcional en sedestación", "Reentrenamiento postural en pantalla"]
    }
  },
  hombro: {
    nombre: "Dolor de hombro / Manguito rotador",
    test: "Test de Jobe (Empty Can)",
    agentes: ["frio", "us", "tens"],
    ejercicios: {
      movilidad: ["Péndulos de Codman", "Movilidad asistida con bastón en rango indoloro"],
      control: ["Activación de manguito en cadena cerrada (pared)", "Estabilización escapular (retracción/depresión)"],
      fuerza: ["Fortalecimiento excéntrico de rotadores externos", "Press con progresión de carga controlada"],
      funcional: ["Alcance funcional a estantes", "Tareas de AVD (vestido, higiene)"]
    }
  },
  rodilla: {
    nombre: "Gonartrosis / Dolor de rodilla",
    test: "Test de McMurray",
    agentes: ["calor", "frio", "tens", "magneto"],
    ejercicios: {
      movilidad: ["Movilidad activa de rodilla en rango indoloro", "Bicicleta sin carga a baja resistencia"],
      control: ["Activación de cuádriceps (isométrico)", "Control de glúteo medio en apoyo unipodal"],
      fuerza: ["Sentadilla parcial con banda", "Prensa/extensión de rodilla con carga progresiva"],
      funcional: ["Sit-to-stand desde silla", "Subir/bajar escalón bajo"]
    }
  },
  ciatica: {
    nombre: "Ciática / Hernia discal lumbar",
    test: "Test de Lasègue cruzado",
    agentes: ["tens", "calor", "manual"],
    ejercicios: {
      movilidad: ["Movilización neural gradual (deslizamiento)", "Movilidad lumbar en patrón de preferencia"],
      control: ["Estabilización lumbar de bajo umbral", "Activación de transverso en decúbito"],
      fuerza: ["Puente glúteo bilateral", "Fortalecimiento progresivo monitoreando irradiación"],
      funcional: ["Marcha progresiva de tramos cortos", "Técnica de levantamiento con columna neutra"]
    }
  },
  lca: {
    nombre: "Rehabilitación post LCA",
    test: "Test de Lachman",
    agentes: ["frio", "tens", "magneto"],
    ejercicios: {
      movilidad: ["Extensión completa de rodilla (apoyo de talón)", "Flexión progresiva en decúbito"],
      control: ["Equilibrio unipodal con ojos abiertos", "Control neuromuscular de rodilla"],
      fuerza: ["Sentadilla parcial y prensa", "Fortalecimiento en cadena cerrada"],
      funcional: ["Marcha con patrón simétrico", "Subida de escalones"]
    }
  },
  capsulitis: {
    nombre: "Capsulitis adhesiva (Hombro congelado)",
    test: "Rango pasivo de rotación externa",
    agentes: ["calor", "us", "manual"],
    ejercicios: {
      movilidad: ["Elevación asistida con bastón en decúbito supino", "Movilización pasiva en rango disponible"],
      control: ["Control escapular con deslizamientos en pared", "Activación suave de manguito"],
      fuerza: ["Isométricos de rotadores en neutro", "Fortalecimiento progresivo al recuperar rango"],
      funcional: ["Alcance con el brazo en tareas de higiene", "Tareas diarias con alcance cada vez mayor"]
    }
  },
  tobillo: {
    nombre: "Esguince de tobillo",
    test: "Test del cajón anterior",
    agentes: ["frio", "tens", "us"],
    ejercicios: {
      movilidad: ["Movilidad activa de tobillo (bombeos)", "Movilidad en cadena abierta multidireccional"],
      control: ["Propiocepción en apoyo bipodal", "Activación de peroneos con banda"],
      fuerza: ["Fortalecimiento de peroneos", "Elevación de talones (gemelos)"],
      funcional: ["Equilibrio estático asistido", "Marcha funcional con progresión"]
    }
  },
  fascitis: {
    nombre: "Fascitis plantar",
    test: "Windlass Test",
    agentes: ["frio", "us", "tens"],
    ejercicios: {
      movilidad: ["Estiramiento de fascia plantar y tríceps sural", "Automasaje con pelota"],
      control: ["Activación de músculos intrínsecos (short foot)", "Control de carga en apoyo unipodal"],
      fuerza: ["Elevación de talones progresiva", "Fortalecimiento de tríceps sural excéntrico"],
      funcional: ["Marcha con calzado adecuado", "Ejercicios de pie sentado"]
    }
  },
  epicondilitis: {
    nombre: "Epicondilitis lateral",
    test: "Test de Cozen",
    agentes: ["frio", "us", "manual"],
    ejercicios: {
      movilidad: ["Movilidad activa de muñeca y codo", "Deslizamiento neural del radial"],
      control: ["Isométricos de extensores bajo umbral", "Control escapular"],
      fuerza: ["Fortalecimiento excéntrico de extensores", "Fortalecimiento de agarre"],
      funcional: ["Tareas manuales livianas", "Ejercicio de agarre funcional"]
    }
  },
  tunel: {
    nombre: "Síndrome del túnel carpiano",
    test: "Test de Phalen",
    agentes: ["frio", "tens"],
    ejercicios: {
      movilidad: ["Deslizamiento neural del mediano", "Movilidad activa de muñeca"],
      control: ["Reeducación postural de muñeca", "Control de carga en agarre"],
      fuerza: ["Fortalecimiento de flexores/extensores", "Fortalecimiento de pinza"],
      funcional: ["Adaptación ergonómica", "Ejercicios de prensión con pausas"]
    }
  },
  acv: {
    nombre: "ACV / Hemiparesia",
    test: "Escala de Ashworth Modificada",
    agentes: ["tens", "magneto"],
    ejercicios: {
      movilidad: ["Movilización pasiva/asistida del hemicuerpo", "Movilidad activa de tronco"],
      control: ["Control de tronco en sedestación", "Equilibrio sentado con alcances"],
      fuerza: ["Entrenamiento orientado a la tarea", "Fortalecimiento de miembro superior"],
      funcional: ["Transferencias cama-silla", "Reentrenamiento de AVD (vestido, higiene)"]
    }
  },
  parkinson: {
    nombre: "Enfermedad de Parkinson",
    test: "Escala de Hoehn y Yahr",
    agentes: [],
    ejercicios: {
      movilidad: ["Movilidad axial y rotación de tronco", "Movilidad global amplia"],
      control: ["Equilibrio con perturbaciones suaves", "Estrategias anticaída"],
      fuerza: ["Sit-to-stand repetido", "Fortalecimiento de extensores"],
      funcional: ["Marcha con pistas auditivas", "Giros y transferencias"]
    }
  },
  artritis_reumatoide: {
    nombre: "Artritis reumatoide",
    test: "Dinamometría de agarre",
    agentes: ["tens", "frio"],
    ejercicios: {
      movilidad: ["Movilidad activa suave de articulaciones", "Ejercicios de mano (flexo-extensión)"],
      control: ["Protección articular y ergonomía", "Control postural"],
      fuerza: ["Fortalecimiento isométrico submáximo", "Ejercicio aeróbico de bajo impacto"],
      funcional: ["Sit-to-stand", "Actividades diarias con ahorro articular"]
    }
  },
  riesgo_caidas: {
    nombre: "Riesgo de caídas en adulto mayor",
    test: "Timed Up and Go (TUG)",
    agentes: [],
    ejercicios: {
      movilidad: ["Movilidad articular global suave", "Movilidad de tronco"],
      control: ["Equilibrio bipodal ojos cerrados", "Transferencia de peso"],
      fuerza: ["Sit-to-stand repetido", "Elevación de talones"],
      funcional: ["Marcha en tándem", "Marcha con tareas duales"]
    }
  },
  epoc: {
    nombre: "EPOC / Rehabilitación respiratoria",
    test: "Test de marcha de 6 minutos",
    agentes: [],
    ejercicios: {
      movilidad: ["Respiración con labios fruncidos", "Movilidad torácica"],
      control: ["Técnicas de ahorro de energía", "Control de disnea"],
      fuerza: ["Fortalecimiento de miembros inferiores", "Ejercicio aeróbico en intervalos"],
      funcional: ["Caminata progresiva", "Sit-to-stand"]
    }
  },
  pci: {
    nombre: "Parálisis cerebral infantil",
    test: "GMFCS (Función motora gruesa)",
    agentes: [],
    ejercicios: {
      movilidad: ["Estiramiento de acortamientos", "Movilización activa lúdica"],
      control: ["Control de cabeza y tronco", "Equilibrio sentado"],
      fuerza: ["Fortalecimiento funcional a través del juego", "Entrenamiento de tareas"],
      funcional: ["Sit-to-stand", "Marcha asistida según nivel"]
    }
  },
  fibromialgia: {
    nombre: "Fibromialgia",
    test: "Criterios ACR 2016",
    agentes: ["calor", "tens"],
    ejercicios: {
      movilidad: ["Movilidad suave global", "Estiramientos de bajo impacto"],
      control: ["Respiración y relajación", "Conciencia corporal"],
      fuerza: ["Fortalecimiento de baja intensidad", "Ejercicio aeróbico suave"],
      funcional: ["Sit-to-stand", "Marcha cómoda"]
    }
  },
  osteoporosis: {
    nombre: "Osteoporosis",
    test: "Sit-to-stand de 30s",
    agentes: [],
    ejercicios: {
      movilidad: ["Extensión de columna suave", "Movilidad de cadera"],
      control: ["Equilibrio y propiocepción", "Postura erguida"],
      fuerza: ["Fortalecimiento de extensores", "Entrenamiento de fuerza progresivo"],
      funcional: ["Sit-to-stand", "Caminata con impacto controlado"]
    }
  },
  pie_diabetico: {
    nombre: "Pie diabético / Neuropatía",
    test: "Monofilamento de 10g",
    agentes: [],
    ejercicios: {
      movilidad: ["Movilidad activa de tobillo", "Estiramiento de gemelos"],
      control: ["Equilibrio con apoyo", "Control del apoyo plantar"],
      fuerza: ["Fortalecimiento de piernas en sedente", "Elevación de talones"],
      funcional: ["Marcha con calzado adecuado", "Cuidado diario de los pies"]
    }
  }
};

// 3. Plan de 10 Sesiones (Fases y Dosis)
const SESIONES_PLAN = [
  { n: 1, fase: "Evaluación y Movilidad Protegida", dosis: "2 series x 10 rep · Esfuerzo 3/10" },
  { n: 2, fase: "Movilidad y Primeros Ejercicios de Control", dosis: "2 series x 12 rep · Esfuerzo 3-4/10" },
  { n: 3, fase: "Activación y Control Motor", dosis: "3 series x 10 rep · Esfuerzo 4/10" },
  { n: 4, fase: "Consolidación de Control", dosis: "3 series x 12 rep · Esfuerzo 4-5/10" },
  { n: 5, fase: "Reevaluación y Primera Carga", dosis: "3 series x 12 rep · Esfuerzo 5/10" },
  { n: 6, fase: "Fuerza Progresiva", dosis: "3 series x 10 rep (mayor resistencia) · Esfuerzo 5-6/10" },
  { n: 7, fase: "Consolidación de Fuerza", dosis: "3 series x 10-12 rep · Esfuerzo 6/10" },
  { n: 8, fase: "Transferencia Funcional", dosis: "3-4 series x 10 rep · Esfuerzo 6-7/10" },
  { n: 9, fase: "Integración Funcional", dosis: "4 series x 8-10 rep · Esfuerzo 7/10" },
  { n: 10, fase: "Reevaluación Final y Alta", dosis: "3 series x 10 rep (mantenimiento) · Esfuerzo 6/10" }
];
