/* ============================================================
   KINEFLOW CLINICAL - Base de Datos y Plan de Sesiones
   ============================================================ */

const AGENTES = {
  calor: { nombre: "Termoterapia (Calor)", dosis: "15-20 min", contraindica: ["cancer", "tvp", "infeccion", "sensib"] },
  frio: { nombre: "Crioterapia", dosis: "10-15 min", contraindica: ["sensib"] },
  tens: { nombre: "TENS", dosis: "20-30 min", contraindica: ["cardio", "marcapasos", "infeccion", "embarazo"] },
  magneto: { nombre: "Magnetoterapia", dosis: "20-30 min", contraindica: ["cardio", "marcapasos", "implante", "cancer"] },
  us: { nombre: "Ultrasonido", dosis: "5-8 min", contraindica: ["cancer", "tvp", "infeccion"] },
  manual: { nombre: "Terapia Manual", dosis: "Movilización", contraindica: ["osteoporosis", "cancer", "tvp"] }
};

const SESIONES_PLAN = [
  { n: 1, fase: "Evaluación y Movilidad Protegida", criterio: "Dolor ≤ 3/10" },
  { n: 2, fase: "Movilidad y Control", criterio: "Sin dolor a 24h" },
  { n: 3, fase: "Activación", criterio: "3x10 sin dolor" },
  { n: 4, fase: "Consolidación", criterio: "Sin compensaciones" },
  { n: 5, fase: "Reevaluación", criterio: "Mejoría en test" },
  { n: 6, fase: "Fuerza Progresiva", criterio: "3x12 sin dolor" },
  { n: 7, fase: "Consolidación", criterio: "Sin dolor > 3/10" },
  { n: 8, fase: "Transferencia", criterio: "Funcional sin dolor" },
  { n: 9, fase: "Integración", criterio: "Dolor ≤ 2/10" },
  { n: 10, fase: "Alta", criterio: "Test negativo" }
];

