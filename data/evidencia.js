/* ============================================================
   KINEFLOW - Evidencia Científica, Bibliografía y RPG Postural
   ============================================================ */

// ============ EVIDENCIA POR PATOLOGÍA ============
const EVIDENCIA = {
  lumbalgia: {
    nivel: "Alta",
    refs: [
      { cita: "Massé-Alarie H, et al. Psychologically-informed vs usual physiotherapy in chronic low back pain. Arch Physiother. 2025;15:32-41.", doi: "10.33393/aop.2025.3323" },
      { cita: "Fanuscu A, et al. Motor control exercises in chronic low back pain. Ir J Med Sci. 2025.", doi: "10.1007/s11845-025-04187-w" },
      { cita: "Lumbar stabilization exercise with ultrasound biofeedback. Sci Rep. 2025;15:36975.", doi: "10.1038/s41598-025-20942-6" }
    ],
    dosis: "Ejercicio de control motor 2-3 días/semana, 3 series x 10-15 reps, mínimo 8 semanas. La estabilización lumbar mejora dolor y discapacidad."
  },
  cervicalgia: {
    nivel: "Alta",
    refs: [
      { cita: "JOSPT Neck Pain Clinical Practice Guidelines Revision 2017.", doi: "10.2519/jospt.2017.0302" },
      { cita: "Lomas-Vega R, et al. Global Postural Re-education vs neck specific exercise in chronic neck pain. PMC. 2023.", doi: "PMC10035445" }
    ],
    dosis: "Ejercicio de flexores profundos 2-3 veces/día, 10 repeticiones. Fortalecimiento escapular 2-3 días/semana."
  },
  gonartrosis: {
    nivel: "Alta",
    refs: [
      { cita: "Ferreira RM, Gonçalves RS. Clinical Guideline for Knee Osteoarthritis. Osteology. 2025;5(3):23.", doi: "10.3390/osteology5030023" },
      { cita: "Arora NK, et al. Exercise prescription variables in musculoskeletal pain. Sports Med. 2024;54(3):711-725.", doi: "10.1007/s40279-023-01966-2" }
    ],
    dosis: "Ejercicio de resistencia 2-3 días/semana, 3 series x 10-15 reps, intensidad moderada (40-60% 1RM). Mínimo 12 semanas."
  },
  hombro_manguito: {
    nivel: "Alta",
    refs: [
      { cita: "Lafrance S, et al. Exercise therapy for rotator cuff-related shoulder pain according to FITT. JOSPT. 2024;54(8):499-512.", doi: "10.2519/jospt.2024.12453" }
    ],
    dosis: "Ejercicio de control motor y fortalecimiento progresivo, 3 series x 12-15 reps, 3 días/semana, 12 semanas mínimo."
  },
  lca: {
    nivel: "Alta",
    refs: [
      { cita: "Ardern CL, et al. Return to sport consensus statement. Br J Sports Med. 2016.", doi: "10.1136/bjsports-2016-096278" }
    ],
    dosis: "Rehabilitación de 9-12 meses. Criterios de retorno: simetría >90% en hop tests y fuerza de cuádriceps."
  },
  riesgo_caidas: {
    nivel: "Alta",
    refs: [
      { cita: "Cochrane Review. Exercise for preventing falls in older people. 2019.", doi: "10.1002/14651858.CD012424.pub2" }
    ],
    dosis: "Fuerza 2-3 días/semana, ≥12 semanas. Intensidad moderada-alta (60-80% 1RM) para robustos, baja-moderada para frágiles."
  }
};

