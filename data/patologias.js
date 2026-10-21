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
  ciatica: {
    nombre: "Ciática / Hernia discal", test: "Test de Lasègue cruzado", bib: "Kapandji, T.1, pág. 98; García Porrero, T.2",
    agentes: ["tens","calor"],
    ejercicios: {
      consultorio: [ej("Movilización neural", 3, 10, "5 min", "45s"), ej("Estabilización lumbar", 3, 10, "5 min", "60s"), ej("Puente de glúteos", 3, 12, "4 min", "45s")],
      casa: [ej("Marcha corta", 1, 1, "10 min", "0s"), ej("Bisagra de cadera (hip hinge)", 3, 10, "5 min", "60s")]
    }
  },
  hernia_lumbar: {
    nombre: "Hernia discal lumbar", test: "Slump test + Lasègue", bib: "Kapandji, T.1, pág. 78; Tortora, pág. 234",
    agentes: ["tens","calor"],
    ejercicios: {
      consultorio: [ej("Movilización neural", 3, 10, "5 min", "45s"), ej("Extensión en prono (McKenzie)", 3, 10, "4 min", "60s"), ej("Estabilización lumbar", 3, 10, "5 min", "45s")],
      casa: [ej("Caminata corta", 1, 1, "10 min", "0s"), ej("Rodillas al pecho", 2, 10, "3 min", "30s")]
    }
  },
  estenosis_lumbar: {
    nombre: "Estenosis de canal lumbar", test: "Test de la bicicleta", bib: "Neumann, pág. 358; Kapandji, T.1, pág. 82",
    agentes: ["calor","tens"],
    ejercicios: {
      consultorio: [ej("Flexión de rodillas al pecho", 3, 10, "4 min", "30s"), ej("Bicicleta fija", 1, 1, "15 min", "0s")],
      casa: [ej("Marcha con carro de apoyo", 1, 1, "15 min", "120s")]
    }
  },
  desgarro_isquios: {
    nombre: "Desgarro de isquiotibiales", test: "Test de Puranen-Orava", bib: "Tortora, T.2, pág. 412; Kendall, pág. 234",
    agentes: ["frio","tens","us"],
    ejercicios: {
      consultorio: [ej("Puente isométrico", 3, 10, "4 min", "45s"), ej("Curl nórdico asistido", 3, 6, "5 min", "90s")],
      casa: [ej("Marcha controlada", 1, 1, "10 min", "0s"), ej("Peso muerto rumano con banda", 3, 10, "5 min", "60s")]
    }
  },
  desgarro_cuadriceps: {
    nombre: "Desgarro de cuádriceps", test: "Extensión resistida de rodilla", bib: "Kendall, pág. 412; Tortora, T.2, pág. 408",
    agentes: ["frio","us"],
    ejercicios: {
      consultorio: [ej("Cuádriceps isométrico", 3, 10, "4 min", "45s"), ej("Deslizamiento de talón", 3, 10, "4 min", "45s")],
      casa: [ej("Elevación de pierna recta", 3, 10, "5 min", "45s"), ej("Sentadilla parcial", 3, 10, "4 min", "60s")]
    }
  },
  desgarro_aductor: {
    nombre: "Desgarro de aductores", test: "Squeeze test", bib: "Kendall, pág. 398; Kapandji, T.2, pág. 45",
    agentes: ["frio","tens"],
    ejercicios: {
      consultorio: [ej("Aducción isométrica con pelota", 3, 10, "3 min", "45s"), ej("Movilidad de cadera", 2, 10, "4 min", "30s")],
      casa: [ej("Marcha lateral con banda", 3, 10, "4 min", "45s"), ej("Sit-to-stand", 3, 10, "4 min", "45s")]
    }
  },
  desgarro_gemelo: {
    nombre: "Desgarro de gemelo", test: "Test de Thompson", bib: "Kendall, pág. 452; Tortora, T.2, pág. 420",
    agentes: ["frio","tens"],
    ejercicios: {
      consultorio: [ej("Bombeo de tobillo", 3, 15, "3 min", "30s"), ej("Isométrico de tríceps sural", 3, 10, "4 min", "45s")],
      casa: [ej("Marcha con talón levantado", 1, 1, "10 min", "0s"), ej("Elevación de talones bipodal", 3, 15, "4 min", "45s")]
    }
  },
  desgarro_pectoral: {
    nombre: "Desgarro de pectoral mayor", test: "Aducción resistida", bib: "Kendall, pág. 312; Kapandji, T.1, pág. 145",
    agentes: ["frio","us"],
    ejercicios: {
      consultorio: [ej("Movilidad pasiva de hombro", 2, 10, "4 min", "30s"), ej("Isométrico de pectoral", 3, 10, "3 min", "45s")],
      casa: [ej("Empuje en pared", 3, 10, "4 min", "45s"), ej("Aducción isométrica", 3, 10, "3 min", "45s")]
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
  esguince_rodilla: {
    nombre: "Esguince de rodilla", test: "Lachman (LCA)", bib: "Kapandji, T.2, pág. 132; Neumann, pág. 545",
    agentes: ["frio","tens","magneto"],
    ejercicios: {
      consultorio: [ej("Extensión completa de rodilla", 3, 10, "4 min", "45s"), ej("Flexión progresiva", 3, 10, "4 min", "45s")],
      casa: [ej("Marcha simétrica", 1, 1, "10 min", "0s"), ej("Subida de escalones", 3, 10, "5 min", "60s")]
    }
  },
  esguince_muneca: {
    nombre: "Esguince de muñeca (TFCC)", test: "Fóvea cubital", bib: "Kapandji, T.1, pág. 178; Tortora, pág. 280",
    agentes: ["frio","tens"],
    ejercicios: {
      consultorio: [ej("Movilidad activa de muñeca", 3, 10, "4 min", "30s"), ej("Isométricos de muñeca", 3, 10, "3 min", "30s")],
      casa: [ej("Tareas bimanuales", 1, 1, "10 min", "0s"), ej("Apoyo de mano en cadena cerrada", 3, 10, "3 min", "45s")]
    }
  },
  fractura_radio: {
    nombre: "Fractura de radio distal", test: "Dinamometría", bib: "Kapandji, T.1, pág. 168; Tortora, pág. 284",
    agentes: ["frio","tens"],
    ejercicios: {
      consultorio: [ej("Movilidad de dedos", 3, 15, "3 min", "30s"), ej("Prono-supinación con codo a 90°", 3, 10, "4 min", "45s")],
      casa: [ej("Tareas bimanuales", 1, 1, "10 min", "0s"), ej("Apoyo de mano", 3, 10, "4 min", "60s")]
    }
  },
  fractura_humero: {
    nombre: "Fractura de húmero proximal", test: "ROM activo-asistido", bib: "Kapandji, T.1, pág. 32; Tortora, pág. 240",
    agentes: ["frio","tens"],
    ejercicios: {
      consultorio: [ej("Péndulos de Codman", 3, 15, "4 min", "45s"), ej("Movilidad con bastón", 3, 10, "4 min", "45s")],
      casa: [ej("Alcance funcional con carga liviana", 3, 10, "4 min", "45s"), ej("Tareas de AVD", 1, 1, "10 min", "0s")]
    }
  },
  fractura_clavicula: {
    nombre: "Fractura de clavícula", test: "ROM activo", bib: "Kapandji, T.1, pág. 24; Tortora, pág. 236",
    agentes: ["frio","tens"],
    ejercicios: {
      consultorio: [ej("Movilidad activa de codo y mano", 3, 10, "4 min", "30s"), ej("Péndulos de hombro", 3, 15, "3 min", "45s")],
      casa: [ej("Tareas de vestido", 1, 1, "10 min", "0s"), ej("Cargas livianas", 3, 10, "4 min", "45s")]
    }
  },
  fractura_tobillo: {
    nombre: "Fractura de tobillo", test: "Lunge test", bib: "Kapandji, T.2, pág. 198; Neumann, pág. 645",
    agentes: ["frio","tens"],
    ejercicios: {
      consultorio: [ej("Movilidad de dedos", 3, 15, "3 min", "30s"), ej("Propiocepción bipodal", 3, 30, "4 min", "45s")],
      casa: [ej("Marcha con bastones", 1, 1, "10 min", "0s"), ej("Subida de escalón bajo", 3, 10, "4 min", "60s")]
    }
  },
  fractura_metatarsiano: {
    nombre: "Fractura de metatarsiano", test: "Palpación", bib: "Tortora, T.2, pág. 328; Kapandji, T.2, pág. 220",
    agentes: ["frio","tens"],
    ejercicios: {
      consultorio: [ej("Movilidad de tobillo y dedos", 3, 15, "3 min", "30s"), ej("Short foot (intrínsecos)", 3, 10, "4 min", "45s")],
      casa: [ej("Marcha con calzado rígido", 1, 1, "10 min", "0s"), ej("Carga progresiva", 3, 10, "4 min", "60s")]
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
  capsulitis: {
    nombre: "Capsulitis adhesiva", test: "Rotación externa pasiva", bib: "Kapandji, T.1, pág. 32; Neumann, pág. 152",
    agentes: ["calor","us","manual"],
    ejercicios: {
      consultorio: [ej("Elevación con bastón", 3, 10, "5 min", "45s"), ej("Movilización pasiva", 3, 10, "5 min", "45s")],
      casa: [ej("Alcance en higiene", 1, 1, "10 min", "0s"), ej("Deslizamiento en pared", 3, 10, "4 min", "30s")]
    }
  },
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
      consultorio: [ej("Deslizamiento del nervio mediano", 3, 10, "4 min", "30s"), ej("Fortalecimiento de pinza", 3, 12, "4 min", "45s")],
      casa: [ej("Adaptación ergonómica", 1, 1, "10 min", "0s"), ej("Prensión con pausas", 3, 10, "4 min", "45s")]
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
  lca: {
    nombre: "Rehabilitación post LCA", test: "Lachman", bib: "Kapandji, T.2, pág. 132; Neumann, pág. 552",
    agentes: ["frio","tens","magneto"],
    ejercicios: {
      consultorio: [ej("Extensión completa", 3, 10, "4 min", "45s"), ej("Flexión progresiva", 3, 10, "4 min", "45s"), ej("Equilibrio unipodal", 3, 30, "4 min", "45s")],
      casa: [ej("Marcha simétrica", 1, 1, "10 min", "0s"), ej("Subida de escalones", 3, 10, "5 min", "60s")]
    }
  },
  menisco: {
    nombre: "Lesión meniscal", test: "Thessaly", bib: "Kapandji, T.2, pág. 128; Neumann, pág. 540",
    agentes: ["frio","tens"],
    ejercicios: {
      consultorio: [ej("Movilidad en rango indoloro", 3, 10, "4 min", "30s"), ej("Cuádriceps isométrico", 3, 10, "4 min", "45s")],
      casa: [ej("Sit-to-stand", 3, 10, "4 min", "45s"), ej("Escalón bajo", 3, 10, "4 min", "60s")]
    }
  },
  itb: {
    nombre: "Cintilla iliotibial", test: "Test de Noble", bib: "Kendall, pág. 234; Neumann, pág. 560",
    agentes: ["frio","tens"],
    ejercicios: {
      consultorio: [ej("Estiramiento de ITB", 3, 30, "4 min", "30s"), ej("Abducción de cadera", 3, 12, "4 min", "45s")],
      casa: [ej("Escalones laterales", 3, 10, "4 min", "45s"), ej("Corrección de técnica", 1, 1, "10 min", "0s")]
    }
  },
  patelofemoral: {
    nombre: "Síndrome patelofemoral", test: "Aprensión rotuliana", bib: "Neumann, pág. 555; Kapandji, T.2, pág. 138",
    agentes: ["frio","tens"],
    ejercicios: {
      consultorio: [ej("Movilidad de rodilla", 3, 10, "4 min", "30s"), ej("Vasto medial", 3, 10, "4 min", "45s")],
      casa: [ej("Escalón controlado", 3, 10, "4 min", "45s"), ej("Sentadilla parcial", 3, 10, "4 min", "45s")]
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
  aquiles: {
    nombre: "Tendinopatía de Aquiles", test: "Test de Thompson", bib: "Kendall, pág. 452; Neumann, pág. 645",
    agentes: ["frio","us"],
    ejercicios: {
      consultorio: [ej("Movilidad de tobillo", 3, 10, "4 min", "30s"), ej("Isométrico de tríceps sural", 3, 10, "4 min", "45s"), ej("Excéntrico de tríceps sural", 3, 10, "5 min", "60s")],
      casa: [ej("Marcha progresiva", 1, 1, "10 min", "0s"), ej("Saltos suaves", 3, 10, "4 min", "60s")]
    }
  },
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
    nombre: "Artritis Reumatoide", test: "Dinamometría", bib: "Tortora, T.2, pág. 400; García Porrero, T.3",
    agentes: ["tens","frio"],
    ejercicios: {
      consultorio: [ej("Movilidad suave", 3, 10, "5 min", "30s"), ej("Protección articular", 3, 10, "4 min", "30s")],
      casa: [ej("Ahorro articular", 1, 1, "10 min", "0s"), ej("AVD adaptadas", 1, 1, "10 min", "0s")]
    }
  },
  osteoporosis: {
    nombre: "Osteoporosis", test: "Sit-to-stand", bib: "Tortora, T.2, pág. 400; Kendall, pág. 456",
    agentes: [],
    ejercicios: {
      consultorio: [ej("Extensión de columna", 3, 10, "4 min", "45s"), ej("Equilibrio", 3, 30, "4 min", "30s")],
      casa: [ej("Caminata", 1, 1, "15 min", "0s"), ej("Prevención de caídas", 3, 10, "4 min", "45s")]
    }
  }
};
