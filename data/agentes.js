const AGENTES = {
  calor: { n: "Termoterapia (calor)", d: "15-20 min · 40-45°C", redC: ["cancer","tvp","infeccion","sensib"], redM: [], redF: ["fiebre"] },
  frio: { n: "Crioterapia", d: "10-15 min · fase aguda", redC: ["sensib"], redM: [], redF: [] },
  tens: { n: "TENS (electroestimulación)", d: "80-100 Hz, 20-30 min", redC: ["cardio","marcapasos","infeccion"], redM: [], redF: [], notaEmbarazo: true },
  magneto: { n: "Magnetoterapia", d: "Baja frecuencia, 20-30 min", redC: ["cardio","marcapasos","implante","cancer","infeccion"], redM: [], redF: ["fiebre"] },
  us: { n: "Ultrasonido", d: "1 MHz · 1.0-1.5 W/cm²", redC: ["cancer","tvp","infeccion"], redM: [], redF: ["fiebre"] },
  manual: { n: "Terapia manual", d: "Movilización articular", redC: ["osteoporosis","cancer","tvp","infeccion"], redM: ["anticoagulantes"], redF: ["fiebre","trauma"] },
  puncion: { n: "Punción seca", d: "10-20 seg por punto gatillo", redC: ["cardio","cancer","infeccion"], redM: ["anticoagulantes"], redF: ["fiebre"] }
};