// ============ BIBLIOGRAFÍA CLÁSICA ============
const BIBLIOGRAFIA = {
  souchard: { autor: "Souchard PE.", titulo: "Reeducación Postural Global: El método RPG", editorial: "Elsevier Masson", edicion: "1ª ed.", anio: 2011, isbn: "978-84-458-2074-4", nota: "Libro fundacional del método RPG." },
  tortora: { autor: "Tortora GJ, Derrickson B.", titulo: "Principios de Anatomía y Fisiología", editorial: "Médica Panamericana", edicion: "13ª ed.", anio: 2018, isbn: "978-950-06-9457-1", nota: "Anatomía de referencia." },
  kapandji: { autor: "Kapandji IA.", titulo: "Fisiología Articular (3 tomos)", editorial: "Médica Panamericana", edicion: "6ª ed.", anio: 2012, isbn: "978-950-06-9529-5", nota: "Biblia de la biomecánica articular." },
  kendall: { autor: "Kendall FP, et al.", titulo: "Músculos: Pruebas y Funciones", editorial: "Médica Panamericana", edicion: "5ª ed.", anio: 2007, isbn: "978-950-06-0416-7", nota: "Evaluación muscular manual." },
  neumann: { autor: "Neumann DA.", titulo: "Kinesiology of the Musculoskeletal System", editorial: "Elsevier", edicion: "3ª ed.", anio: 2016, isbn: "978-0-323-28753-7", nota: "Kinesiología avanzada." },
  garcia: { autor: "García Porrero JA, Hurlé JM.", titulo: "Anatomía Humana", editorial: "Médica Panamericana", edicion: "2ª ed.", anio: 2015, isbn: "978-84-9835-594-2", nota: "Anatomía descriptiva." },
  campignion: { autor: "Campignion L.", titulo: "Cadenas musculares y articulares", editorial: "Elsevier Masson", edicion: "1ª ed.", anio: 2001, isbn: "978-84-458-1148-3", nota: "Complemento del RPG." },
  busquet: { autor: "Busquet L.", titulo: "Las cadenas fisiológicas (5 tomos)", editorial: "Elsevier Masson", edicion: "1ª ed.", anio: 2006, isbn: "978-84-458-1645-7", nota: "Cadenas fisiológicas." },
  bienfait: { autor: "Bienfait M.", titulo: "Los planos de la organización corporal", editorial: "Elsevier Masson", edicion: "1ª ed.", anio: 1999, isbn: "978-84-458-0779-0", nota: "Análisis postural francés." }
};