const DB = {
  lumbalgia: { nombre: "Lumbalgia mecánica", test: "Test de Lasègue", agentes: ["calor", "tens", "manual"], ejercicios: { consultorio: ["Movilidad pélvica en cuadrupedia", "Activación de core", "Puente de glúteos"], casa: ["Sentarse y pararse de la silla", "Caminata con obstáculos"], gimnasio: ["Peso muerto con barra", "Prensa"], bandas: ["Buenos días con banda", "Pallof press"], pelotas: ["Puente sobre pelota", "Plancha sobre pelota"] } },
  cervicalgia: { nombre: "Cervicalgia mecánica", test: "Test de Spurling", agentes: ["calor", "manual"], ejercicios: { consultorio: ["Movilidad cervical", "Chin tuck", "Flexores profundos"], casa: ["Chin tuck sentado", "Postura"], gimnasio: ["Remo en máquina", "Jalón"], bandas: ["Remo con banda"], pelotas: ["Control escapular"] } },
  hombro: { nombre: "Manguito rotador", test: "Test de Jobe", agentes: ["frio", "us", "tens"], ejercicios: { consultorio: ["Péndulos", "Movilidad con bastón", "Manguito en pared"], casa: ["Alcance a estantes", "AVD"], gimnasio: ["Press hombro", "Remo", "Laterales"], bandas: ["Rotación externa", "Face pull"], pelotas: ["Estabilización"] } },
  rodilla: { nombre: "Gonartrosis", test: "Test de McMurray", agentes: ["calor", "frio", "tens"], ejercicios: { consultorio: ["Movilidad activa", "Bicicleta", "Isométrico"], casa: ["Sit-to-stand", "Escalón"], gimnasio: ["Prensa", "Extensión", "Sentadilla"], bandas: ["Sentadilla con banda"], pelotas: ["Sentadilla en pared"] } },
  ciatica: { nombre: "Ciática", test: "Lasègue cruzado", agentes: ["tens", "calor"], ejercicios: { consultorio: ["Movilización neural", "Estabilización"], casa: ["Marcha corta", "Hip hinge"], gimnasio: ["Prensa parcial"], bandas: ["Glúteo medio"], pelotas: ["Core sobre pelota"] } },
  desgarro_isquiotibiales: { nombre: "Desgarro isquios", test: "Puranen-Orava", agentes: ["frio", "tens", "us"], ejercicios: { consultorio: ["Puente isométrico", "Curl nórdico"], casa: ["Marcha controlada", "Peso muerto banda"], gimnasio: ["Curl femoral"], bandas: ["Curl femoral"], pelotas: ["Puente"] } },
  esguince_tobillo: { nombre: "Esguince tobillo", test: "Cajón anterior", agentes: ["frio", "tens", "us"], ejercicios: { consultorio: ["Bombeos", "Propiocepción", "Peroneos"], casa: ["Equilibrio", "Marcha"], gimnasio: ["Elevación talones"], bandas: ["Eversión"], pelotas: ["Equilibrio"] } },
  capsulitis: { nombre: "Hombro congelado", test: "Rotación externa", agentes: ["calor", "us", "manual"], ejercicios: { consultorio: ["Elevación bastón", "Movilización"], casa: ["Alcance higiene"], gimnasio: ["Remo polea"], bandas: ["Rotación externa"], pelotas: ["Deslizamiento pared"] } },
  epicondilitis: { nombre: "Codo de tenista", test: "Test de Cozen", agentes: ["frio", "us"], ejercicios: { consultorio: ["Movilidad muñeca", "Excéntricos"], casa: ["Tareas livianas"], gimnasio: ["Fortalecimiento muñeca"], bandas: ["Extensión muñeca"], pelotas: ["Agarre"] } },
  tunel_carpiano: { nombre: "Túnel carpiano", test: "Phalen", agentes: ["frio", "tens"], ejercicios: { consultorio: ["Deslizamiento mediano"], casa: ["Ergonomía"], gimnasio: ["Fortalecimiento antebrazo"], bandas: ["Flexión muñeca"], pelotas: ["Pinza"] } },
  lca: { nombre: "Post LCA", test: "Lachman", agentes: ["frio", "tens"], ejercicios: { consultorio: ["Extensión", "Flexión", "Equilibrio"], casa: ["Marcha", "Escalones"], gimnasio: ["Prensa", "Curl femoral"], bandas: ["Sentadilla banda"], pelotas: ["Estabilización"] } },
  fascitis: { nombre: "Fascitis plantar", test: "Windlass", agentes: ["frio", "us"], ejercicios: { consultorio: ["Estiramiento fascia", "Short foot"], casa: ["Calzado adecuado"], gimnasio: ["Elevación talones"], bandas: ["Tibial posterior"], pelotas: ["Rodamiento pelota"] } },
  acv: { nombre: "ACV / Hemiparesia", test: "Ashworth", agentes: ["tens"], ejercicios: { consultorio: ["Movilización", "Control tronco"], casa: ["Transferencias", "AVD"], gimnasio: ["Bicicleta"], bandas: ["Miembro superior"], pelotas: ["Tronco pelota"] } },
  parkinson: { nombre: "Parkinson", test: "Hoehn-Yahr", agentes: [], ejercicios: { consultorio: ["Movilidad axial", "Equilibrio"], casa: ["Marcha pistas"], gimnasio: ["Bicicleta"], bandas: ["Fortalecimiento"], pelotas: ["Equilibrio"] } },
  riesgo_caidas: { nombre: "Riesgo caídas", test: "TUG", agentes: [], ejercicios: { consultorio: ["Equilibrio bipodal"], casa: ["Tándem", "Duales"], gimnasio: ["Bicicleta"], bandas: ["Fortalecimiento"], pelotas: ["Equilibrio inestable"] } }
};
