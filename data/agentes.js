/* KineFlow — Catálogo de agentes físicos
   Dosis orientativa + contraindicaciones (rojo) y precauciones (naranja). */

const AGENTES = {
  calor: {
    n: "Termoterapia superficial (calor)",
    d: "15-20 min · 40-45°C · previo a la movilidad",
    redC: ["cancer","tvp","infeccion","sensib"], redM: [], redF: ["fiebre"], notaEmbarazo: true,
    precC: { diabetes: "vigilar la sensibilidad de la piel (riesgo de quemadura)", cardio: "controlar la tolerancia" },
    precM: { anticoagulantes: "riesgo de sangrado local: calor leve", corticoides: "piel frágil: calor leve" }
  },
  frio: {
    n: "Crioterapia",
    d: "10-15 min · ciclos con descanso · fase aguda/post-ejercicio",
    redC: ["sensib"], redM: [], redF: [],
    precC: { diabetes: "vigilar la sensibilidad y la circulación", cardio: "vigilar la presión arterial (vasoconstricción)", tvp: "evitar compresión o frío intenso sobre el miembro" },
    precM: {}
  },
  tens: {
    n: "TENS (electroestimulación)",
    d: "Convencional 80-100 Hz, pulso 50-80 µs, 20-30 min",
    redC: ["cardio","marcapasos","infeccion"], redM: [], redF: [], notaEmbarazo: true,
    precC: { epilepsia: "no aplicar en cabeza ni cuello", diabetes: "vigilar la piel bajo los electrodos", sensib: "colocar los electrodos con cuidado y preguntar por sensaciones: puede no sentir la intensidad", tvp: "no aplicar sobre el miembro con trombosis" },
    precM: {}
  },
  magneto: {
    n: "Magnetoterapia",
    d: "Baja frecuencia (5-50 Hz), intensidad baja-media, 20-30 min",
    redC: ["cardio","marcapasos","implante","cancer","infeccion"], redM: [], redF: ["fiebre"], notaEmbarazo: true,
    precC: { epilepsia: "usar con cautela" },
    precM: {}
  },
  us: {
    n: "Ultrasonido terapéutico",
    d: "1 MHz · 1.0-1.5 W/cm² continuo (crónico) o pulsado (agudo) · 5-8 min/zona",
    redC: ["cancer","tvp","infeccion"], redM: [], redF: ["fiebre"], notaEmbarazo: true,
    precC: { implante: "evitar aplicar sobre el implante o el cemento", osteoporosis: "dosis baja", marcapasos: "no aplicar cerca del dispositivo (tórax)", sensib: "el paciente puede no avisar si se calienta: mover el cabezal sin parar y bajar la dosis" },
    precM: { corticoides: "tendón frágil: dosis baja" }
  },
  ondacorta: {
    n: "Onda corta / diatermia",
    d: "20 min · dosis térmica leve-moderada",
    redC: ["cardio","marcapasos","implante","cancer","tvp","infeccion","sensib"], redM: [], redF: ["fiebre"], notaEmbarazo: true,
    precC: { diabetes: "vigilar la sensibilidad (riesgo de quemadura)" },
    precM: {}
  },
  manual: {
    n: "Terapia manual (movilización articular)",
    d: "Grados Maitland I-IV · 3-5 series de oscilaciones",
    redC: ["osteoporosis","cancer","tvp","infeccion"], redM: ["anticoagulantes"], redF: ["fiebre","trauma","esfinteres","neurologico"],
    precC: {},
    precM: { corticoides: "fragilidad ósea: solo grados I-II" }
  },
  puncion: {
    n: "Punción seca",
    d: "10-20 seg por punto gatillo · técnica in-and-out",
    redC: ["cardio","cancer","infeccion"], redM: ["anticoagulantes"], redF: ["fiebre"],
    precC: { embarazo: "evitar puntos de riesgo", diabetes: "asepsia estricta (riesgo de infección)", marcapasos: "evitar la zona torácica cercana al dispositivo", tvp: "evitar el miembro afectado" },
    precM: {}
  }
};