// ============ RPG - POSTURAS DE SOUCHARD ============
const RPG_POSTURAS = {
  rana_suelo: { nombre: "Rana al suelo", cadena: "Cadena anterior (fémur, cadera)", duracion: "20-30 min", objetivo: "Apertura de caderas y estiramiento del psoas, recto anterior y aductores.", indicaciones: ["Lumbalgia con acortamiento de psoas", "Síndrome cruzado inferior", "Coxartrosis con contractura"], contraindicaciones: ["Luxación de cadera", "Prótesis reciente", "Embarazo avanzado"], pasos: ["Paciente en decúbito supino.", "Piernas abiertas en abducción, rodillas flexionadas, plantas juntas.", "Brazos en cruz o detrás de la cabeza.", "Corrección activa: apertura de caderas mientras se espira.", "Sostener 20-30 min con respiración diafragmática."], bib: "Souchard, P. Reeducación Postural Global. Elsevier Masson. Cap. 4." },
  rana_aire: { nombre: "Rana en el aire", cadena: "Cadena anterior del tronco + MMSS", duracion: "20-30 min", objetivo: "Estiramiento global de la cadena anterior con apertura de brazos.", indicaciones: ["Hipercifosis", "Cervicalgia con proyección anterior", "Síndrome cruzado superior"], contraindicaciones: ["Luxación de hombro", "Cirugía mamaria reciente"], pasos: ["Paciente en decúbito supino.", "Piernas en flexión de cadera 90° apoyadas sobre una silla o pared.", "Brazos abiertos a 90°, palmas hacia arriba.", "Corrección activa: apertura torácica mientras se espira.", "Sostener 20-30 min."], bib: "Souchard, P. Reeducación Postural Global. Cap. 5." },
  angel_suelo: { nombre: "Ángel en el suelo", cadena: "Cadena inspiratoria anterior", duracion: "25-30 min", objetivo: "Apertura torácica y estiramiento del diafragma y músculos inspiratorios.", indicaciones: ["Hipercifosis dorsal", "EPOC (con adaptación)", "Cervicalgia postural"], contraindicaciones: ["Costillas fracturadas recientes", "Cirugía torácica"], pasos: ["Paciente en decúbito supino con una toalla enrollada debajo de la columna dorsal.", "Brazos en cruz, palmas hacia arriba.", "Piernas ligeramente flexionadas y separadas.", "Corrección activa: apertura torácica + respiración costal baja.", "Sostener 25-30 min."], bib: "Souchard, P. Reeducación Postural Global. Cap. 6." },
  angel_sentado: { nombre: "Ángel sentado", cadena: "Cadena inspiratoria con sedestación", duracion: "20-25 min", objetivo: "Apertura torácica en sedestación, ideal para dolor cervical por pantallas.", indicaciones: ["Text neck", "Cervicalgia postural", "Síndrome cruzado superior"], contraindicaciones: ["Hernia discal lumbar con irradiación"], pasos: ["Paciente sentado en un taburete o silla sin respaldo.", "Pies apoyados en el suelo, rodillas separadas.", "Brazos abiertos a 90°, palmas hacia arriba.", "Corrección activa: apertura torácica + extensión cervical suave.", "Sostener 20-25 min."], bib: "Souchard, P. Reeducación Postural Global. Cap. 6." },
  portugues: { nombre: "El portugués", cadena: "Cadena anterior del tronco + MMII", duracion: "25-30 min", objetivo: "Estiramiento de la cadena anterior con elongación axial.", indicaciones: ["Escoliosis", "Hipercifosis", "Lumbalgia crónica"], contraindicaciones: ["Fracturas vertebrales recientes", "Osteoporosis severa"], pasos: ["Paciente en decúbito supino, piernas extendidas juntas.", "Brazos en extensión por encima de la cabeza.", "Corrección activa: elongación axial con espiración.", "Sostener 25-30 min."], bib: "Souchard, P. Reeducación Postural Global. Cap. 7." },
  bailarina: { nombre: "La bailarina", cadena: "Cadena posterior", duracion: "20-25 min", objetivo: "Estiramiento de la cadena posterior completa.", indicaciones: ["Lumbalgia con rectificación", "Isquiotibiales acortados", "Cervicalgia con rectificación"], contraindicaciones: ["Hernia discal aguda", "Ciática en fase irritativa"], pasos: ["Paciente en decúbito supino.", "Piernas extendidas y juntas, pies en flexión dorsal.", "Brazos en extensión por encima de la cabeza.", "Corrección activa: elongación + respiración.", "Sostener 20-25 min."], bib: "Souchard, P. Reeducación Postural Global. Cap. 8." },
  flecha: { nombre: "La flecha", cadena: "Cadena posterior + MMSS", duracion: "20-30 min", objetivo: "Estiramiento posterior con apertura de brazos y liberación escapular.", indicaciones: ["Cervicalgia con rectificación", "Dorsalgia", "Escápula alada"], contraindicaciones: ["Luxación de hombro", "Cirugía de hombro reciente"], pasos: ["Paciente en decúbito supino.", "Brazos en extensión por encima de la cabeza.", "Piernas extendidas juntas.", "Corrección activa: apertura escapular + respiración diafragmática.", "Sostener 20-30 min."], bib: "Souchard, P. Reeducación Postural Global. Cap. 9." }
};

const RPG_INDICACIONES = {
  lumbalgia: ["rana_suelo", "bailarina"],
  cervicalgia: ["angel_sentado", "flecha"],
  hernia_lumbar: ["bailarina"],
  hernia_dorsal: ["angel_suelo", "portugues"],
  escoliosis: ["portugues", "rana_aire"],
  hipercifosis: ["angel_suelo", "portugues"],
  gonartrosis: ["rana_suelo"],
  epoc: ["angel_suelo"],
  fibromialgia: ["angel_sentado"],
  osteoporosis: ["portugues"],
  hombro_manguito: ["rana_aire"]
};
