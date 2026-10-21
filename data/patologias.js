const AGENTES = {
  calor: { nombre: "Termoterapia (Calor)", dosis: "15-20 min · 40-45°C", contraindica: ["cancer", "tvp", "infeccion", "sensib"] },
  frio: { nombre: "Crioterapia", dosis: "10-15 min · fase aguda", contraindica: ["sensib"] },
  tens: { nombre: "TENS (Electroestimulación)", dosis: "80-100 Hz, 20-30 min", contraindica: ["cardio", "marcapasos", "infeccion", "embarazo"] },
  magneto: { nombre: "Magnetoterapia", dosis: "Baja frecuencia, 20-30 min", contraindica: ["cardio", "marcapasos", "implante", "cancer"] },
  us: { nombre: "Ultrasonido Terapéutico", dosis: "1 MHz · 1.0-1.5 W/cm²", contraindica: ["cancer", "tvp", "infeccion"] },
  manual: { nombre: "Terapia Manual", dosis: "Movilización articular", contraindica: ["osteoporosis", "cancer", "tvp"] }
};

const DB = {
  lumbalgia: {
    nombre: "Lumbalgia mecánica", test: "Test de Lasègue", agentes: ["calor", "tens", "manual"],
    ejercicios: {
      consultorio: ["Movilidad pélvica en cuadrupedia", "Activación de core en decúbito supino", "Puente de glúteos en el piso"],
      casa: ["Sentarse y pararse de la silla", "Caminata con obstáculos bajos"],
      gimnasio: ["Peso muerto con barra hexagonal", "Prensa de piernas inclinada"],
      bandas: ["Buenos días con banda elástica", "Pallof press con banda"],
      pelotas: ["Puente de glúteos sobre pelota de estabilidad", "Plancha con antebrazos sobre pelota"]
    }
  },
  cervicalgia: {
    nombre: "Cervicalgia mecánica", test: "Test de Spurling", agentes: ["calor", "manual"],
    ejercicios: {
      consultorio: ["Movilidad cervical activa", "Retracción cervical (chin tuck)", "Activación de flexores profundos"],
      casa: ["Chin tuck en sedestación frente a espejo", "Corrección postural en el trabajo"],
      gimnasio: ["Remo en máquina sentado", "Jalón al pecho en polea alta"],
      bandas: ["Remo con banda elástica", "Rotación externa de hombro con banda"],
      pelotas: ["Control escapular con pelota en pared", "Ejercicios de estabilidad cervical con pelota"]
    }
  },
  hombro: {
    nombre: "Manguito rotador", test: "Test de Jobe (Empty Can)", agentes: ["frio", "us", "tens"],
    ejercicios: {
      consultorio: ["Péndulos de Codman", "Movilidad asistida con bastón", "Rotación externa con banda"],
      casa: ["Alcance funcional a estantes", "Tareas de vestido e higiene"],
      gimnasio: ["Press de hombro en máquina", "Remo en polea baja", "Elevaciones laterales con mancuernas"],
      bandas: ["Rotación interna con banda", "Face pull con banda elástica"],
      pelotas: ["Estabilización de hombro sobre pelota", "Ejercicios de control escapular con pelota"]
    }
  },
  rodilla: {
    nombre: "Gonartrosis", test: "Test de McMurray", agentes: ["calor", "frio", "tens", "magneto"],
    ejercicios: {
      consultorio: ["Movilidad activa de rodilla", "Bicicleta fija sin carga", "Isométrico de cuádriceps"],
      casa: ["Sentarse y pararse de silla", "Subir y bajar un escalón bajo"],
      gimnasio: ["Prensa de piernas", "Extensión de rodilla en máquina", "Sentadilla con barra"],
      bandas: ["Sentadilla con banda elástica", "Monster walk con banda"],
      pelotas: ["Sentadilla en pared con pelota suiza", "Puente de glúteos sobre pelota"]
    }
  }
};
