/* ============================================================
   KINEFLOW - Catálogo de Patologías (Frecuentes a Complejas)
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

const DB = {
  // ==========================================
  // FRECUENTES (Columna, Hombro, Rodilla)
  // ==========================================
  lumbalgia: { 
    nombre: "Lumbalgia mecánica", test: "Test de Lasègue", bib: "Kapandji, T.1, pág. 78; Neumann, pág. 342", 
    agentes: ["calor","tens","manual"], 
    ejercicios: { 
      consultorio: [ej("Movilidad pélvica en cuadrupedia", 2, 10, "3 min", "30s"), ej("Activación de core", 3, 10, "5 min", "45s"), ej("Puente de glúteos", 3, 12, "4 min", "45s")], 
      casa: [ej("Sentarse y pararse de silla", 3, 10, "5 min", "60s"), ej("Caminata con obstáculos", 1, 1, "10 min", "0s")] 
    } 
  },
  cervicalgia: { 
    nombre: "Cervicalgia mecánica", test: "Test de Spurling", bib: "Kapandji, T.3, pág. 112; Neumann, pág. 412", 
    agentes: ["calor","manual"], 
    ejercicios: { 
      consultorio: [ej("Movilidad cervical activa", 2, 10, "4 min", "30s"), ej("Chin tuck (retracción)", 3, 10, "3 min", "30s"), ej("Activación de flexores profundos", 3, 10, "4 min", "45s")], 
      casa: [ej("Chin tuck sentado", 3, 10, "3 min", "30s"), ej("Corrección postural en pared", 2, 10, "4 min", "30s")] 
    } 
  },
  hombro_manguito: { 
    nombre: "Manguito rotador", test: "Test de Jobe", bib: "Kapandji, T.1, pág. 45; Neumann, pág. 145", 
    agentes: ["frio","us","tens"], 
    ejercicios: { 
      consultorio: [ej("Péndulos de Codman", 3, 15, "4 min", "30s"), ej("Movilidad con bastón", 3, 10, "4 min", "45s"), ej("Manguito en pared", 3, 10, "4 min", "45s")], 
      casa: [ej("Alcance a estantes", 3, 10, "4 min", "45s"), ej("AVD (vestido)", 1, 1, "10 min", "0s")] 
    } 
  },
  gonartrosis: { 
    nombre: "Gonartrosis", test: "Test de McMurray", bib: "Kapandji, T.2, pág. 132; Neumann, pág. 545", 
    agentes: ["calor","frio","tens","magneto"], 
    ejercicios: { 
      consultorio: [ej("Movilidad activa", 3, 10, "5 min", "30s"), ej("Bicicleta fija", 1, 1, "10 min", "0s"), ej("Cuádriceps isométrico", 3, 10, "4 min", "45s")], 
      casa: [ej("Sit-to-stand", 3, 10, "5 min", "45s"), ej("Escalón bajo", 3, 10, "4 min", "60s")] 
    } 
  },
  ciatica: { 
    nombre: "Ciática / Hernia discal", test: "Test de Lasègue cruzado", bib: "Kapandji, T.1, pág. 98; García Porrero, T.2", 
    agentes: ["tens","calor"], 
    ejercicios: { 
      consultorio: [ej("Movilización neural", 3, 10, "5 min", "45s"), ej("Estabilización lumbar", 3, 10, "5 min", "60s"), ej("Puente de glúteos", 3, 12, "4 min", "45s")], 
      casa: [ej("Marcha corta", 1, 1, "10 min", "0s"), ej("Bisagra de cadera", 3, 10, "5 min", "60s")] 
    } 
  },

  // ==========================================
  // INTERMEDIAS (Codo, Muñeca, Tobillo)
  // ==========================================
  epicondilitis: { 
    nombre: "Epicondilitis lateral", test: "Test de Cozen", bib: "Kapandji, T.1, pág. 140; Kendall, pág. 145", 
    agentes: ["frio","us","manual"], 
    ejercicios: { 
      consultorio: [ej("Movilidad de muñeca", 3, 10, "4 min", "30s"), ej("Isométrico de extensores", 3, 10, "3 min", "45s"), ej("Excéntrico de extensores", 3, 12, "5 min", "45s")], 
      casa: [ej("Tareas livianas", 1, 1, "10 min", "0s"), ej("Agarre funcional", 3, 10, "4 min", "45s")] 
    } 
  },
  tunel_carpiano: { 
    nombre: "Túnel carpiano", test: "Test de Phalen", bib: "Kapandji, T.1, pág. 180; Tortora, pág. 290", 
    agentes: ["frio","tens"], 
    ejercicios: { 
      consultorio: [ej("Deslizamiento del mediano", 3, 10, "4 min", "30s"), ej("Fortalecimiento de pinza", 3, 12, "4 min", "45s")], 
      casa: [ej("Adaptación ergonómica", 1, 1, "10 min", "0s"), ej("Prensión con pausas", 3, 10, "4 min", "45s")] 
    } 
  },
  esguince_tobillo: { 
    nombre: "Esguince de tobillo", test: "Cajón anterior", bib: "Kapandji, T.2, pág. 198; Neumann, pág. 612", 
    agentes: ["frio","tens","us"], 
    ejercicios: { 
      consultorio: [ej("Bombeo de tobillo", 3, 15, "3 min", "30s"), ej("Propiocepción bipodal", 3, 30, "4 min", "30s"), ej("Peroneos con banda", 3, 15, "4 min", "45s")], 
      casa: [ej("Equilibrio unipodal", 3, 30, "4 min", "30s"), ej("Marcha funcional", 1, 1, "10 min", "0s")] 
    } 
  },
  lca: { 
    nombre: "Rehabilitación post LCA", test: "Lachman", bib: "Kapandji, T.2, pág. 132; Neumann, pág. 552", 
    agentes: ["frio","tens","magneto"], 
    ejercicios: { 
      consultorio: [ej("Extensión completa", 3, 10, "4 min", "45s"), ej("Flexión progresiva", 3, 10, "4 min", "45s"), ej("Equilibrio unipodal", 3, 30, "4 min", "45s")], 
      casa: [ej("Marcha simétrica", 1, 1, "10 min", "0s"), ej("Subida de escalones", 3, 10, "5 min", "60s")] 
    } 
  },
  fascitis: { 
    nombre: "Fascitis plantar", test: "Windlass", bib: "Neumann, pág. 650; Kapandji, T.2, pág. 218", 
    agentes: ["frio","us"], 
    ejercicios: { 
      consultorio: [ej("Estiramiento de fascia", 3, 30, "4 min", "30s"), ej("Short foot", 3, 10, "4 min", "45s"), ej("Elevación de talones", 3, 15, "4 min", "45s")], 
      casa: [ej("Rodamiento con pelota de tenis", 3, 30, "3 min", "30s"), ej("Pie sentado", 3, 10, "3 min", "30s")] 
    } 
  },

  // ==========================================
  // COMPLEJAS (Neurología, Reumatología, Cirugías)
  // ==========================================
  acv: { 
    nombre: "ACV / Hemiparesia", test: "Escala de Ashworth", bib: "Tortora, T.2, pág. 480; García Porrero, T.3", 
    agentes: ["tens"], 
    ejercicios: { 
      consultorio: [ej("Movilización pasiva/asistida", 3, 10, "6 min", "60s"), ej("Control de tronco", 3, 10, "5 min", "45s")], 
      casa: [ej("Transferencias", 3, 10, "5 min", "60s"), ej("AVD (vestido)", 1, 1, "15 min", "0s")] 
    } 
  },
  parkinson: { 
    nombre: "Parkinson", test: "Hoehn-Yahr", bib: "Tortora, T.2, pág. 490", 
    agentes: [], 
    ejercicios: { 
      consultorio: [ej("Movilidad axial", 3, 10, "5 min", "45s"), ej("Equilibrio", 3, 10, "5 min", "60s")], 
      casa: [ej("Marcha con pistas", 1, 1, "10 min", "0s"), ej("Giros", 3, 10, "4 min", "45s")] 
    } 
  },
  artritis_reumatoide: { 
    nombre: "Artritis Reumatoide", test: "Dinamometría de agarre", bib: "Tortora, T.2, pág. 400; García Porrero, T.3", 
    agentes: ["tens","frio"], 
    ejercicios: { 
      consultorio: [ej("Movilidad suave", 3, 10, "5 min", "30s"), ej("Protección articular", 3, 10, "4 min", "30s")], 
      casa: [ej("Ahorro articular", 1, 1, "10 min", "0s"), ej("AVD adaptadas", 1, 1, "10 min", "0s")] 
    } 
  },
  fibromialgia: { 
    nombre: "Fibromialgia", test: "Criterios ACR", bib: "Tortora, T.2, pág. 410", 
    agentes: ["calor","tens"], 
    ejercicios: { 
      consultorio: [ej("Movilidad suave global", 3, 10, "5 min", "30s"), ej("Respiración", 3, 10, "3 min", "30s")], 
      casa: [ej("Marcha", 1, 1, "10 min", "0s"), ej("Pacing (ritmo)", 1, 1, "10 min", "0s")] 
    } 
  },
  protesis_cadera: { 
    nombre: "Prótesis total de cadera", test: "Timed Up and Go (TUG)", bib: "Neumann, pág. 400; Kapandji, T.2", 
    agentes: ["frio","tens"], 
    ejercicios: { 
      consultorio: [ej("Bombeo de tobillo", 3, 15, "3 min", "30s"), ej("Abducción en decúbito", 3, 10, "4 min", "45s"), ej("Puente glúteo bilateral", 3, 10, "4 min", "45s")], 
      casa: [ej("Sit-to-stand con silla alta", 3, 10, "5 min", "60s"), ej("Marcha con andador", 1, 1, "10 min", "0s")] 
    } 
  },
  protesis_rodilla: { 
    nombre: "Prótesis total de rodilla", test: "Goniometría (flexo-extensión)", bib: "Neumann, pág. 545; Kapandji, T.2", 
    agentes: ["frio","tens"], 
    ejercicios: { 
      consultorio: [ej("Deslizamiento de talón", 3, 10, "4 min", "45s"), ej("Extensión pasiva con toalla", 3, 10, "5 min", "45s"), ej("Cuádriceps isométrico", 3, 10, "4 min", "45s")], 
      casa: [ej("Mini sentadilla (0-45°)", 3, 10, "4 min", "60s"), ej("Marcha con bastones", 1, 1, "10 min", "0s")] 
    } 
  },
  parsonage: { 
    nombre: "Síndrome de Parsonage-Turner", test: "Evaluación de fuerza (Daniels)", bib: "Neumann, pág. 180", 
    agentes: ["tens"], 
    ejercicios: { 
      consultorio: [ej("Movilidad pasiva", 3, 10, "5 min", "45s"), ej("Reeducación de manguito", 3, 10, "4 min", "45s")], 
      casa: [ej("Tareas asistidas", 1, 1, "10 min", "0s"), ej("Alcance funcional", 3, 10, "4 min", "45s")] 
    } 
  }
};
