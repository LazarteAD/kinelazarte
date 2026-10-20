/* ============================================================
   KineFlow — Catálogo clínico de patologías
   Cada entrada tiene:
   - nombre: nombre legible
   - tipo: categoría (fractura, tendinopatia, hernia, ligamento...)
   - testN/testD: test clínico principal y su descripción
   - agentes: array de keys de AGENTES
   - mov/control/fuerza/fuerzaFunc/funcional: ejercicios por fase
   - aviso: precauciones de seguridad
   - escala (opcional): key de ESCALAS
   - evitar (opcional): agentes contraindicados por esta patología
   ============================================================ */

// Avisos estándar reutilizables
const AV_FX = "Fractura: iniciar solo con indicación del traumatólogo y respetando la inmovilización y la carga permitida. Sin movilización forzada ni manipulaciones sobre el foco. Derivar ante dolor creciente, calor o rubor local, parestesias nuevas o signos de trombosis.";
const AV_POP = "Post-operatorio: seguir el protocolo del cirujano (tiempos, rangos y cargas). Vigilar herida, fiebre, edema o dolor desproporcionado y derivar ante cualquiera de ellos.";
const AV_DESG = "Desgarro: evitar estiramientos forzados y carga máxima en la fase aguda (primeros 3-5 días). Derivar si hay hematoma extenso, defecto palpable (rotura completa) o pérdida marcada de fuerza.";

// Aliases de agentes para escribir más compacto
const F = "frio", T = "tens", C = "calor", M = "manual", U = "us", G = "magneto";

// Función auxiliar para no repetir la forma de los objetos
function P(tipo, nombre, testN, testD, agentes, mov, control, fuerza, fuerzaFunc, funcional, extra){
  return Object.assign({
    tipo: tipo,
    nombre: nombre,
    testN: testN,
    testD: testD,
    agentes: agentes || [],
    mov: mov || [],
    control: control || [],
    fuerza: fuerza || [],
    fuerzaFunc: fuerzaFunc || [],
    funcional: funcional || []
  }, extra || {});
}

const DB = {
  lumbalgia: P(
    "mecanico",
    "Lumbalgia mecánica",
    "Test de Lasègue (SLR)",
    "Cribado de tensión neural / compromiso radicular asociado.",
    [C, T, G, M],
    ["Movilidad lumbo-pélvica activa en rango libre de dolor, 2x10", "Respiración diafragmática + básculas pélvicas"],
    ["Activación de core (transverso/multífidos) en decúbito, 3x10", "Puente glúteo bajo umbral de dolor, 3x8"],
    ["Peso muerto rumano con banda/mancuerna, 3x10", "Ejercicio de extensión tipo McKenzie progresivo, 3x10"],
    ["Sit-to-stand asistido, 3x8", "Marcha con obstáculos bajos + carga funcional de objetos"],
    ["Reentrenamiento del gesto de levantar cargas (higiene postural dinámica)", "Progresión hacia actividad laboral/deportiva objetivo"],
    { testExtra: { n: "Test de Slump", d: "Si hay irradiación o adormecimiento hacia el miembro inferior, complementar con este test de tensión neural más sensible." } }
  ),
  cervicalgia: P(
    "mecanico",
    "Cervicalgia mecánica",
    "Test de Spurling",
    "Alta especificidad, baja sensibilidad: un resultado negativo NO descarta radiculopatía.",
    [C, T, G, M],
    ["Movilidad cervical activa multidireccional, 2x10", "Retracción cervical (chin tuck) suave, 3x10"],
    ["Activación de flexores profundos con biofeedback de presión, 3x10", "Control escapular en cadena cerrada"],
    ["Fortalecimiento isométrico progresivo multidireccional, 3x10", "Remo con banda para estabilizadores escapulares"],
    ["Chin tuck funcional en sedestación + higiene postural", "Ejercicios de giro cervical durante marcha supervisada"],
    ["Reentrenamiento postural en tareas de pantalla/trabajo", "Progresión a actividad habitual sin restricciones"],
    { testExtra: { n: "Test neurodinámico de miembro superior (ULNT 1)", d: "Si el paciente refiere adormecimiento u hormigueo hacia el brazo/mano, complementar con este test de tensión neural." } }
  ),
  hombro: P(
    "tendinopatia",
    "Dolor de hombro / manguito rotador",
    "Test de Jobe (Empty Can)",
    "Test sensible para tendinopatía del supraespinoso; su precisión aislada es limitada, combinar con arco doloroso y fuerza.",
    [F, U, T, G],
    ["Péndulos de Codman + movilidad asistida en rango indoloro", "Movilidad escapular activa"],
    ["Activación de manguito en cadena cerrada (pared), 3x10", "Estabilización escapular (retracción/depresión), 3x10"],
    ["Fortalecimiento excéntrico de rotadores externos con banda, 3x12", "Press con progresión de carga controlada"],
    ["Alcance funcional a estantes con carga liviana, 3x8", "Tareas de AVD con el brazo (vestido, higiene) supervisadas"],
    ["Reentrenamiento del gesto deportivo/laboral por encima del hombro", "Progresión a carga completa según tolerancia"]
  ),
  rodilla: P(
    "degenerativo",
    "Gonartrosis / dolor de rodilla",
    "Test de McMurray",
    "Orienta a componente meniscal asociado; en OA el diagnóstico es predominantemente clínico.",
    [C, F, T, G],
    ["Movilidad activa de rodilla en rango indoloro, 2x10", "Bicicleta sin carga a baja resistencia"],
    ["Activación de cuádriceps (contracción isométrica), 3x10", "Control de glúteo medio en apoyo unipodal asistido"],
    ["Sentadilla parcial con banda, 3x10", "Prensa/extensión de rodilla con carga progresiva"],
    ["Sit-to-stand desde silla, 3x8-10", "Subir/bajar un escalón bajo con apoyo, entrenamiento de marcha"],
    ["Reentrenamiento de marcha en terreno irregular", "Progresión funcional hacia actividad habitual (caminar, escaleras)"]
  ),
  cadera: P(
    "degenerativo",
    "Coxartrosis / pinzamiento femoroacetabular",
    "Test de FADIR",
    "Test más utilizado para pinzamiento femoroacetabular anterior.",
    [C, T, G, M],
    ["Movilidad activa de cadera en rango libre de dolor", "Movilidad en cuadrupedia (rock backs) suave"],
    ["Activación de glúteo medio en decúbito lateral, 3x10", "Puente monopodal asistido"],
    ["Sentadilla con control de rango, 3x10", "Abducción de cadera con banda, 3x12"],
    ["Sit-to-stand con apoyo, 3x8", "Entrenamiento de equilibrio y marcha con andador/bastón si aplica"],
    ["Reentrenamiento de marcha y subida de escaleras", "Progresión hacia actividad funcional habitual"]
  ),
  tobillo: P(
    "ligamento",
    "Esguince de tobillo",
    "Test del cajón anterior",
    "Valora inestabilidad del ligamento talofibular anterior.",
    [F, T, G, U],
    ["Movilidad activa de tobillo en rango indoloro (bombeos)", "Movilidad en cadena abierta multidireccional"],
    ["Propiocepción en apoyo bipodal sobre superficie inestable", "Activación de peroneos con banda, bajo umbral"],
    ["Fortalecimiento de peroneos e inversores/eversores con banda, 3x12", "Elevación de talones (gemelos), 3x12"],
    ["Entrenamiento de equilibrio estático asistido", "Marcha funcional con progresión de superficie"],
    ["Reentrenamiento propioceptivo dinámico / gesto deportivo", "Progresión a carrera o actividad laboral con apoyo prolongado"]
  ),
  fascitis: P(
    "tendinopatia",
    "Fascitis plantar",
    "Windlass Test",
    "Reproduce el dolor al tensar la fascia plantar; buena especificidad.",
    [F, U, T, G],
    ["Estiramiento de fascia plantar y tríceps sural, 3x30 seg", "Automasaje con rodillo/pelota bajo el pie"],
    ["Activación de músculos intrínsecos del pie (short foot), 3x10", "Control de carga en apoyo unipodal"],
    ["Elevación de talones progresiva, 3x12", "Fortalecimiento de tríceps sural con carga excéntrica"],
    ["Entrenamiento de marcha con calzado adecuado y descansos programados", "Ejercicios de pie sentado con progresión a bipedestación breve"],
    ["Reentrenamiento de marcha/carrera con progresión de tiempo en pie", "Progresión a actividad laboral con bipedestación prolongada"]
  ),
  epicondilitis: P(
    "tendinopatia",
    "Epicondilitis lateral",
    "Test de Cozen",
    "Reproduce el dolor en epicóndilo lateral con extensión resistida de muñeca.",
    [F, U, T, G],
    ["Movilidad activa de muñeca y codo en rango indoloro", "Deslizamiento neural del nervio radial suave"],
    ["Isométricos de extensores de muñeca bajo umbral de dolor, 3x10", "Control escapular y postural del miembro superior"],
    ["Fortalecimiento excéntrico de extensores de muñeca, 3x12-15", "Fortalecimiento de agarre progresivo"],
    ["Tareas manuales livianas de la vida diaria con carga controlada", "Ejercicio de agarre funcional con objetos cotidianos"],
    ["Reentrenamiento del gesto laboral/deportivo repetitivo", "Progresión a carga completa según tolerancia"]
  ),
  tunel: P(
    "nervio",
    "Síndrome del túnel carpiano",
    "Test de Phalen",
    "Test con mayor sensibilidad para compresión del nervio mediano; combinar con Tinel y electromiograma.",
    [F, T, G],
    ["Deslizamiento neural del nervio mediano, técnica gradual", "Movilidad activa de muñeca en rango indoloro"],
    ["Reeducación postural de muñeca en tareas manuales", "Control de carga en agarre sostenido"],
    ["Fortalecimiento progresivo de flexores/extensores de muñeca, 3x12", "Fortalecimiento de pinza con masilla blanda"],
    ["Adaptación ergonómica de tareas manuales/domésticas", "Ejercicios funcionales de prensión con pausas programadas"],
    ["Reentrenamiento del gesto laboral (tipeo, herramientas)", "Progresión a actividad manual completa según síntomas"]
  ),
  neuropatico: P(
    "nervio",
    "Dolor neuropático periférico / radicular",
    "Test de Slump",
    "Test de tensión neural de alta sensibilidad para compromiso radicular.",
    [T, G],
    ["Movilización neural gradual y de baja carga", "Movilidad activa en rango indoloro de la zona afectada"],
    ["Control motor segmentario de baja demanda", "Ejercicio de estabilización específica según nivel"],
    ["Fortalecimiento progresivo muy gradual, monitoreando síntomas neurológicos", "Ejercicio en cadena cerrada de baja carga"],
    ["Entrenamiento de marcha y equilibrio supervisado", "Tareas funcionales de baja demanda con monitoreo estricto de síntomas"],
    ["Progresión funcional lenta hacia actividad habitual", "Reevaluación neurológica periódica antes de avanzar de fase"]
  ),
  ciatica: P(
    "hernia",
    "Ciática / hernia discal lumbar",
    "Test de Lasègue (SLR)",
    "Alta sensibilidad para compromiso radicular por hernia discal lumbar.",
    [T, G, C],
    ["Movilización neural gradual (deslizamiento)", "Movilidad lumbar en el patrón de preferencia direccional sin provocar irradiación"],
    ["Estabilización lumbar de bajo umbral", "Activación del transverso con respiración en decúbito"],
    ["Fortalecimiento progresivo monitoreando irradiación", "Puente glúteo bilateral con progresión a unipodal"],
    ["Marcha y sit-to-stand asistido", "Caminata progresiva de tramos cortos"],
    ["Progresión funcional lenta con control neurológico periódico", "Técnica de levantamiento con columna neutra"],
    { testExtra: { n: "Test de Slump", d: "Test de tensión neural complementario, útil cuando el SLR no es concluyente o hay dudas sobre el nivel comprometido." } }
  )
});

// ============================================================
// BLOQUE 2: Columna lumbar, cervical y hombro (adicionales)
// ============================================================
Object.assign(DB, {
  hernia_lumbar: P(
    "hernia",
    "Hernia discal lumbar (protrusión / extrusión)",
    "Lasègue cruzado (SLR contralateral)",
    "Poco sensible pero muy específico para hernia discal con compromiso radicular; se combina con SLR y Slump.",
    [T, C],
    ["Movilidad lumbo-pélvica en cuadrupedia (gato-camello) sin dolor referido", "Extensión en prono (McKenzie) solo si el dolor centraliza"],
    ["Activación de transverso abdominal y multífido en decúbito", "Bird-dog con columna neutra"],
    ["Puente glúteo con progresión a unipodal", "Plancha lateral desde rodillas"],
    ["Sit-to-stand con control lumbar", "Marcha con elevación de rodillas y control pélvico"],
    ["Bisagra de cadera (hip hinge) con carga progresiva", "Levantar objetos del suelo con técnica correcta"],
    {
      aviso: "Bandera roja: anestesia en silla de montar, alteración de esfínteres o debilidad progresiva del miembro inferior → derivación urgente (síndrome de cola de caballo).",
      testExtra: { n: "Slump test", d: "Complementa al SLR para reproducir síntomas neurales." }
    }
  ),
  estenosis_lumbar: P(
    "degenerativo",
    "Estenosis de canal lumbar",
    "Test de la bicicleta de Van Gelderen",
    "Diferencia claudicación neurogénica (mejora en flexión) de vascular.",
    [C, T, G],
    ["Ejercicios en flexión lumbar (postura de alivio)", "Flexión de rodillas al pecho en decúbito"],
    ["Activación de core en posición flexionada", "Inclinación pélvica posterior en decúbito y sentado"],
    ["Fortalecimiento de miembros inferiores en descarga parcial", "Bicicleta fija con inclinación hacia adelante"],
    ["Marcha con apoyo/carro, tramos cortos con descanso", "Marcha en cinta con leve inclinación o apoyada en carro"],
    ["Progresión de distancia de marcha tolerada", "Actividades diarias en posición de flexión leve (ir de compras con carro)"]
  ),
  facetario: P(
    "degenerativo",
    "Síndrome facetario lumbar",
    "Test de extensión-rotación lumbar (Kemp)",
    "Reproduce dolor facetario con extensión y rotación combinadas.",
    [C, T, G, M],
    ["Movilidad en flexión (evitar extensión sostenida)", "Rodillas al pecho y rotación lumbar suave en decúbito"],
    ["Activación de core neutro", "Pájaro-perro (bird-dog) con columna neutra"],
    ["Fortalecimiento de cadena posterior progresivo", "Puente glúteo bilateral"],
    ["Sit-to-stand y marcha funcional", "Marcha con control del patrón postural"],
    ["Reeducación postural en extensión repetida laboral", "Pausas posturales y cambio de posición cada 30 a 40 minutos"]
  ),
  espondilolistesis: P(
    "degenerativo",
    "Espondilólisis / espondilolistesis",
    "Test de Stork (extensión lumbar unipodal)",
    "Reproduce el dolor en la pars interarticularis; la confirmación es por imagen (radiografía / RMN).",
    [C, T],
    ["Báscula pélvica posterior en supino", "Rodillas al pecho suave (flexión lumbar controlada)"],
    ["Dead bug con columna neutra", "Estabilización sobre pelota sin extensión lumbar"],
    ["Plancha frontal progresiva", "Puente glúteo con banda"],
    ["Sit-to-stand desde silla alta", "Marcha con control abdominal"],
    ["Reeducación del gesto deportivo evitando la hiperextensión", "Retorno gradual a la actividad según imagen y síntomas"],
    { aviso: "Evitar extensión lumbar repetida y rotaciones con carga. Deslizamiento grado II o mayor, o déficit neurológico: derivar a traumatología / columna." }
  ),
  piriforme: P(
    "mecanico",
    "Síndrome piriforme",
    "Test de FAIR (flexión-aducción-rotación interna)",
    "Reproduce dolor glúteo por compresión del nervio ciático.",
    [C, T, G],
    ["Estiramiento de piriforme e isquiotibiales", "Movilidad de cadera en rotación interna y externa en decúbito"],
    ["Activación de glúteo medio", "Puente glúteo con control de la pelvis"],
    ["Fortalecimiento de rotadores externos de cadera", "Abducción lateral con banda en decúbito"],
    ["Marcha y sit-to-stand con control pélvico", "Sentadilla con banda sobre las rodillas"],
    ["Progresión a sedestación prolongada y actividad habitual", "Pausas de sedestación y cambios de postura en el trabajo"]
  ),
  sacroileitis: P(
    "mecanico",
    "Disfunción / sacroileítis",
    "Cluster de provocación sacroilíaca (FABER + compresión + distracción)",
    "La combinación de 3 o más tests positivos del cluster tiene buena precisión diagnóstica para dolor de origen sacroilíaco.",
    [C, T, M],
    ["Movilidad pélvica activa en rango indoloro", "Rodillas al pecho alternadas en decúbito"],
    ["Activación de core y glúteo para estabilidad de la pelvis", "Activación del transverso y el suelo pélvico"],
    ["Fortalecimiento progresivo de glúteos y core", "Puente glúteo bilateral con isométrico de aductores (pelota)"],
    ["Sit-to-stand y marcha con control pélvico", "Marcha con pasos cortos y simétricos"],
    ["Progresión a apoyo unipodal, escaleras y actividad habitual", "Evitar asimetrías de carga en el trabajo y la vida diaria"]
  ),
  coccigodinia: P(
    "mecanico",
    "Coccigodinia",
    "Palpación coccígea + dolor al pasar de sentado a parado",
    "Dolor local a la palpación y con sedestación prolongada.",
    [C, T],
    ["Movilidad pélvica en sedestación sobre pelota", "Estiramiento de piriforme y glúteos"],
    ["Activación suave del piso pélvico", "Control postural en sedestación con cojín en U"],
    ["Puente glúteo", "Sentadilla parcial con control pélvico"],
    ["Sit-to-stand con cojín en U", "Marcha con control pélvico"],
    ["Pausas de sedestación cada 30 minutos", "Retorno a la actividad habitual"]
  ),
  hernia_dorsal: P(
    "hernia",
    "Hernia discal dorsal",
    "Test de Slump (con atención a síntomas torácicos) + examen neurológico de miembros inferiores",
    "Reproduce el dolor y descarta compromiso medular; ante signos de mielopatía derivar.",
    [F, T],
    ["Movilidad torácica en extensión sobre rodillo o toalla", "Respiración costal con expansión torácica"],
    ["Activación del transverso y control escapular", "Postura neutra sentado y de pie"],
    ["Remo con banda con retracción escapular", "Extensión torácica activa en cuadrupedia"],
    ["Sit-to-stand con columna neutra", "Marcha con control postural"],
    ["Cargas livianas con técnica de columna neutra", "Retorno gradual a las actividades diarias y laborales"],
    { aviso: "Descartar mielopatía (debilidad en piernas, marcha torpe, alteración de esfínteres): derivar. Evitar manipulaciones de alta velocidad en la zona." }
  ),
  dorsalgia: P(
    "mecanico",
    "Dorsalgia mecánica / contractura dorsal",
    "Movilidad segmentaria torácica (presión posteroanterior) + palpación",
    "Identifica segmentos hipomóviles dolorosos; siempre descartar causa visceral y banderas rojas.",
    [C, T, M],
    ["Extensión torácica sobre rodillo", "Rotación torácica en cuadrupedia (thread the needle)"],
    ["Control escapular en prono (Y-T-W)", "Respiración costal inferior con elongación axial"],
    ["Remo con banda", "Retracción escapular con peso corporal en la pared"],
    ["Sit-to-stand con tórax abierto", "Marcha con balanceo amplio de brazos"],
    ["Ergonomía y pausas activas laborales", "Retorno a la actividad deportiva o laboral"],
    { aviso: "Dolor dorsal con fiebre, pérdida de peso, dolor nocturno intenso o dolor torácico irradiado: derivar (causa visceral u oncológica)." }
  ),
  hipercifosis: P(
    "mecanico",
    "Hipercifosis dorsal / cifosis postural / Scheuermann",
    "Distancia pared-occipucio + inclinometría de cifosis",
    "Una distancia mayor a 0 cm contra la pared sugiere cifosis aumentada; sirve para el seguimiento.",
    [C, T],
    ["Extensión torácica sobre rodillo de espuma", "Apertura torácica en decúbito lateral (open book)"],
    ["Retracción escapular con elongación axial", "Activación de extensores dorsales en prono (Y-T-W)"],
    ["Remo con banda con retracción escapular", "Extensión dorsal en prono con elevación de brazos"],
    ["Sit-to-stand con tórax abierto", "Marcha con tracción de banda hacia atrás"],
    ["Reeducación postural en sedestación laboral", "Pausas activas programadas durante el día"],
    { aviso: "En Scheuermann con dolor progresivo o curvas mayores a 60° derivar a ortopedia." }
  ),
  escoliosis: P(
    "pediatrico",
    "Escoliosis idiopática (ejercicio de corrección)",
    "Test de Adams (flexión anterior) + escoliómetro",
    "Un ángulo de rotación del tronco ≥7° justifica estudio radiográfico (ángulo de Cobb).",
    [],
    ["Elongación axial activa con auto-corrección", "Respiración rotacional angular (tipo Schroth) en decúbito lateral"],
    ["Auto-corrección frente al espejo con sostén de la postura", "Estabilización en cuadrupedia con corrección de la curva"],
    ["Remo con banda manteniendo la corrección", "Plancha lateral hacia el lado de la concavidad"],
    ["Mantener la corrección durante el sit-to-stand", "Marcha con auto-corrección postural"],
    ["Integrar la corrección en actividades escolares y deportivas", "Programa domiciliario diario de corrección"],
    { aviso: "Derivar al ortopedista si el ángulo de Cobb es ≥20° o hay progresión rápida (decisión sobre corsé)." }
  ),
  fractura_vertebral: P(
    "fractura",
    "Fractura vertebral por compresión (osteoporótica)",
    "Percusión suave de la apófisis espinosa + radiografía lateral indicada por el médico",
    "El dolor focal a la percusión orienta a fractura; la confirmación es por imagen.",
    [T, F],
    ["Respiración diafragmática en supino", "Movilidad de cadera y rodillas en decúbito sin flexionar la columna"],
    ["Extensores dorsales en isométrico en prono con almohada", "Postura erguida con elongación axial en sedestación"],
    ["Extensión dorsal isométrica en prono", "Remo liviano con banda con columna neutra"],
    ["Sit-to-stand con tórax abierto y apoyo de manos", "Marcha con andador o bastón según equilibrio"],
    ["Entrenamiento de equilibrio y prevención de caídas", "Levantarse de la cama sin flexión (log roll)"],
    {
      aviso: AV_FX + " Evitar flexión de columna con carga, torsiones y todo impacto; solo con control radiológico de estabilidad.",
      evitar: ["manual", "puncion", "ondacorta", "calor"]
    }
  ),
  espondilitis: P(
    "reumatologico",
    "Espondilitis anquilosante / espondiloartritis axial",
    "Test de Schober modificado + BASDAI",
    "Un Schober menor a 5 cm indica restricción de flexión lumbar; el BASDAI cuantifica la actividad de la enfermedad.",
    [C, T],
    ["Extensión de columna en prono (esfinge)", "Rotación de columna en decúbito con rodillas flexionadas"],
    ["Respiración costal expansiva con elongación axial", "Postura erguida contra la pared"],
    ["Extensión dorsal en prono", "Remo con banda"],
    ["Sit-to-stand con tórax abierto", "Marcha con balanceo amplio de brazos"],
    ["Ejercicio aeróbico de bajo impacto (natación o bicicleta)", "Rutina diaria de movilidad espinal"],
    { aviso: "Evitar reposo prolongado. En brotes inflamatorios coordinar con reumatología." }
  ),
  costillas: P(
    "fractura",
    "Fractura de costillas",
    "Compresión costal anteroposterior y lateral",
    "El dolor focal con la compresión a distancia del foco orienta a fractura costal.",
    [T],
    ["Respiración diafragmática suave", "Movilidad de hombros en rango sin dolor"],
    ["Expansión costal asistida con almohada", "Control de la tos con apoyo"],
    ["Ejercicios de movilidad torácica suaves", "Marcha progresiva"],
    ["Sit-to-stand", "Actividad aeróbica suave"],
    ["Retorno a las actividades habituales", "Retorno al deporte sin contacto"],
    {
      aviso: AV_FX + " Vigilar fiebre, disnea o dolor torácico que empeora: derivar (neumotórax o complicación pulmonar). No usar fajas ni vendajes compresivos.",
      evitar: ["manual"]
    }
  ),
  costocondritis: P(
    "mecanico",
    "Costocondritis / síndrome de Tietze",
    "Palpación de las articulaciones costocondrales (reproduce el dolor) + dolor con la inspiración profunda",
    "El dolor localizado a la palpación y reproducible con el movimiento orienta a origen de la pared torácica.",
    [C, T],
    ["Movilidad torácica en extensión y rotación", "Respiración costal con expansión suave"],
    ["Control postural escapular", "Respiración diafragmática"],
    ["Remo con banda con retracción escapular", "Fortalecimiento de pectoral y dorsal en rango sin dolor"],
    ["Actividades diarias con postura erguida", "Marcha con respiración controlada"],
    ["Retorno gradual al ejercicio", "Educación: es benigna y autolimitada"],
    { aviso: "Descartar origen cardíaco o pulmonar ante dolor opresivo, disnea, sudoración o irradiación al brazo: derivar de urgencia. Un dolor torácico nuevo nunca debe asumirse como musculoesquelético sin descartar causa grave." }
  ),
  cefalea_tensional: P(
    "mecanico",
    "Cefalea tensional",
    "Palpación de músculos pericraneales y cervicales + test de flexión craneocervical",
    "Dolor opresivo bilateral con sensibilidad muscular y sin signos neurológicos orienta a cefalea tensional.",
    [C, T],
    ["Movilidad cervical suave", "Respiración diafragmática y relajación"],
    ["Retracción cervical", "Conciencia postural"],
    ["Fortalecimiento de flexores cervicales profundos", "Remo con banda con retracción escapular"],
    ["Pausas posturales en el trabajo", "Marcha con postura erguida"],
    ["Ejercicio aeróbico regular", "Manejo del estrés y la higiene del sueño"],
    { aviso: "Banderas rojas de cefalea: inicio súbito e intenso (en trueno), fiebre con rigidez de nuca, déficit neurológico, cefalea nueva después de los 50 años o tras traumatismo: derivar de urgencia." }
  ),
  cefalea_cervicogenica: P(
    "mecanico",
    "Cefalea cervicogénica",
    "Cervical Flexion-Rotation Test",
    "Detecta restricción de rotación en C1-C2, característica de este cuadro.",
    [C, M],
    ["Movilidad segmentaria alta cervical (C1-C2)", "Rotación cervical alta en flexión (autotécnica de C1-C2)"],
    ["Activación de flexores profundos cervicales", "Retracción cervical con flexión craneocervical"],
    ["Fortalecimiento cervicoescapular progresivo", "Remo con banda y retracción escapular"],
    ["Higiene postural funcional en AVD/trabajo", "Marcha con postura erguida"],
    ["Reentrenamiento postural sostenido en tareas diarias", "Pausas posturales y ergonomía en pantallas"]
  ),
  latigazo: P(
    "ligamento",
    "Latigazo cervical (whiplash)",
    "Escala de gravedad de Quebec (QTF)",
    "Clasifica el grado de lesión y orienta el manejo (I-IV).",
    [F, T, G],
    ["Movilidad activa temprana en rango indoloro", "Rotación cervical activa lenta"],
    ["Activación de flexores profundos cervicales", "Activación de flexores profundos con cabeza neutra"],
    ["Fortalecimiento progresivo cervicoescapular", "Isométricos cervicales en los cuatro planos"],
    ["Actividades funcionales de cabeza/cuello supervisadas", "Actividades diarias con movimiento cervical libre"],
    ["Retorno gradual a actividad habitual/laboral", "Retorno gradual a conducir y al trabajo"],
    { escala: "quebec" }
  ),
  torticolis: P(
    "mecanico",
    "Tortícolis agudo / contractura cervical",
    "Rango activo de rotación e inclinación cervical (inclinómetro)",
    "Cuantifica la limitación y permite objetivar la mejoría sesión a sesión.",
    [C, T, M],
    ["Movilidad cervical activa en rango indoloro", "Retracción cervical suave"],
    ["Activación de flexores profundos", "Control escapular básico"],
    ["Isométricos cervicales submáximos", "Remo con banda"],
    ["Giro cervical durante marcha supervisada", "Sit-to-stand con control cervical"],
    ["Pausas activas y ergonomía del puesto de trabajo", "Retorno a la actividad habitual"],
    { aviso: "Tortícolis con fiebre, rigidez de nuca, o que persiste más de 2 semanas: derivar." }
  ),
  desfiladero: P(
    "nervio",
    "Síndrome del desfiladero torácico",
    "Test de Roos (EAST: 3 minutos con los brazos elevados y abriendo y cerrando las manos)",
    "La reproducción de dolor, parestesias o fatiga del brazo antes de los 3 minutos orienta al diagnóstico.",
    [C, T],
    ["Estiramiento de escalenos y pectoral menor", "Movilidad torácica"],
    ["Control escapular", "Respiración diafragmática"],
    ["Remo con banda", "Fortalecimiento de trapecio inferior"],
    ["Sit-to-stand con postura erguida", "Transporte de cargas livianas"],
    ["Ergonomía del puesto de trabajo", "Retorno a actividades por encima de la cabeza"],
    { aviso: "Cambios de color, frialdad, edema marcado o dolor intenso del miembro: descartar compromiso vascular y derivar." }
  ),
  // ---------- HOMBRO ----------
  rotura_manguito: P(
    "desgarro",
    "Desgarro / rotura del manguito rotador",
    "Combinación: drop arm test + arco doloroso + debilidad en rotación externa",
    "La presencia de los tres signos da muy buena probabilidad de rotura completa.",
    [F, T],
    ["Péndulos de Codman", "Elevación asistida con bastón en plano escapular"],
    ["Activación de manguito en cadena cerrada (pared)", "Control escapular: retracción y depresión"],
    ["Rotación externa en decúbito lateral con banda", "Elevación en plano escapular hasta 90° de forma progresiva"],
    ["Alcance funcional a estantes con carga liviana", "Tareas de vestido e higiene con el brazo"],
    ["Entrenamiento por encima de la cabeza de forma progresiva", "Progresión a carga completa según tolerancia"],
    { aviso: "Rotura completa aguda o traumática, o pérdida marcada de la elevación activa: derivar a traumatología (decisión quirúrgica)." }
  ),
  capsulitis: P(
    "mecanico",
    "Capsulitis adhesiva (hombro congelado)",
    "Rango pasivo de rotación externa",
    "Limitación pasiva marcada y proporcional es el hallazgo clave (a diferencia del manguito).",
    [C, U],
    ["Movilización articular progresiva según fase (congelamiento/meseta/descongelamiento)", "Elevación asistida con bastón en decúbito supino"],
    ["Activación suave de manguito en rango disponible", "Control escapular con deslizamientos en pared"],
    ["Fortalecimiento progresivo al recuperar rango", "Isométricos de rotadores en neutro"],
    ["Tareas de AVD con el brazo (vestido, higiene)", "Alcance con el brazo en tareas de higiene y vestido"],
    ["Progresión a rango funcional completo", "Tareas diarias con alcance cada vez mayor"],
    { escala: null }
  ),
  inestabilidad_hombro: P(
    "ligamento",
    "Inestabilidad glenohumeral",
    "Test de aprensión (Apprehension test)",
    "Reproduce sensación de inestabilidad anterior del hombro.",
    [F, T, G],
    ["Movilidad controlada evitando posición de riesgo", "Movilidad pasiva-asistida en plano escapular"],
    ["Estabilización dinámica del manguito y escápula", "Estabilización rítmica en apoyo sobre pared o mesa"],
    ["Fortalecimiento progresivo de rotadores y estabilizadores", "Rotación externa con banda a 0° de abducción"],
    ["Tareas funcionales con control de posición de riesgo", "Empuje en pared con control escapular"],
    ["Reentrenamiento del gesto deportivo/laboral específico", "Progresión de posiciones de riesgo con control"]
  ),
  tendinopatia_bicipital: P(
    "tendinopatia",
    "Tendinopatía de la porción larga del bíceps",
    "Speed's test",
    "Dolor en el surco bicipital al flexionar el hombro contra resistencia con el codo extendido.",
    [F, U, T],
    ["Movilidad de hombro en rango indoloro", "Estiramiento suave de pectoral"],
    ["Control escapular", "Activación de manguito"],
    ["Flexión de codo excéntrica con banda", "Rotación externa con banda"],
    ["Alcance funcional con carga liviana", "Transporte de objetos livianos"],
    ["Retorno al gesto de levantamiento", "Progresión de carga"]
  ),
  acromioclavicular: P(
    "ligamento",
    "Esguince acromioclavicular (AC)",
    "Test de aducción horizontal (cross-body) + palpación de la AC",
    "Dolor localizado sobre la articulación AC al llevar el brazo cruzado al pecho.",
    [F, T],
    ["Movilidad pasiva del hombro en rango indoloro", "Péndulos de Codman"],
    ["Control escapular en pared", "Isométricos de deltoides"],
    ["Press en plano escapular progresivo", "Remo con banda"],
    ["Alcance funcional con carga liviana", "Transporte de objetos livianos"],
    ["Retorno al deporte con contacto progresivo", "Aumento gradual de la carga"],
    { aviso: "Grados IV a VI (desplazamiento clavicular marcado): derivar a traumatología." }
  ),
  slap: P(
    "ligamento",
    "Lesión labral SLAP",
    "Test de O'Brien (active compression)",
    "El dolor al empujar hacia abajo con el pulgar hacia abajo, que mejora con la palma hacia arriba, orienta a lesión labral superior.",
    [F, T],
    ["Movilidad pasiva en rango sin dolor", "Estiramiento posterior de hombro (cross-body)"],
    ["Activación de manguito", "Estabilización escapular"],
    ["Rotación externa con banda", "Remo con banda"],
    ["Tareas funcionales de alcance", "Cargas livianas con el brazo"],
    ["Entrenamiento deportivo por encima de la cabeza", "Progresión de carga"],
    { aviso: "Confirmar con artro-RMN. Si hay bloqueo o inestabilidad franca, derivar a ortopedia." }
  ),
  calcificante: P(
    "tendinopatia",
    "Tendinopatía calcificante del hombro",
    "Ecografía o radiografía (diagnóstico) + arco doloroso",
    "La imagen confirma el depósito cálcico; el arco doloroso orienta a la clínica.",
    [F, U, T],
    ["Movilidad pasiva de hombro", "Péndulos de Codman"],
    ["Control escapular", "Activación de manguito"],
    ["Rotación externa excéntrica", "Elevación en plano escapular"],
    ["Alcance funcional con carga liviana", "Tareas de vida diaria con el brazo"],
    ["Entrenamiento por encima de la cabeza", "Retorno a la actividad habitual"],
    { aviso: "En la fase aguda (dolor muy intenso) priorizar el manejo médico del dolor y derivar." }
  ),
  disquinesia_escapular: P(
    "mecanico",
    "Disquinesia escapular / escápula alada",
    "Test de disquinesia escapular (observación de la escápula durante elevación con carga)",
    "Detecta el despegue o movimiento anormal de la escápula durante la elevación.",
    [T],
    ["Movilidad escapular activa (círculos y retracción)", "Deslizamientos de pared"],
    ["Control escapular con espejo", "Activación de serrato anterior (empuje con plus)"],
    ["Remo con banda con retracción escapular", "Elevación en plano escapular con carga baja"],
    ["Empuje en pared", "Transporte de objetos livianos con postura controlada"],
    ["Flexiones en pared o inclinadas progresivas", "Gestos deportivos o laborales por encima de la cabeza"],
    { aviso: "Si la escápula alada es marcada o la debilidad persiste, descartar lesión del nervio torácico largo y derivar." }
  ),
  fractura_humero_prox: P(
    "fractura",
    "Fractura de húmero proximal",
    "ROM activo-asistido según fase + control radiológico de consolidación",
    "Las fases se guían por el control radiográfico y el protocolo del traumatólogo.",
    [F, T],
    ["Péndulos de Codman (según indicación)", "Movilidad activo-asistida de hombro con bastón"],
    ["Movilidad activa de codo, muñeca y mano", "Isométricos submáximos de hombro en fase tardía"],
    ["Rotación externa con banda tras la consolidación", "Elevación en plano escapular progresiva"],
    ["Actividades de vida diaria de bajo nivel", "Alcance funcional con carga liviana"],
    ["Entrenamiento por encima del hombro", "Retorno a las actividades habituales"],
    { aviso: AV_FX }
  ),
  fractura_clavicula: P(
    "fractura",
    "Fractura de clavícula",
    "ROM activo del hombro + control radiológico de consolidación",
    "Se progresa según la consolidación y la indicación del traumatólogo.",
    [F, T],
    ["Movilidad activa de codo, muñeca y mano", "Movilidad pendular de hombro (según indicación)"],
    ["Control escapular isométrico", "Activación de deltoides"],
    ["Remo con banda tras la consolidación", "Press en plano escapular"],
    ["Tareas de vestido y higiene", "Transporte de cargas livianas"],
    ["Retorno gradual a la actividad", "Carga completa"],
    { aviso: AV_FX }
  )
});

// ============================================================
// BLOQUE 3: Codo, muñeca, mano, cadera y rodilla
// ============================================================
Object.assign(DB, {
  // ---------- CODO ----------
  epitrocleitis: P(
    "tendinopatia",
    "Epitrocleítis (codo de golfista)",
    "Test de flexión resistida de muñeca",
    "Reproduce dolor en epitróclea con flexión de muñeca contra resistencia.",
    [F, U, T, G],
    ["Movilidad de muñeca y codo en rango indoloro", "Movilidad de codo y estiramiento suave de flexores de muñeca"],
    ["Isométricos de flexores de muñeca bajo umbral", "Isométricos de flexores en distintos ángulos"],
    ["Fortalecimiento excéntrico de flexores de muñeca", "Isotónicos de flexores y pronadores con carga liviana"],
    ["Tareas manuales livianas con carga controlada", "Agarre con pelota blanda y control del dolor"],
    ["Reentrenamiento del gesto laboral/deportivo", "Ajuste de técnica y agarre en el gesto repetitivo"]
  ),
  luxacion_codo: P(
    "ligamento",
    "Luxación de codo (post-reducción)",
    "Test de estrés en valgo y varo a 30° de flexión + estabilidad en el arco de movimiento",
    "Evalúa la integridad de los ligamentos colaterales y la estabilidad residual.",
    [F, T],
    ["Flexo-extensión activa en rango estable", "Pronosupinación con el codo a 90°"],
    ["Control activo en arco protegido", "Activación isométrica de bíceps y tríceps"],
    ["Fortalecimiento isométrico de flexores y extensores", "Banda liviana en arco seguro"],
    ["Actividades de la vida diaria con carga ligera", "Empuje suave con apoyo en pared"],
    ["Progresión de cargas", "Retorno al deporte y trabajo (alrededor de 3 a 4 meses)"],
    {
      aviso: "Evitar la movilización pasiva forzada y el estiramiento: favorecen la rigidez y la osificación heterotópica. Vigilar el déficit de extensión.",
      evitar: ["calor", "ondacorta", "us"]
    }
  ),
  bursitis_olecraneana: P(
    "tendinopatia",
    "Bursitis olecraneana",
    "Inspección y palpación de la tumefacción posterior del codo",
    "La tumefacción localizada con movilidad conservada orienta a bursitis; calor, rubor o fiebre sugieren infección.",
    [F, T],
    ["Movilidad activa del codo sin dolor", "Evitar el apoyo directo sobre el codo"],
    ["Control del hombro y la escápula", "Activación suave de tríceps"],
    ["Fortalecimiento de tríceps y bíceps con banda", "Ejercicios de agarre"],
    ["Actividades diarias evitando el apoyo en el codo", "Empuje suave"],
    ["Retorno a las actividades laborales y deportivas", "Uso de codera para evitar el apoyo repetido"],
    { aviso: "Calor, rubor, fiebre o herida cercana: sospechar bursitis séptica y derivar de inmediato." }
  ),
  rigidez_codo: P(
    "mecanico",
    "Rigidez de codo post-traumática",
    "Goniometría de flexión y extensión comparativa",
    "Objetiva el déficit de rango y la ganancia sesión a sesión.",
    [C, T],
    ["Estiramiento activo-asistido sostenido en flexión y extensión", "Prono-supinación activa"],
    ["Control escapular", "Activación suave de bíceps y tríceps"],
    ["Flexo-extensión con banda", "Agarre progresivo"],
    ["Actividades funcionales de alcance (peinarse, comer)", "Transporte de objetos livianos"],
    ["Retorno a la actividad habitual", "Carga progresiva"],
    {
      aviso: "Evitar movilizaciones pasivas violentas por riesgo de miositis osificante.",
      evitar: ["manual"]
    }
  ),
  fractura_codo: P(
    "fractura",
    "Fractura de codo (olécranon / cabeza radial)",
    "Goniometría de flexo-extensión y prono-supinación",
    "Permite seguir la recuperación de rangos, que es el principal desafío en el codo.",
    [F, T],
    ["Flexo-extensión activo-asistida en rango protegido", "Prono-supinación con el codo a 90°"],
    ["Isométricos submáximos de codo", "Control escapular"],
    ["Flexo-extensión con banda", "Agarre progresivo"],
    ["Actividades de vida diaria de bajo nivel", "Transporte de objetos livianos"],
    ["Retorno a actividades habituales", "Carga progresiva"],
    {
      aviso: AV_FX + " Evitar estiramientos pasivos forzados (riesgo de miositis osificante).",
      evitar: ["manual", "us"]
    }
  ),
  fractura_supracondilea: P(
    "pediatrico",
    "Fractura supracondílea de húmero (infantil)",
    "Examen neurovascular de la mano (pulso radial, sensibilidad, movilidad de los dedos)",
    "Es la complicación más temida de esta fractura en niños; se controla en cada sesión.",
    [F],
    ["Movilidad de dedos, muñeca y hombro durante la inmovilización", "Juegos de agarre"],
    ["Control activo del miembro", "Actividades lúdicas con la mano libre"],
    ["Flexo-extensión de codo activa jugando", "Agarre con pelotas blandas"],
    ["Actividades de la vida diaria adaptadas", "Juegos de lanzamiento suave"],
    ["Retorno al juego y deporte con autorización", "Recuperación del rango completo"],
    {
      aviso: AV_FX + " Pediátrico: no forzar el rango ni hacer estiramientos pasivos; la recuperación ocurre con el juego y el uso. Dolor creciente, dedos fríos o pálidos: urgencia.",
      evitar: ["calor", "ondacorta", "magneto", "us", "tens"]
    }
  ),
  // ---------- MUÑECA Y MANO ----------
  dequervain: P(
    "tendinopatia",
    "Tendinopatía de De Quervain",
    "Test de Finkelstein",
    "Reproduce dolor en la tabaquera anatómica por estiramiento de los tendones afectados.",
    [F, U],
    ["Movilidad de pulgar con flexión y extensión activa", "Movilidad de pulgar y muñeca en rango indoloro"],
    ["Isométricos del pulgar en posición neutra", "Isométricos de abductor largo/extensor corto del pulgar"],
    ["Fortalecimiento de pinza con masilla blanda", "Fortalecimiento progresivo de pulgar y muñeca"],
    ["Adaptación del agarre con férula en actividades", "Adaptación ergonómica de agarre en tareas diarias"],
    ["Pausas y rotación de tareas repetitivas de pinza", "Progresión a actividad manual completa"]
  ),
  tunel_cubital: P(
    "nervio",
    "Síndrome del túnel cubital",
    "Test de flexión de codo + Tinel cubital",
    "Reproduce parestesias en territorio del nervio cubital.",
    [F, T, G],
    ["Deslizamiento neural del nervio cubital, gradual", "Movilidad de codo evitando la flexión sostenida"],
    ["Reeducación postural del codo en apoyo", "Control postural escapular"],
    ["Fortalecimiento progresivo de mano/antebrazo", "Fortalecimiento de intrínsecos de la mano con masilla"],
    ["Adaptación ergonómica de tareas manuales", "Evitar el apoyo en el codo en las actividades"],
    ["Progresión según evolución sensitivo-motora", "Ajuste de postura nocturna (evitar la flexión de codo)"]
  ),
  tunel_radial: P(
    "nervio",
    "Síndrome del túnel radial / interóseo posterior",
    "Dolor a la palpación 4 a 5 cm distal al epicóndilo + dolor con supinación y extensión del dedo medio resistidos",
    "Se diferencia de la epicondilitis porque el dolor se localiza más distal, sobre el trayecto del nervio.",
    [T],
    ["Movilidad de codo y muñeca sin dolor", "Deslizamiento del nervio radial suave"],
    ["Control postural del miembro superior", "Activación escapular"],
    ["Fortalecimiento de extensores en rango sin dolor", "Isométricos de supinación suave"],
    ["Actividades diarias evitando la supinación forzada", "Agarre con codo flexionado"],
    ["Adaptación de las tareas repetitivas", "Retorno gradual al trabajo"],
    { aviso: "Si hay debilidad marcada de la extensión de dedos o mano caída, derivar para estudio neurológico (electromiograma)." }
  ),
  fractura_colles: P(
    "fractura",
    "Fractura de radio distal (Colles)",
    "Fuerza de agarre (dinamometría) + goniometría de muñeca",
    "Cuantifica la recuperación de la función de la mano y de los rangos de muñeca.",
    [F, T],
    ["Movilidad activa de dedos, codo y hombro durante la inmovilización", "Flexo-extensión activa de muñeca tras retirar el yeso"],
    ["Prono-supinación activa con el codo a 90°", "Deslizamiento de tendones flexores"],
    ["Agarre con pelota blanda de forma progresiva", "Fortalecimiento de flexores y extensores con banda"],
    ["Tareas bimanuales livianas (abrir frascos, vestirse)", "Transporte de objetos cotidianos"],
    ["Apoyo de la mano en cadena cerrada", "Retorno a las actividades habituales"],
    { aviso: AV_FX + " Vigilar edema y signos de síndrome doloroso regional complejo (dolor desproporcionado, cambios de color o temperatura)." }
  ),
  fractura_escafoides: P(
    "fractura",
    "Fractura de escafoides",
    "Dolor en la tabaquera anatómica + compresión axial del pulgar",
    "Hallazgos clásicos de sospecha; la confirmación y el control son por imagen.",
    [F, T],
    ["Movilidad de dedos y hombro durante la inmovilización", "Movilidad activa de muñeca tras el alta"],
    ["Deslizamiento tendinoso", "Prono-supinación activa"],
    ["Agarre progresivo con pelota blanda", "Flexo-extensión de muñeca con banda"],
    ["Tareas livianas de la vida diaria", "Transporte de objetos cotidianos"],
    ["Apoyo de la mano en cadena cerrada", "Retorno a actividades y deporte"],
    { aviso: AV_FX + " El escafoides tiene riesgo de seudoartrosis y necrosis: respetar los tiempos de inmovilización." }
  ),
  esguince_muneca: P(
    "ligamento",
    "Esguince de muñeca / lesión del TFCC",
    "Test de la fóvea cubital (ulnar fovea sign)",
    "Dolor en la fóvea cubital con la presión orienta a lesión del complejo fibrocartilaginoso triangular.",
    [F, T],
    ["Movilidad activa de muñeca en rango indoloro", "Prono-supinación activa"],
    ["Control propioceptivo de muñeca (apoyo con pelota)", "Isométricos de muñeca"],
    ["Flexo-extensión con banda", "Agarre progresivo"],
    ["Tareas livianas bimanuales", "Transporte de objetos"],
    ["Apoyo de la mano en cadena cerrada", "Retorno al deporte o trabajo"],
    { aviso: "Si hay inestabilidad, chasquido doloroso o no mejora en 6 semanas: derivar a cirugía de mano." }
  ),
  dedo_gatillo: P(
    "tendinopatia",
    "Dedo en gatillo (tenosinovitis estenosante)",
    "Chasquido o bloqueo en flexo-extensión activa + nódulo palpable en polea A1",
    "Hallazgos típicos; el dolor se localiza en la base del dedo en la palma.",
    [F, U],
    ["Deslizamientos tendinosos (gancho, puño, puño completo)", "Estiramiento pasivo de flexores"],
    ["Reeducación del agarre", "Ergonomía de herramientas"],
    ["Agarre con masilla blanda", "Extensión de dedos con banda"],
    ["Tareas manuales con agarre amplio", "Pausas programadas en tareas repetitivas"],
    ["Retorno al gesto laboral", "Progresión de carga"]
  ),
  rizartrosis: P(
    "degenerativo",
    "Rizartrosis (artrosis trapeciometacarpiana)",
    "Grind test (compresión y rotación del pulgar)",
    "Dolor y crepitación en la base del pulgar con la compresión axial y la rotación.",
    [C, T],
    ["Movilidad activa del pulgar (oposición, abducción)", "Estiramiento suave del primer espacio"],
    ["Pinza con masilla blanda", "Educación en protección articular"],
    ["Abducción de pulgar con banda", "Pinza lateral progresiva"],
    ["Tareas con agarre amplio y adaptado", "Uso de ayudas técnicas"],
    ["Retorno a tareas manuales", "Mantenimiento de la fuerza de pinza"]
  ),
  dupuytren: P(
    "postquirurgico",
    "Enfermedad de Dupuytren (pre y post-operatorio)",
    "Test de la mesa (tabletop test de Hueston)",
    "Si no se puede apoyar la palma completa sobre la mesa hay contractura relevante.",
    [F, T],
    ["Extensión activa de dedos", "Deslizamiento tendinoso"],
    ["Control de la cicatriz (masaje suave)", "Uso de férula nocturna según indicación"],
    ["Agarre con masilla blanda", "Extensión con banda"],
    ["Tareas manuales livianas", "Transporte de objetos livianos"],
    ["Retorno al trabajo manual", "Mantenimiento del rango"],
    { aviso: AV_POP }
  ),
  fractura_metacarpiano: P(
    "fractura",
    "Fractura de metacarpiano",
    "Fuerza de agarre + ROM de la articulación metacarpofalángica",
    "Seguimiento funcional de la mano tras la consolidación.",
    [F, T],
    ["Movilidad activa de dedos libres durante la inmovilización", "Flexión y extensión activa de la metacarpofalángica tras el alta"],
    ["Deslizamiento tendinoso", "Oposición del pulgar"],
    ["Agarre con masilla blanda", "Fortalecimiento de intrínsecos"],
    ["Tareas livianas de la vida diaria", "Transporte de objetos livianos"],
    ["Retorno al deporte o trabajo manual", "Carga progresiva"],
    { aviso: AV_FX }
  ),
  fractura_falange: P(
    "fractura",
    "Fractura de falanges de la mano",
    "Rango de movimiento activo total (TAM) de los dedos y dolor a la presión",
    "Mide la recuperación de la movilidad de cada dedo.",
    [F],
    ["Movilidad activa de los dedos libres y de los segmentos no inmovilizados", "Elevación para controlar el edema"],
    ["Deslizamiento tendinoso (tendon gliding)", "Agarre suave"],
    ["Fortalecimiento con masilla blanda", "Pinza y agarre con carga baja"],
    ["Actividades diarias con la mano (abotonar, escribir)", "Agarre de objetos livianos"],
    ["Retorno a la actividad laboral", "Fortalecimiento de agarre progresivo"],
    { aviso: AV_FX + " Vigilar rotación o desvío del dedo: puede requerir cirugía." }
  ),
  fractura_antebrazo: P(
    "fractura",
    "Fractura de diáfisis de antebrazo (radio y cúbito)",
    "Rango de pronosupinación y flexo-extensión de muñeca + dolor",
    "La pérdida de pronosupinación es la secuela funcional más frecuente.",
    [F, T],
    ["Movilidad de dedos y hombro durante la inmovilización", "Pronosupinación suave cuando el cirujano lo autorice"],
    ["Control de la muñeca en rango libre", "Activación del agarre"],
    ["Isométricos de muñeca", "Fortalecimiento del agarre con masilla"],
    ["Actividades diarias con carga ligera", "Pronosupinación con martillo liviano"],
    ["Fortalecimiento progresivo", "Retorno a las actividades laborales"],
    { aviso: AV_FX + " Vigilar el síndrome compartimental (dolor desproporcionado, edema tenso)." }
  ),
  tendon_flexor: P(
    "postquirurgico",
    "Lesión de tendones flexores de la mano (post-sutura)",
    "Rango activo total (TAM) + deslizamiento tendinoso",
    "Mide la recuperación de la flexión y detecta adherencias.",
    [F],
    ["Movilización pasiva protegida según el protocolo (Kleinert o Duran)", "Deslizamiento tendinoso controlado"],
    ["Flexión activa controlada dentro de la férula", "Control del edema con elevación"],
    ["Agarre suave a partir de la sexta semana", "Masilla blanda a partir de la sexta semana"],
    ["Actividades livianas de la vida diaria a las 8 semanas", "Agarre de objetos livianos"],
    ["Fortalecimiento progresivo desde las 10 a 12 semanas", "Retorno al trabajo con la mano"],
    {
      aviso: AV_POP + " No realizar flexión activa contra resistencia ni estiramientos agresivos en las primeras semanas: riesgo de rotura de la sutura.",
      evitar: ["calor", "ondacorta", "us", "manual"]
    }
  ),
  tendon_extensor: P(
    "postquirurgico",
    "Lesión de tendones extensores de la mano (post-sutura)",
    "Rango activo de extensión de dedos y muñeca + déficit de extensión (lag)",
    "El lag de extensión mide la recuperación del mecanismo extensor.",
    [F],
    ["Movilización protegida según protocolo (férula en extensión)", "Deslizamiento tendinoso controlado"],
    ["Extensión activa dentro de la férula", "Control del edema"],
    ["Agarre suave a partir de la sexta semana", "Masilla blanda según el protocolo"],
    ["Actividades diarias livianas con la férula", "Pinza suave"],
    ["Retiro gradual de la férula", "Fortalecimiento progresivo y retorno al trabajo"],
    {
      aviso: AV_POP + " No forzar la flexión ni el estiramiento pasivo en las primeras semanas (riesgo de rotura de la sutura).",
      evitar: ["calor", "ondacorta", "us", "manual"]
    }
  ),
  mallet: P(
    "ligamento",
    "Dedo en martillo (mallet finger)",
    "Imposibilidad de extender activamente la falange distal (déficit de extensión)",
    "Un déficit de extensión activa indica rotura o avulsión del tendón extensor terminal.",
    [F],
    ["Movilidad activa de las articulaciones libres", "Control del edema"],
    ["Flexión de la interfalángica proximal con la distal protegida", "Movilidad de la mano"],
    ["Fortalecimiento de los demás dedos", "Agarre suave a partir del retiro de la férula"],
    ["Actividades diarias con la férula puesta", "Pinza con los otros dedos"],
    ["Retiro gradual de la férula", "Retorno al deporte con protección"],
    { aviso: "La férula en extensión continua (6 a 8 semanas) es la clave: retirarla para flexionar el dedo reinicia el tratamiento." }
  ),
  pulgar_esquiador: P(
    "ligamento",
    "Esguince del ligamento colateral cubital del pulgar (pulgar del esquiador)",
    "Test de estrés en valgo de la articulación metacarpofalángica (a 0° y a 30° de flexión)",
    "La laxitud mayor a 30° o 15° más que el lado sano indica rotura completa: derivar.",
    [F],
    ["Movilidad de las articulaciones no inmovilizadas", "Control del edema"],
    ["Movilidad activa del pulgar fuera de la férula según indicación", "Oposición suave"],
    ["Pinza con masilla blanda", "Fortalecimiento de aducción del pulgar"],
    ["Actividades diarias con la férula", "Agarre con carga ligera"],
    ["Retorno a las actividades deportivas con protección", "Fortalecimiento de pinza"],
    { aviso: "Descartar rotura completa o lesión de Stener, que requiere cirugía. No hacer test de estrés forzado ante fractura posible." }
  ),
  artrosis_manos: P(
    "degenerativo",
    "Artrosis de manos (interfalángicas y nódulos de Heberden o Bouchard)",
    "Dolor y limitación de agarre (dinamometría de mano o test de pinza)",
    "Cuantifica la limitación funcional y permite seguir la evolución.",
    [C, T],
    ["Movilidad activa de dedos con calor previo", "Deslizamiento tendinoso"],
    ["Activación de la pinza en rango indoloro", "Ejercicios de conciencia articular"],
    ["Fortalecimiento con masilla blanda", "Agarre con pelota de espuma"],
    ["Actividades diarias con adaptaciones", "Apertura de frascos con ayudas"],
    ["Programa de movilidad diario", "Protección articular en tareas repetitivas"],
    { aviso: "En brote inflamatorio evitar el calor y el ejercicio intenso." }
  ),
  postop_tunel: P(
    "postquirurgico",
    "Post-operatorio de túnel carpiano (liberación)",
    "Test de Phalen y signo de Tinel + sensibilidad en el territorio del mediano",
    "Controla la evolución de los síntomas sensitivos tras la liberación.",
    [F, T],
    ["Movilidad activa de dedos y muñeca desde el primer día", "Deslizamiento del nervio mediano suave"],
    ["Control del edema con elevación", "Masaje de la cicatriz cuando cierre la herida"],
    ["Fortalecimiento de agarre progresivo", "Pinza con masilla blanda"],
    ["Actividades diarias livianas", "Agarre sin apoyo directo sobre la palma"],
    ["Retorno gradual al trabajo (2 a 6 semanas)", "Fortalecimiento completo"],
    { aviso: AV_POP + " Vigilar infección de la herida y dolor palmar excesivo (pilar doloroso)." }
  ),
  // ---------- CADERA ----------
  bursitis_trocanterea: P(
    "tendinopatia",
    "Bursitis trocantérea",
    "Test de palpación trocantérea + Trendelenburg",
    "Dolor a la palpación directa y frecuente déficit de glúteo medio asociado.",
    [F, T, G],
    ["Movilidad de cadera en rango indoloro", "Rodillas al pecho y movilidad de cadera suave"],
    ["Activación de glúteo medio en decúbito lateral", "Puente glúteo con control pélvico"],
    ["Fortalecimiento progresivo de abductores de cadera", "Abducción lateral con banda"],
    ["Marcha y sit-to-stand con control pélvico", "Escalones laterales con banda"],
    ["Progresión a apoyo unipodal y marcha completa", "Evitar cruzar piernas y dormir sobre el lado doloroso"]
  ),
  gluteo_medio: P(
    "tendinopatia",
    "Tendinopatía del glúteo medio (dolor trocantérico mayor)",
    "Apoyo unipodal de 30 segundos (reproduce el dolor) + Trendelenburg",
    "El dolor en el trocánter al sostener el apoyo unipodal orienta a tendinopatía glútea.",
    [F, T],
    ["Movilidad de cadera en rango indoloro", "Evitar aducción sostenida (no cruzar piernas)"],
    ["Isométricos de abducción en decúbito lateral", "Control pélvico en apoyo unipodal asistido"],
    ["Abducción en decúbito con banda", "Puente unipodal progresivo"],
    ["Sit-to-stand con control pélvico", "Marcha con control del Trendelenburg"],
    ["Subida de escalón con control de cadera", "Retorno a carrera y actividad habitual"]
  ),
  pubalgia: P(
    "tendinopatia",
    "Pubalgia / osteítis del pubis",
    "Test de aducción resistida",
    "Reproduce dolor púbico característico de sobrecarga de aductores.",
    [F, T, G],
    ["Movilidad de cadera en rango indoloro", "Movilidad de cadera y aductores en rango indoloro"],
    ["Activación de core y aductores de baja carga", "Activación del transverso y el suelo pélvico"],
    ["Fortalecimiento progresivo de aductores y core", "Aducción con pelota entre las rodillas"],
    ["Marcha funcional y transferencias sin dolor", "Escalones laterales con banda"],
    ["Reentrenamiento gradual del gesto deportivo (cambios de dirección)", "Progresión a carrera lineal y luego cambios de dirección"]
  ),
  fractura_cadera: P(
    "fractura",
    "Fractura de cadera (fémur proximal)",
    "Timed Up and Go (TUG)",
    "Evalúa la movilidad funcional y el riesgo de caídas; más de 12 segundos indica riesgo.",
    [F, T],
    ["Isométricos de cuádriceps y glúteo en cama", "Flexión activo-asistida de cadera y rodilla en el rango permitido"],
    ["Transferencias cama-silla con asistencia", "Bipedestación con apoyo (carga según indicación)"],
    ["Sit-to-stand con apoyo de manos", "Abducción de cadera en decúbito supino"],
    ["Marcha con andador o bastones con la carga permitida", "Subida de un escalón bajo con barandal"],
    ["Entrenamiento de equilibrio y prevención de caídas", "Marcha comunitaria y escaleras"],
    {
      aviso: AV_FX + " Respetar las restricciones de carga y de movimiento (aducción y rotación) según la cirugía.",
      evitar: ["ondacorta", "magneto"],
      escala: "tug"
    }
  ),
  protesis_cadera: P(
    "postquirurgico",
    "Artroplastia total de cadera (prótesis)",
    "Timed Up and Go (TUG) + marcha con ayuda técnica",
    "Mide la recuperación funcional y la seguridad de la marcha.",
    [F, T],
    ["Bombeo de tobillo y activación de cuádriceps y glúteos", "Flexión-extensión de cadera en decúbito dentro de las precauciones"],
    ["Transferencias con técnica segura", "Bipedestación con control pélvico"],
    ["Abducción en decúbito supino", "Puente glúteo bilateral"],
    ["Sit-to-stand con silla alta y apoyo", "Marcha con andador o bastón"],
    ["Escaleras con técnica correcta", "Retorno a la vida diaria y a la actividad (alrededor de los 3 meses)"],
    {
      aviso: AV_POP + " Respetar las precauciones de luxación según la vía de abordaje (en vía posterior evitar flexión mayor a 90°, aducción y rotación interna).",
      evitar: ["ondacorta", "magneto"],
      escala: "tug"
    }
  ),
  desgarro_isquiotibial: P(
    "desgarro",
    "Desgarro de isquiotibiales",
    "Test de Puranen-Orava + dolor a la contracción resistida a 15° y 90° de flexión de rodilla",
    "Reproduce el dolor en la región isquiática o muscular y orienta a la gravedad de la lesión.",
    [F, T, U],
    ["Puente isométrico en decúbito", "Deslizamiento de talón en supino"],
    ["Puente glúteo bilateral", "Marcha controlada sin dolor"],
    ["Curl nórdico asistido (excéntrico)", "Peso muerto rumano con banda"],
    ["Sit-to-stand", "Marcha con pasos largos controlados"],
    ["Carrera progresiva (del trote al sprint)", "Gestos deportivos con cambios de dirección"],
    { aviso: AV_DESG + " Derivar si se sospecha avulsión isquiática." }
  ),
  desgarro_aductor: P(
    "desgarro",
    "Desgarro de aductores",
    "Squeeze test (aducción isométrica apretando un puño o pelota entre las rodillas)",
    "El dolor en la ingle o el muslo interno con la contracción orienta a lesión de aductores.",
    [F, T],
    ["Movilidad de cadera en rango indoloro", "Aducción isométrica suave con pelota"],
    ["Activación de core y aductores de baja carga", "Control pélvico en apoyo bipodal"],
    ["Aducción con banda en decúbito", "Plancha lateral con apoyo de rodilla"],
    ["Sit-to-stand", "Marcha lateral controlada"],
    ["Cambios de dirección progresivos", "Retorno al gesto deportivo"],
    { aviso: AV_DESG }
  ),
  desgarro_cuadriceps: P(
    "desgarro",
    "Desgarro de cuádriceps (recto femoral)",
    "Dolor a la extensión resistida de rodilla + palpación de defecto muscular",
    "Un defecto palpable con pérdida de extensión activa sugiere rotura completa.",
    [F, T, U],
    ["Cuádriceps isométrico en extensión", "Deslizamiento de talón"],
    ["Elevación de pierna recta sin dolor", "Sentadilla parcial asistida"],
    ["Sentadilla con banda", "Extensión de rodilla con carga progresiva"],
    ["Sit-to-stand", "Subida y bajada de escalón controlada"],
    ["Carrera progresiva", "Retorno al gesto deportivo (pateo, salto)"],
    { aviso: AV_DESG + " Rotura completa del tendón del cuádriceps: derivar a traumatología." }
  ),
  cadera_resorte: P(
    "tendinopatia",
    "Cadera en resorte (coxa saltans)",
    "Reproducción del chasquido con flexión-extensión activa de cadera + test de Thomas modificado",
    "Diferencia el chasquido externo (cintilla) del interno (psoas) y orienta el estiramiento y control.",
    [T],
    ["Movilidad de cadera sin provocar el chasquido", "Estiramiento suave del psoas o la cintilla según el tipo"],
    ["Control pélvico en apoyo unipodal", "Activación de glúteo medio"],
    ["Puente glúteo bilateral", "Abducción lateral con banda"],
    ["Sit-to-stand con control de rodillas", "Marcha con control pélvico"],
    ["Escaleras con control de cadera", "Retorno gradual a la actividad deportiva"],
    { aviso: "Si el chasquido es doloroso con bloqueo o falla, descartar lesión intraarticular (labrum) y derivar." }
  ),
  tendinopatia_psoas: P(
    "tendinopatia",
    "Tendinopatía del psoas ilíaco",
    "Dolor en la flexión resistida de cadera a 90° + test de Thomas",
    "Dolor inguinal anterior con la flexión resistida y acortamiento del psoas orientan al diagnóstico.",
    [F, T],
    ["Movilidad de cadera en rango sin dolor", "Estiramiento suave del psoas"],
    ["Control lumbopélvico", "Activación de core"],
    ["Puente glúteo bilateral", "Flexión de cadera isométrica con banda"],
    ["Sit-to-stand", "Marcha con pasos controlados"],
    ["Retorno progresivo a la carrera", "Entrenamiento de flexores con carga progresiva"],
    { aviso: "Dolor inguinal que no cede con ejercicio, o con dolor nocturno: descartar patología de cadera y derivar." }
  ),
  meralgia: P(
    "nervio",
    "Meralgia parestésica (nervio femorocutáneo lateral)",
    "Presión sobre la espina ilíaca anterosuperior + extensión de cadera (reproduce el hormigueo)",
    "La reproducción del dolor o hormigueo en la cara anterolateral del muslo confirma la compresión.",
    [T],
    ["Movilidad de cadera en extensión suave", "Movilidad lumbopélvica"],
    ["Conciencia postural y evitar prendas apretadas", "Control pélvico"],
    ["Puente glúteo bilateral", "Fortalecimiento de core"],
    ["Marcha con postura erguida", "Sit-to-stand"],
    ["Pérdida gradual de peso si corresponde", "Retorno a las actividades sin compresión"],
    { aviso: "No hay debilidad motora en esta condición: si la hay, buscar otra causa (radiculopatía L2-L3) y derivar." }
  ),
  osteonecrosis_cadera: P(
    "degenerativo",
    "Osteonecrosis de la cabeza femoral",
    "Dolor inguinal con la rotación interna pasiva + dolor a la marcha",
    "El dolor inguinal con rotación interna limitada orienta; el diagnóstico es por imagen (resonancia).",
    [T],
    ["Movilidad de cadera sin carga (bicicleta fija)", "Isométricos de glúteo y cuádriceps"],
    ["Marcha con descarga parcial", "Control pélvico"],
    ["Abducción en decúbito", "Puente glúteo bilateral"],
    ["Marcha con bastón del lado contrario", "Sit-to-stand con apoyo"],
    ["Ejercicio de bajo impacto (bicicleta, pileta)", "Educación para evitar el impacto"],
    {
      aviso: "Evitar el impacto y la carga excesiva: puede colapsar la cabeza femoral. Coordinar con el traumatólogo (posible cirugía).",
      evitar: ["manual"]
    }
  ),
  // ---------- RODILLA ----------
  patelofemoral: P(
    "mecanico",
    "Síndrome patelofemoral",
    "Test de aprensión rotuliana",
    "Reproduce dolor/aprensión al desplazar la rótula lateralmente.",
    [F, T, G],
    ["Movilidad de rodilla y estiramiento suave de cuádriceps", "Movilidad de rodilla en rango indoloro"],
    ["Control del valgo dinámico frente al espejo", "Activación de vasto medial oblicuo y glúteo medio"],
    ["Puente glúteo y abducción de cadera con banda", "Fortalecimiento progresivo en cadena cerrada, rango controlado"],
    ["Subida y bajada de escalón controlada", "Sit-to-stand y subida de escalón controlada"],
    ["Progresión a sentadilla con carga y a actividad con impacto", "Progresión a actividad con impacto según tolerancia"]
  ),
  tendinopatia_rotuliana: P(
    "tendinopatia",
    "Tendinopatía rotuliana",
    "Test de decline squat (sentadilla en plano inclinado)",
    "Reproduce dolor tendinoso característico bajo carga excéntrica.",
    [F, U],
    ["Movilidad de rodilla y estiramiento suave de cuádriceps", "Movilidad de rodilla en rango indoloro"],
    ["Isométricos de cuádriceps a 60° de flexión", "Isométricos de cuádriceps bajo umbral de dolor"],
    ["Prensa o sentadilla de alta carga lenta (HSR)", "Fortalecimiento excéntrico progresivo (sentadilla en declive)"],
    ["Subida de escalón con control", "Sit-to-stand y subida de escalón"],
    ["Progresión a saltos controlados y carrera", "Progresión gradual a salto/carrera según tolerancia"]
  ),
  lca: P(
    "ligamento",
    "Rehabilitación post lesión de LCA",
    "Test de Lachman",
    "Test más sensible para valorar la integridad/laxitud del ligamento cruzado anterior.",
    [F, T, G],
    ["Extensión completa de rodilla (apoyo de talón) y flexión progresiva", "Recuperación de rango de movilidad progresivo"],
    ["Equilibrio unipodal con ojos abiertos y cerrados", "Activación de cuádriceps y control neuromuscular"],
    ["Sentadilla parcial y prensa con rango controlado", "Fortalecimiento progresivo en cadena cerrada y abierta"],
    ["Marcha con patrón simétrico y escalones", "Sit-to-stand, marcha y equilibrio funcional"],
    ["Progresión a trote, saltos y cambios de dirección según criterios", "Reentrenamiento de salto/pivote y retorno deportivo gradual"]
  ),
  lcp: P(
    "ligamento",
    "Lesión de ligamento cruzado posterior (LCP)",
    "Test del cajón posterior + sag sign",
    "El descenso de la tibia hacia atrás con la rodilla a 90° indica insuficiencia del LCP.",
    [F, T],
    ["Movilidad de rodilla en rango indoloro", "Deslizamiento de talón"],
    ["Activación de cuádriceps isométrica", "Control de apoyo unipodal asistido"],
    ["Prensa y sentadilla parcial con carga progresiva", "Extensión de rodilla en cadena cerrada"],
    ["Sit-to-stand", "Marcha y escalones"],
    ["Carrera progresiva", "Retorno al gesto deportivo"],
    { aviso: "Evitar carga excesiva en flexión profunda y ejercicios de isquiotibiales intensos en fase temprana; priorizar cuádriceps." }
  ),
  lcm: P(
    "ligamento",
    "Esguince de ligamento colateral medial (LCM)",
    "Test de estrés en valgo a 0° y 30° de flexión",
    "La apertura medial con dolor orienta al grado de lesión del LCM.",
    [F, T],
    ["Movilidad de rodilla en rango indoloro", "Bicicleta sin resistencia"],
    ["Cuádriceps isométrico", "Control del valgo en apoyo unipodal"],
    ["Sentadilla parcial con banda en rodillas", "Prensa con carga progresiva"],
    ["Sit-to-stand", "Escalón lateral controlado"],
    ["Carrera progresiva", "Cambios de dirección y retorno al deporte"],
    { aviso: "Apertura en valgo a 0° o inestabilidad franca sugiere compromiso asociado (LCA / cápsula): derivar." }
  ),
  lesion_meniscal: P(
    "desgarro",
    "Lesión meniscal (desgarro de menisco)",
    "Test de Thessaly (apoyo unipodal con rotación a 5° y 20° de flexión)",
    "Más preciso que McMurray para detectar lesión meniscal; dolor o bloqueo en la línea articular.",
    [F, T],
    ["Movilidad de rodilla en rango indoloro (bicicleta sin resistencia)", "Deslizamiento de talón"],
    ["Cuádriceps isométrico", "Control de glúteo medio en apoyo unipodal asistido"],
    ["Sentadilla parcial de 0 a 45° con control del valgo", "Prensa con carga progresiva en rango protegido"],
    ["Sit-to-stand", "Subida y bajada de un escalón bajo"],
    ["Marcha en terreno irregular", "Retorno gradual a la actividad (evitar flexión profunda con rotación al inicio)"],
    { aviso: "Bloqueo mecánico verdadero (no puede extender la rodilla) o derrame recurrente: derivar a traumatología." }
  ),
  luxacion_rotula: P(
    "ligamento",
    "Luxación / inestabilidad rotuliana",
    "Test de aprensión rotuliana (Fairbank)",
    "La aprensión o contracción defensiva al desplazar la rótula lateralmente indica inestabilidad.",
    [F, T],
    ["Movilidad de rodilla en rango indoloro", "Estiramiento de banda iliotibial y cuádriceps"],
    ["Activación de vasto medial y glúteo medio", "Control del valgo en sentadilla parcial"],
    ["Sentadilla parcial con banda en rodillas", "Extensión de rodilla en rango protegido"],
    ["Sit-to-stand", "Subida y bajada de escalón"],
    ["Cambios de dirección controlados", "Retorno gradual al deporte"],
    { aviso: "Luxaciones recurrentes o con fractura osteocondral: derivar a traumatología." }
  ),
  itb: P(
    "tendinopatia",
    "Síndrome de la cintilla iliotibial",
    "Test de Noble (Noble compression test)",
    "Reproduce el dolor lateral de rodilla al comprimir el cóndilo femoral lateral en flexo-extensión.",
    [F, T],
    ["Movilidad de cadera y rodilla; estiramiento suave de la cintilla y el tensor", "Movilidad de rodilla y cadera en rango indoloro"],
    ["Activación de glúteo medio (control de rotación/aducción de cadera)", "Activación de glúteo medio en decúbito lateral"],
    ["Fortalecimiento progresivo de abductores y glúteo medio", "Abducción lateral con banda"],
    ["Marcha y subida de escalón con control de cadera", "Escalones laterales con banda"],
    ["Progresión gradual a carrera con control de la técnica", "Corrección de técnica de carrera y volumen progresivo"]
  ),
  bursitis_prerrotuliana: P(
    "tendinopatia",
    "Bursitis prerrotuliana",
    "Inspección y palpación del edema prerrotuliano",
    "Tumefacción localizada delante de la rótula, con movilidad de rodilla conservada.",
    [F, T],
    ["Movilidad de rodilla en rango indoloro", "Evitar el apoyo directo sobre la rodilla"],
    ["Cuádriceps isométrico", "Control de apoyo unipodal"],
    ["Sentadilla parcial", "Puente glúteo"],
    ["Sit-to-stand", "Marcha y escalones"],
    ["Retorno a actividades de rodillas (trabajo o deporte) con protección", "Educación en descanso de la zona"],
    { aviso: "Calor, rubor y fiebre: descartar bursitis séptica y derivar." }
  ),
  quiste_baker: P(
    "mecanico",
    "Quiste de Baker (poplíteo)",
    "Signo de Foucher (masa más tensa en extensión que en flexión)",
    "Tumefacción en el hueco poplíteo que se tensa al extender la rodilla.",
    [F, T],
    ["Movilidad de rodilla en rango indoloro", "Deslizamiento de talón"],
    ["Cuádriceps isométrico", "Control del apoyo unipodal"],
    ["Sentadilla parcial", "Prensa con carga liviana"],
    ["Sit-to-stand", "Marcha y escalones"],
    ["Actividad física habitual", "Manejo de la patología de base de la rodilla"],
    { aviso: "Dolor y edema súbito de pantorrilla: descartar trombosis venosa profunda y rotura del quiste; derivar." }
  ),
  protesis_rodilla: P(
    "postquirurgico",
    "Artroplastia total de rodilla (prótesis)",
    "Goniometría de flexión y extensión + lag extensor + TUG",
    "Los hitos de rango (extensión completa y flexión >90°) guían la progresión.",
    [F, T],
    ["Deslizamiento de talón (flexión asistida)", "Extensión pasiva con toalla bajo el talón"],
    ["Cuádriceps isométrico con toalla bajo la rodilla", "Elevación de pierna recta sin lag extensor"],
    ["Sit-to-stand con apoyo", "Mini sentadilla de 0 a 45°"],
    ["Marcha con andador o bastones", "Subida de escalón bajo con barandal"],
    ["Escaleras alternadas", "Bicicleta estática con asiento alto"],
    {
      aviso: AV_POP,
      evitar: ["ondacorta", "magneto"],
      escala: "tug"
    }
  ),
  fractura_rotula: P(
    "fractura",
    "Fractura de rótula",
    "Extensión activa de rodilla (lag extensor) + control radiológico",
    "La capacidad de extender activamente la rodilla indica la continuidad del aparato extensor.",
    [F, T],
    ["Movilidad de tobillo y cadera durante la inmovilización", "Flexión progresiva según protocolo"],
    ["Cuádriceps isométrico", "Elevación de pierna recta sin lag"],
    ["Mini sentadilla en rango protegido", "Extensión en cadena cerrada"],
    ["Sit-to-stand con apoyo", "Marcha con carga según indicación"],
    ["Escaleras y actividad habitual", "Retorno a la actividad deportiva"],
    { aviso: AV_FX }
  ),
  fractura_platillo: P(
    "fractura",
    "Fractura de platillo tibial",
    "Goniometría de rodilla según fase + control radiológico",
    "La carga y el rango dependen del tipo de fractura y del criterio del traumatólogo.",
    [F, T],
    ["Movilidad de tobillo y cadera", "Flexo-extensión de rodilla en rango permitido"],
    ["Cuádriceps isométrico", "Activación de glúteos sin carga"],
    ["Elevación de pierna recta", "Mini sentadilla tras autorización de carga"],
    ["Marcha con bastones con la carga permitida", "Sit-to-stand con apoyo"],
    ["Marcha sin ayuda y escaleras", "Retorno gradual a la actividad"],
    { aviso: AV_FX + " No cargar hasta la autorización explícita del traumatólogo." }
  ),
  osgood: P(
    "pediatrico",
    "Enfermedad de Osgood-Schlatter",
    "Palpación de la tuberosidad tibial anterior + extensión resistida",
    "Dolor local en la tuberosidad con la extensión de rodilla en adolescentes en crecimiento.",
    [F],
    ["Estiramiento de cuádriceps", "Movilidad de rodilla en rango indoloro"],
    ["Isométricos de cuádriceps", "Control del valgo"],
    ["Sentadilla parcial", "Puente glúteo"],
    ["Marcha y escalones", "Sit-to-stand"],
    ["Modificación de la carga deportiva (saltos y carreras)", "Retorno gradual al deporte"],
    { aviso: "Se ajusta la carga según el dolor; no se prohíbe el deporte salvo dolor intenso. Derivar si hay dolor nocturno o empeoramiento." }
  )
});

// ============================================================
// BLOQUE 4: Tobillo, pie, neurológico, reumatológico y adulto mayor
// ============================================================
Object.assign(DB, {
  // ---------- TOBILLO Y PIE ----------
  rotura_aquiles: P(
    "desgarro",
    "Rotura del tendón de Aquiles (conservador o post-quirúrgico)",
    "Test de Thompson + ATRS (Achilles Tendon Total Rupture Score)",
    "La ausencia de flexión plantar al comprimir la pantorrilla confirma la rotura; el ATRS mide la función.",
    [F, T],
    ["Movilidad de rodilla y cadera con bota", "Flexión plantar y dorsiflexión activas según protocolo"],
    ["Isométricos de tríceps sural (según protocolo)", "Equilibrio bipodal con carga permitida"],
    ["Elevación de talones bipodal progresiva", "Elevación unipodal asistida"],
    ["Marcha con retiro progresivo de las cuñas de la bota", "Subida de un escalón"],
    ["Elevación unipodal completa", "Retorno gradual a carrera y saltos (6 a 9 meses)"],
    { aviso: AV_POP + " Evitar la dorsiflexión pasiva forzada y el estiramiento del tendón en las primeras semanas." }
  ),
  desgarro_gemelo: P(
    "desgarro",
    "Desgarro de gemelo (tennis leg)",
    "Test de Thompson (descarta rotura de Aquiles) + elevación unipodal de talón",
    "Distingue una lesión muscular del gemelo de una rotura del tendón de Aquiles.",
    [F, T],
    ["Movilidad de tobillo en rango indoloro", "Bombeo de tobillo"],
    ["Isométricos de tríceps sural", "Marcha controlada con talón levantado"],
    ["Elevación de talones bipodal progresiva", "Elevación unipodal asistida"],
    ["Marcha con progresión de velocidad", "Subida de escalón"],
    ["Carrera progresiva", "Retorno al deporte con saltos"],
    { aviso: AV_DESG + " Descartar trombosis venosa profunda si hay edema marcado con dolor en la pantorrilla." }
  ),
  inestabilidad_tobillo: P(
    "ligamento",
    "Inestabilidad crónica de tobillo",
    "Test del cajón anterior y talar tilt + antecedente de esguinces repetidos",
    "Una laxitud anterior o en inversión confirma el compromiso ligamentario lateral.",
    [T],
    ["Movilidad de tobillo en todos los planos", "Estiramiento suave de gemelos"],
    ["Equilibrio unipodal con ojos abiertos y cerrados", "Control propioceptivo en superficie estable"],
    ["Elevación de talones", "Eversión resistida con banda"],
    ["Equilibrio unipodal en superficie inestable", "Marcha en puntas y talones"],
    ["Saltos controlados y cambios de dirección", "Retorno al deporte con tobillera"],
    { aviso: "La propiocepción y la fuerza de peroneos son la clave. Si hay más de 3 esguinces o inestabilidad funcional persistente, considerar la derivación quirúrgica." }
  ),
  sindesmosis: P(
    "ligamento",
    "Esguince alto de tobillo (sindesmosis)",
    "Squeeze test + test de rotación externa (Kleiger)",
    "El dolor sobre la sindesmosis con la compresión de tibia y peroné o la rotación externa orienta a esguince alto.",
    [F, T],
    ["Movilidad de tobillo en rango indoloro", "Bombeo de tobillo"],
    ["Propiocepción en apoyo bipodal", "Isométricos de tobillo"],
    ["Elevación de talones", "Fortalecimiento con banda"],
    ["Marcha con bota o bastones según indicación", "Equilibrio unipodal"],
    ["Retorno a la carrera de forma progresiva", "Cambios de dirección y saltos"],
    { aviso: "Mayor tiempo de recuperación que el esguince lateral. Si hay diastasis o inestabilidad: derivar a traumatología." }
  ),
  canillitis: P(
    "tendinopatia",
    "Síndrome de estrés tibial medial (canillitis)",
    "Palpación del borde posteromedial de la tibia (más de 5 cm de dolor difuso)",
    "El dolor difuso a lo largo del borde tibial con la carga orienta al síndrome de estrés tibial medial.",
    [F, T],
    ["Estiramiento de tríceps sural", "Movilidad de tobillo"],
    ["Activación de intrínsecos", "Control del apoyo"],
    ["Elevación de talones progresiva", "Fortalecimiento de tibial anterior y posterior"],
    ["Marcha con calzado adecuado", "Carrera suave en superficie blanda"],
    ["Retorno progresivo a la carrera (reducir volumen e intensidad)", "Control de la carga semanal"],
    { aviso: "Dolor focal puntual, nocturno o que no cede con el reposo: descartar fractura por estrés." }
  ),
  fractura_tobillo: P(
    "fractura",
    "Fractura de tobillo (maleolar)",
    "Weight-bearing lunge test (dorsiflexión en carga)",
    "Mide la recuperación de la dorsiflexión funcional en carga.",
    [F, T],
    ["Movilidad activa de dedos y rodilla durante la inmovilización", "Dorsiflexión y flexión plantar activas tras el alta"],
    ["Propiocepción en apoyo bipodal (tras autorización de carga)", "Activación de peroneos con banda"],
    ["Elevación de talones bipodal", "Fortalecimiento con banda en todas las direcciones"],
    ["Marcha con bastones con la carga permitida", "Subida de un escalón bajo"],
    ["Marcha sin ayuda en superficies irregulares", "Retorno gradual al deporte"],
    { aviso: AV_FX }
  ),
  fractura_tibia: P(
    "fractura",
    "Fractura de tibia y peroné (diáfisis)",
    "Control radiológico de consolidación + goniometría de tobillo y rodilla",
    "La progresión de carga depende de la consolidación y de la fijación elegida.",
    [F, T],
    ["Movilidad activa de rodilla, tobillo y dedos", "Isométricos de cuádriceps y glúteos"],
    ["Activación de glúteos y cuádriceps", "Equilibrio con carga permitida"],
    ["Elevación de pierna recta", "Sentadilla parcial tras autorización de carga"],
    ["Marcha con bastones o andador con carga permitida", "Sit-to-stand con apoyo"],
    ["Marcha sin ayuda", "Retorno gradual a la actividad"],
    { aviso: AV_FX + " Vigilar el síndrome compartimental (dolor intenso desproporcionado y tensión en la pierna): derivar de urgencia." }
  ),
  fractura_metatarsiano: P(
    "fractura",
    "Fractura de metatarsiano / fractura por estrés",
    "Dolor a la palpación del metatarsiano + test de salto unipodal (hop test) según tolerancia",
    "El dolor óseo localizado con la carga orienta a fractura; el salto se prueba solo cuando está permitido.",
    [F, T],
    ["Movilidad de tobillo y dedos", "Movilidad de rodilla y cadera"],
    ["Activación de intrínsecos del pie (short foot)", "Equilibrio bipodal con carga permitida"],
    ["Elevación de talones progresiva", "Fortalecimiento de intrínsecos y tríceps sural"],
    ["Marcha con calzado rígido o bota según indicación", "Entrenamiento de marcha con carga progresiva"],
    ["Retorno progresivo a la caminata y la carrera", "Control de la carga semanal"],
    { aviso: AV_FX + " En fractura de la base del 5° metatarsiano (zona de Jones) el riesgo de no consolidación es mayor." }
  ),
  fractura_calcaneo: P(
    "fractura",
    "Fractura de calcáneo o astrágalo",
    "Dolor a la compresión lateral del talón + examen neurovascular del pie",
    "Controla el dolor y descarta compromiso circulatorio.",
    [F, T],
    ["Movilidad de dedos y rodilla libre", "Movilidad de tobillo cuando el cirujano lo autorice"],
    ["Marcha con descarga total o parcial", "Control del edema con elevación"],
    ["Isométricos de la pierna y cadera", "Fortalecimiento de miembro sano"],
    ["Marcha con muletas respetando la carga", "Sit-to-stand con apoyo"],
    ["Progresión de la carga", "Retorno gradual a la marcha (2 a 4 meses)"],
    {
      aviso: AV_FX + " El síndrome compartimental del pie es una urgencia: dolor intenso y edema tenso.",
      evitar: ["ondacorta", "magneto"]
    }
  ),
  hallux_valgus: P(
    "degenerativo",
    "Hallux valgus",
    "Medición del ángulo del hallux valgus + ROM de la 1ª metatarsofalángica",
    "El ángulo (radiográfico) guía el manejo; el rango de la articulación orienta la función.",
    [C, T],
    ["Movilización suave de la 1ª metatarsofalángica", "Estiramiento del aductor del hallux"],
    ["Activación del abductor del hallux", "Activación de intrínsecos (short foot)"],
    ["Abducción del hallux con banda", "Elevación de talones"],
    ["Marcha con calzado amplio", "Equilibrio unipodal"],
    ["Educación en calzado adecuado", "Mantenimiento del programa de intrínsecos"],
    { aviso: "Deformidad marcada con dolor incapacitante: considerar derivación a ortopedia." }
  ),
  hallux_rigidus: P(
    "degenerativo",
    "Hallux rigidus",
    "Dorsiflexión pasiva de la primera articulación metatarsofalángica (menos de 30° indica limitación)",
    "Mide la pérdida de movilidad que genera el dolor al despegue en la marcha.",
    [C, T],
    ["Movilización de la articulación metatarsofalángica", "Estiramiento de la fascia plantar"],
    ["Control del apoyo en el despegue", "Equilibrio unipodal"],
    ["Fortalecimiento de intrínsecos del pie (short foot)", "Elevación de talones"],
    ["Marcha con calzado rígido o con balancín", "Sit-to-stand"],
    ["Calzado adecuado y plantilla con soporte", "Actividad de bajo impacto"],
    { aviso: "Si hay deformidad progresiva o dolor incapacitante, considerar la derivación al especialista." }
  ),
  pie_plano: P(
    "mecanico",
    "Pie plano / pronación excesiva",
    "Navicular drop test",
    "Un descenso del navicular mayor a 10 mm indica pronación excesiva.",
    [],
    ["Estiramiento de tríceps sural", "Movilidad de tobillo"],
    ["Activación de intrínsecos (short foot)", "Control del arco en apoyo bipodal"],
    ["Elevación de talones con control del retropié", "Fortalecimiento de tibial posterior con banda"],
    ["Marcha con control del arco", "Equilibrio unipodal"],
    ["Educación en calzado y plantillas si corresponde", "Retorno a la actividad habitual"]
  ),
  pie_cavo: P(
    "mecanico",
    "Pie cavo",
    "Huella plantar (podoscopio) + prueba de Coleman",
    "Define si la deformidad es flexible o rígida y si hay compromiso del retropié.",
    [],
    ["Movilización de la fascia plantar y del tobillo", "Estiramiento de gemelos"],
    ["Equilibrio unipodal", "Conciencia de la distribución de la carga"],
    ["Fortalecimiento de peroneos y tibial anterior", "Elevación de talones"],
    ["Marcha en puntas y talones", "Sit-to-stand con control"],
    ["Calzado con buena amortiguación y plantillas", "Control de las sobrecargas del pie"],
    { aviso: "Si hay déficit neurológico asociado (debilidad, pérdida de sensibilidad), descartar neuropatía (Charcot-Marie-Tooth) y derivar." }
  ),
  tibial_posterior: P(
    "tendinopatia",
    "Disfunción del tendón tibial posterior",
    "Single heel rise test (elevación unipodal de talón)",
    "La incapacidad de elevar el talón con inversión del retropié indica disfunción del tibial posterior.",
    [F, T],
    ["Movilidad de tobillo en rango indoloro", "Estiramiento de tríceps sural"],
    ["Activación de intrínsecos (short foot)", "Inversión isométrica del tobillo"],
    ["Inversión con banda", "Elevación de talones bipodal con pelota entre los talones"],
    ["Marcha con soporte plantar o calzado adecuado", "Equilibrio unipodal"],
    ["Elevación unipodal de talón", "Retorno progresivo a la actividad"],
    { aviso: "Pie plano adquirido con deformidad progresiva: derivar a ortopedia." }
  ),
  peroneos: P(
    "tendinopatia",
    "Tendinopatía de los peroneos",
    "Dolor a la eversión resistida + palpación retromaleolar",
    "El dolor sobre los tendones peroneos con la eversión contra resistencia orienta al diagnóstico.",
    [F, U, T],
    ["Movilidad de tobillo en rango indoloro", "Estiramiento suave de peroneos"],
    ["Propiocepción en apoyo bipodal", "Isométricos de eversión"],
    ["Eversión con banda excéntrica", "Elevación de talones"],
    ["Marcha en superficies irregulares", "Equilibrio unipodal"],
    ["Retorno a la carrera y cambios de dirección", "Progresión de la carga"]
  ),
  metatarsalgia: P(
    "mecanico",
    "Metatarsalgia",
    "Test de compresión metatarsal (squeeze test)",
    "Reproduce dolor en la región metatarsal, orienta también a neuroma de Morton.",
    [F, U],
    ["Movilidad de pie/tobillo en rango indoloro", "Movilización de dedos y metatarsianos"],
    ["Activación de músculos intrínsecos del pie", "Short foot (acortamiento del pie)"],
    ["Fortalecimiento progresivo de intrínsecos y tríceps sural", "Elevación de talones con control del apoyo"],
    ["Marcha con calzado adecuado y descansos programados", "Marcha con calzado con buena amortiguación"],
    ["Progresión a bipedestación/marcha prolongada", "Ajuste de plantillas y calzado"]
  ),
  morton: P(
    "nervio",
    "Neuroma de Morton",
    "Test de Mulder (clic) + compresión interdigital",
    "El clic doloroso o la reproducción del dolor entre los metatarsianos orienta al neuroma.",
    [F, T],
    ["Movilización de los metatarsianos (suave)", "Estiramiento de tríceps sural"],
    ["Activación de intrínsecos", "Control del apoyo del antepié"],
    ["Elevación de talones sin sobrecarga del antepié", "Fortalecimiento de intrínsecos"],
    ["Marcha con calzado amplio y descarga retrocapital", "Equilibrio unipodal"],
    ["Retorno a la actividad con calzado adecuado", "Educación en calzado"]
  ),
  tarsiano: P(
    "nervio",
    "Síndrome del túnel tarsiano",
    "Test de Tinel en el túnel tarsiano + triple compresión",
    "Reproduce parestesias plantares con la percusión o la compresión sostenida.",
    [F, T],
    ["Deslizamiento neural del nervio tibial", "Movilidad de tobillo"],
    ["Activación de intrínsecos", "Control del retropié en apoyo"],
    ["Fortalecimiento de intrínsecos y tibial posterior", "Elevación de talones"],
    ["Marcha con calzado adecuado y soporte plantar", "Equilibrio unipodal"],
    ["Retorno a la actividad habitual", "Control de la carga"],
    { aviso: "Déficit sensitivo o motor progresivo: derivar para estudio electrofisiológico." }
  ),
  pie_diabetico: P(
    "nervio",
    "Pie diabético (prevención y ejercicio)",
    "Test del monofilamento de Semmes-Weinstein (10 g) + inspección de la piel",
    "Detecta la pérdida de sensibilidad protectora, que es el principal factor de riesgo de úlcera.",
    [],
    ["Movilidad activa de tobillo y dedos", "Estiramiento suave de gemelos"],
    ["Equilibrio con apoyo", "Control del apoyo plantar"],
    ["Fortalecimiento de piernas en sedente", "Elevación de talones con apoyo"],
    ["Marcha con calzado adecuado", "Sit-to-stand"],
    ["Ejercicio aeróbico de bajo impacto", "Educación en el cuidado diario de los pies"],
    {
      aviso: "No aplicar calor ni frío sobre el pie (riesgo de quemadura o lesión por la sensibilidad alterada). Revisar el pie en cada sesión; herida, enrojecimiento o calor local: derivar el mismo día.",
      evitar: ["calor", "frio", "ondacorta", "us", "magneto"]
    }
  ),
  sever: P(
    "pediatrico",
    "Enfermedad de Sever (apofisitis del calcáneo)",
    "Test de compresión lateral del calcáneo (squeeze test)",
    "El dolor a la compresión del talón en un niño en crecimiento orienta a la apofisitis.",
    [F],
    ["Estiramiento suave de gemelos y sóleo", "Movilidad de tobillo"],
    ["Control del apoyo del pie", "Equilibrio unipodal"],
    ["Elevación de talones sin dolor", "Fortalecimiento de intrínsecos"],
    ["Marcha con calzado amortiguado", "Actividad con impacto reducido"],
    ["Retorno gradual a la actividad deportiva", "Taloneras de amortiguación"],
    {
      aviso: "Es autolimitada con el cierre del crecimiento. Modular la carga (no suspender toda actividad) y derivar si el dolor es nocturno o hay fiebre.",
      evitar: ["calor", "ondacorta", "magneto", "us"]
    }
  ),
  // ---------- NEUROLÓGICO ----------
  acv: P(
    "neurologico",
    "ACV / hemiparesia (neurológico central)",
    "Escala de Ashworth Modificada",
    "Cuantifica el grado de espasticidad y orienta la elección de técnica y dosificación del ejercicio.",
    [T, G],
    ["Movilización pasiva/activa-asistida del hemicuerpo afectado, todos los rangos", "Movilidad activa del miembro superior y tronco"],
    ["Control de tronco en sedestación (equilibrio estático y dinámico)", "Equilibrio sentado con alcances"],
    ["Entrenamiento orientado a la tarea (task-specific training) con repetición alta", "Fortalecimiento de miembros superiores con banda o pesas"],
    ["Entrenamiento de transferencias (cama-silla, sit-to-stand) con asistencia", "Propulsión de silla de ruedas"],
    ["Reentrenamiento de actividades de la vida diaria (vestido, higiene, alimentación)", "Entrenamiento de marcha comunitaria y prevención de caídas"],
    {
      aviso: "Controlar presión arterial y signos vitales; vigilar fatiga extrema, riesgo de caídas y dolor de hombro del lado afectado (no tirar del brazo). Con alteración de la sensibilidad no aplicar calor ni frío en la zona. Déficit nuevo o que empeora de golpe: derivar de urgencia.",
      escala: "ashworth"
    }
  ),
  lesion_medular: P(
    "neurologico",
    "Lesión medular",
    "Escala ASIA (AIS)",
    "Clasifica el nivel neurológico y la severidad (A-E) según déficit motor y sensitivo.",
    [T, G],
    ["Movilización pasiva de todos los segmentos, prevención de rigidez/escaras", "Movilidad activa del miembro superior y tronco"],
    ["Control de tronco en sedestación", "Equilibrio sentado con alcances"],
    ["Fortalecimiento de musculatura con función preservada", "Fortalecimiento de miembros superiores con banda o pesas"],
    ["Entrenamiento de transferencias y uso de silla de ruedas", "Propulsión de silla de ruedas"],
    ["Entrenamiento en actividades de la vida diaria adaptadas", "Transferencias y manejo de la silla en distintos terrenos"],
    {
      aviso: "Lesión por encima de T6: vigilar la disreflexia autonómica (cefalea intensa, hipertensión súbita, sudoración) y la hipotensión ortostática en los cambios de posición. Controlar la piel (escaras) y no aplicar calor ni frío en zonas sin sensibilidad. Evitar estiramientos forzados por osteoporosis por desuso.",
      evitar: ["calor", "frio", "ondacorta"],
      escala: "asia"
    }
  ),
  parkinson: P(
    "neurologico",
    "Enfermedad de Parkinson",
    "Escala de Hoehn y Yahr",
    "Clasifica el estadio de progresión de la enfermedad (I-V).",
    [],
    ["Movilidad activa amplia, ejercicios de rotación de tronco", "Movilidad axial y rotación de tronco sentado y de pie"],
    ["Entrenamiento de equilibrio y estrategias anticaída", "Equilibrio con perturbaciones suaves"],
    ["Fortalecimiento progresivo global, énfasis en extensores", "Sit-to-stand repetido y puente glúteo"],
    ["Entrenamiento de marcha con señales externas (cues) e inicio de la marcha", "Marcha con ritmo auditivo (metrónomo)"],
    ["Entrenamiento de transferencias y actividades de la vida diaria", "Giros y transferencias con estrategias de pistas"],
    {
      aviso: "Entrenar en el período ON de la medicación. Vigilar la hipotensión ortostática, los episodios de congelamiento de la marcha y el riesgo de caídas (supervisión). Usar pistas externas (visuales o auditivas) y consignas simples.",
      escala: "hoehnyahr"
    }
  ),
  esclerosis_multiple: P(
    "neurologico",
    "Esclerosis múltiple",
    "Timed 25-Foot Walk (T25-FW) + EDSS (la determina el neurólogo)",
    "El T25-FW mide la velocidad de marcha; el EDSS clasifica la discapacidad global.",
    [T],
    ["Movilidad activa de todos los segmentos", "Estiramiento suave de músculos espásticos"],
    ["Equilibrio sentado y de pie con apoyo", "Control postural con retroalimentación visual"],
    ["Fortalecimiento submáximo de grandes grupos (pocas series, descansos largos)", "Ejercicio aeróbico de baja intensidad con pausas"],
    ["Sit-to-stand", "Marcha con ayuda técnica según necesidad"],
    ["Entrenamiento de marcha y equilibrio dinámico", "Estrategias de conservación de energía"],
    {
      aviso: "Evitar el sobrecalentamiento (fenómeno de Uhthoff): sesiones en ambiente fresco y con descansos frecuentes. Ejercicio submáximo sin llegar a la fatiga.",
      evitar: ["calor", "ondacorta", "magneto"]
    }
  ),
  guillain_barre: P(
    "neurologico",
    "Síndrome de Guillain-Barré",
    "Escala MRC sumatoria (0-60) + escala de discapacidad de Hughes",
    "Cuantifica la debilidad global y la funcionalidad para seguir la evolución.",
    [],
    ["Movilización pasiva y activo-asistida de todos los segmentos", "Posicionamiento y prevención de contracturas"],
    ["Control de tronco en sedestación", "Transferencias asistidas"],
    ["Ejercicios activos submáximos con pocas repeticiones", "Ejercicio en agua si está disponible"],
    ["Sit-to-stand asistido", "Marcha asistida en barras paralelas"],
    ["Marcha con ayuda técnica", "Entrenamiento de actividades de la vida diaria"],
    {
      aviso: "Evitar la fatiga y el sobreesfuerzo (pueden empeorar la debilidad). En fase aguda el manejo es hospitalario; vigilar compromiso respiratorio, disautonomía y dolor.",
      evitar: ["calor", "ondacorta"],
      escala: "mrc"
    }
  ),
  paralisis_facial: P(
    "neurologico",
    "Parálisis facial periférica (Bell)",
    "Escala de House-Brackmann",
    "Clasifica el grado de parálisis facial de I (normal) a VI (parálisis total).",
    [],
    ["Ejercicios faciales frente al espejo (elevar cejas, sonreír, cerrar los ojos)", "Masaje facial suave"],
    ["Movimientos simétricos lentos y controlados (evitar sincinesias)", "Cierre palpebral completo"],
    ["Ejercicios con resistencia leve contra la mano", "Soplo y silbido"],
    ["Masticación y deglución con simetría", "Articulación de palabras con control"],
    ["Retroalimentación con espejo", "Protección ocular y cuidado de la córnea"],
    {
      aviso: "Confirmar el diagnóstico médico (descartar ACV u otras causas). Proteger el ojo (lágrimas, oclusión nocturna). Evitar ejercicios vigorosos que favorezcan las sincinesias.",
      escala: "housebrackmann"
    }
  ),
  vppb: P(
    "vestibular",
    "Vértigo posicional paroxístico benigno (VPPB)",
    "Maniobra de Dix-Hallpike",
    "El vértigo con nistagmo al pasar a decúbito con la cabeza rotada confirma el VPPB del canal posterior.",
    [],
    ["Maniobra de Epley (canal posterior) con supervisión", "Movimientos de cabeza progresivos"],
    ["Ejercicios de Brandt-Daroff", "Estabilización de la mirada (VOR x1) en sedestación"],
    ["Equilibrio en apoyo bipodal con ojos cerrados", "Equilibrio sobre superficie blanda"],
    ["Marcha con giros de cabeza", "Sit-to-stand con control del equilibrio"],
    ["Marcha en ambientes con movimiento visual", "Tareas duales"],
    {
      aviso: "Vértigo con síntomas neurológicos (diplopía, disartria, debilidad), cefalea intensa o hipoacusia súbita: derivar de urgencia. Las maniobras se aplican solo tras confirmar el canal afectado.",
      escala: "dixhallpike"
    }
  ),
  neuritis_vestibular: P(
    "vestibular",
    "Neuritis vestibular / hipofunción vestibular unilateral",
    "Head Impulse Test (HIT)",
    "La sacada correctiva de refijación al girar la cabeza hacia el lado afectado indica hipofunción vestibular.",
    [],
    ["Ejercicios de estabilización de la mirada (VOR x1)", "Movimientos de cabeza con la mirada fija en un objetivo"],
    ["Equilibrio de pie con ojos abiertos", "Marcha con giros de cabeza"],
    ["Habituación con movimientos provocativos graduales", "Equilibrio sobre superficie blanda"],
    ["Marcha con tareas duales", "Sit-to-stand con giros de cabeza"],
    ["Progresión de equilibrio y marcha en ambientes complejos", "Retorno a las actividades diarias"],
    {
      aviso: "Un cuadro vestibular agudo con déficit neurológico, dificultad para hablar, ataxia o cefalea intensa puede ser un ACV de fosa posterior: derivar de urgencia. Los ejercicios deben provocar un leve mareo transitorio, no un malestar intenso.",
      escala: "berg"
    }
  ),
  // ---------- REUMATOLÓGICO ----------
  artritis_reumatoide: P(
    "reumatologico",
    "Artritis reumatoide",
    "Dinamometría de agarre + cuestionario HAQ",
    "Mide la fuerza de la mano y la discapacidad en las actividades diarias.",
    [T, F],
    ["Movilidad activa suave de las articulaciones afectadas", "Ejercicios de mano (flexo-extensión, oposición)"],
    ["Protección articular y ergonomía", "Control postural"],
    ["Fortalecimiento isométrico submáximo", "Ejercicio aeróbico de bajo impacto (bicicleta, natación)"],
    ["Sit-to-stand", "Marcha a ritmo cómodo"],
    ["Actividades diarias con ahorro articular", "Programa regular de ejercicio de bajo impacto"],
    {
      aviso: "Evitar ejercicio intenso y calor sobre articulaciones con inflamación aguda. Ajustar según los brotes y coordinar con reumatología.",
      evitar: ["calor"]
    }
  ),
  fibromialgia: P(
    "reumatologico",
    "Fibromialgia",
    "Criterios ACR 2016 (índice de dolor generalizado + gravedad de síntomas) + FIQ",
    "Define el diagnóstico clínico y el impacto funcional; no hay un test de provocación único.",
    [C, T],
    ["Movilidad suave global", "Estiramientos suaves de bajo impacto"],
    ["Respiración y relajación guiada", "Conciencia corporal y postura"],
    ["Fortalecimiento progresivo de baja intensidad", "Ejercicio aeróbico de bajo impacto (caminata, agua)"],
    ["Sit-to-stand", "Marcha a ritmo cómodo"],
    ["Progresión gradual de la actividad (pacing)", "Programa regular de ejercicio"],
    { aviso: "Empezar muy suave y progresar lentamente: un aumento brusco de la carga puede empeorar los síntomas." }
  ),
  osteoporosis: P(
    "reumatologico",
    "Osteoporosis (programa de ejercicio)",
    "Sit-to-stand de 30 segundos + Timed Up and Go",
    "Evalúa la fuerza funcional de miembros inferiores y el riesgo de caídas.",
    [],
    ["Movilidad de columna en extensión suave", "Movilidad de cadera"],
    ["Equilibrio y propiocepción", "Postura erguida"],
    ["Fortalecimiento de extensores de espalda y glúteos", "Entrenamiento de fuerza con carga progresiva"],
    ["Sit-to-stand", "Caminata con impacto controlado si está autorizada"],
    ["Prevención de caídas", "Educación en postura y levantamiento de cargas"],
    {
      aviso: "Evitar flexión de columna con carga, torsiones bruscas y manipulaciones de alta velocidad.",
      evitar: ["manual"]
    }
  ),
  gota: P(
    "reumatologico",
    "Gota / artropatía por cristales (fuera del brote)",
    "Inspección y palpación de la articulación (tofos, derrame) + rango de movimiento",
    "Detecta secuelas articulares y tofos tras los brotes.",
    [F],
    ["Movilidad articular suave en rango indoloro", "Caminata de bajo impacto"],
    ["Control postural", "Equilibrio"],
    ["Fortalecimiento progresivo sin impacto", "Ejercicio en pileta"],
    ["Marcha con calzado amplio", "Sit-to-stand"],
    ["Ejercicio regular, control del peso y la hidratación", "Educación sobre los desencadenantes"],
    {
      aviso: "Durante un brote agudo (articulación roja, caliente, muy dolorosa) no hacer ejercicio ni aplicar calor sobre la zona: derivar al médico.",
      evitar: ["calor", "ondacorta"]
    }
  ),
  lupus: P(
    "reumatologico",
    "Lupus eritematoso sistémico (programa de ejercicio)",
    "Test de sit-to-stand de 30 s + escala de fatiga",
    "Mide la capacidad funcional y la fatiga, frecuentes en esta enfermedad.",
    [],
    ["Movilidad articular global", "Caminata de baja intensidad"],
    ["Ritmo de actividad para la fatiga", "Respiración diafragmática"],
    ["Fortalecimiento de baja a moderada carga", "Ejercicio aeróbico de bajo impacto"],
    ["Marcha progresiva", "Sit-to-stand"],
    ["Ejercicio regular adaptado a los brotes", "Fotoprotección y educación sobre la fatiga"],
    {
      aviso: "Evitar la exposición solar y el ejercicio intenso durante los brotes. Coordinar con reumatología.",
      evitar: ["calor", "ondacorta", "magneto"]
    }
  ),
  // ---------- ADULTO MAYOR ----------
  riesgo_caidas: P(
    "geriatria",
    "Riesgo de caídas / fragilidad en el adulto mayor",
    "Timed Up and Go (TUG)",
    "Un tiempo mayor a 12 segundos indica riesgo aumentado de caídas.",
    [],
    ["Movilidad articular global suave", "Respiración y movilidad de tronco"],
    ["Equilibrio bipodal con ojos abiertos y cerrados", "Transferencia de peso en bipedestación"],
    ["Sit-to-stand repetido", "Elevación de talones con apoyo"],
    ["Marcha en tándem con apoyo", "Subida de escalón con barandal"],
    ["Marcha con tareas duales", "Equilibrio con perturbaciones suaves"],
    {
      aviso: "Revisar medicación (sedantes, antihipertensivos), visión y calzado. Derivar si hay mareos, síncope o caídas recurrentes.",
      escala: "tug"
    }
  ),
  sarcopenia: P(
    "geriatria",
    "Sarcopenia / pérdida de fuerza en el adulto mayor",
    "Fuerza de agarre (dinamometría) + velocidad de marcha en 4 metros",
    "Una fuerza de agarre baja y una marcha lenta sugieren sarcopenia.",
    [],
    ["Movilidad articular global suave", "Caminata corta a ritmo cómodo"],
    ["Equilibrio y control postural", "Transferencia de peso en bipedestación"],
    ["Fuerza progresiva con bandas o pesas livianas, 2 a 3 veces por semana", "Sit-to-stand con tiempo controlado"],
    ["Subida de escalón con barandal", "Transporte de cargas livianas caminando"],
    ["Marcha con tareas duales", "Programa domiciliario de fuerza y equilibrio"],
    { aviso: "Coordinar con nutrición (aporte proteico adecuado) y con el médico tratante." }
  ),
  deterioro_cognitivo: P(
    "geriatria",
    "Demencia / deterioro cognitivo (programa de ejercicio)",
    "Timed Up and Go con tarea dual (contar hacia atrás)",
    "La disminución del rendimiento con la tarea doble marca mayor riesgo de caídas.",
    [],
    ["Movilidad global con consignas simples", "Caminatas guiadas"],
    ["Equilibrio con apoyo", "Ejercicios con repeticiones y consignas visuales"],
    ["Fortalecimiento de piernas con consignas simples", "Ejercicio en grupo cuando sea posible"],
    ["Sit-to-stand", "Marcha con supervisión"],
    ["Rutina diaria de actividad física", "Prevención de caídas y apoyo al cuidador"],
    {
      aviso: "Usar consignas cortas y rutinas repetidas. Supervisión constante por riesgo de caídas. Coordinar con el equipo de salud y la familia.",
      escala: "tug"
    }
  ),
  // ---------- CARDIORRESPIRATORIO ----------
  epoc: P(
    "cardiorrespiratorio",
    "EPOC / rehabilitación respiratoria",
    "Test de marcha de 6 minutos con saturación de oxígeno y escala de disnea de Borg",
    "Mide la capacidad funcional y la desaturación durante el esfuerzo.",
    [],
    ["Respiración con labios fruncidos y diafragmática", "Movilidad torácica"],
    ["Técnicas de ahorro de energía", "Control de la disnea en reposo y en esfuerzo"],
    ["Fortalecimiento de miembros superiores e inferiores", "Ejercicio aeróbico en intervalos"],
    ["Caminata progresiva con control de saturación", "Sit-to-stand"],
    ["Ejercicio aeróbico regular supervisado", "Educación en el manejo de las exacerbaciones"],
    {
      aviso: "Controlar la saturación (mantener por encima de 88% durante el ejercicio) y la disnea (Borg 3 a 4). Disnea que no cede, dolor torácico o fiebre: derivar. Coordinar con neumología.",
      evitar: ["calor", "ondacorta", "magneto"]
    }
  ),
  postcovid: P(
    "cardiorrespiratorio",
    "Secuelas de COVID-19 / fatiga post-viral",
    "Test de sit-to-stand de 1 minuto + saturación y frecuencia cardíaca",
    "Evalúa la tolerancia al esfuerzo y la desaturación.",
    [],
    ["Respiración diafragmática y expansión torácica", "Movilidad global suave"],
    ["Ritmo de actividad (pacing)", "Control de la frecuencia cardíaca en reposo y en esfuerzo"],
    ["Fortalecimiento de baja carga", "Caminata corta con progresión muy lenta"],
    ["Sit-to-stand con pocas repeticiones", "Actividades diarias con pausas"],
    ["Progresión gradual según los síntomas", "Educación en el manejo de la fatiga"],
    {
      aviso: "Vigilar el malestar posterior al esfuerzo: si empeoran los síntomas al día siguiente, reducir la carga. Dolor torácico, palpitaciones, desmayo o desaturación: derivar.",
      evitar: ["calor", "ondacorta"]
    }
  ),
  cardiorehabilitacion: P(
    "cardiorrespiratorio",
    "Rehabilitación cardiovascular (post infarto o cirugía cardíaca)",
    "Test de marcha de 6 minutos o prueba de esfuerzo indicada por cardiología",
    "Define la capacidad funcional y las zonas de entrenamiento seguras.",
    [],
    ["Movilidad global con control de la frecuencia cardíaca", "Respiración diafragmática"],
    ["Control de la presión arterial y frecuencia cardíaca", "Caminata a baja intensidad"],
    ["Fortalecimiento de baja carga (post esternotomía: evitar cargas con los brazos)", "Ejercicio aeróbico en zona indicada"],
    ["Caminata progresiva", "Sit-to-stand"],
    ["Ejercicio aeróbico regular supervisado", "Educación sobre síntomas de alarma"],
    {
      aviso: "Siempre bajo indicación y límites del cardiólogo. Esternotomía: no levantar peso ni empujar con los brazos durante 6 a 8 semanas. Dolor torácico, mareo, disnea desproporcionada o arritmia: suspender y derivar de urgencia.",
      evitar: ["tens", "magneto", "ondacorta", "calor"]
    }
  ),
  // ---------- PEDIATRÍA ----------
  pci: P(
    "pediatrico",
    "Parálisis cerebral infantil (PCI)",
    "GMFCS (nivel de función motora gruesa) + Escala de Ashworth modificada",
    "El GMFCS define el nivel funcional y orienta los objetivos; el Ashworth cuantifica la espasticidad.",
    [],
    ["Estiramiento de acortamientos (isquiotibiales, tríceps sural, aductores)", "Movilización activa lúdica"],
    ["Control de cabeza y tronco", "Equilibrio sentado y de pie según el nivel"],
    ["Fortalecimiento funcional a través del juego", "Entrenamiento orientado a la tarea"],
    ["Sit-to-stand", "Marcha con o sin ayuda técnica"],
    ["Entrenamiento de marcha según el nivel GMFCS", "Participación en actividades escolares y recreativas"],
    {
      aviso: "Objetivos y dosificación según el nivel funcional y con la familia; coordinar con el equipo interdisciplinario. Pediátrico: sin agentes físicos en niños pequeños.",
      evitar: ["calor", "ondacorta", "magneto", "us"],
      escala: "gmfcs"
    }
  ),
  displasia_cadera: P(
    "pediatrico",
    "Displasia del desarrollo de cadera (apoyo kinésico)",
    "Maniobras de Ortolani y Barlow (en lactantes)",
    "Detectan una cadera luxada o luxable en el recién nacido; su realización es del especialista.",
    [],
    ["Posicionamiento en abducción y flexión (cadera en M)", "Estimulación motora respetando el arnés"],
    ["Control cefálico y del tronco en prono", "Juego en decúbito supino con la cadera libre en abducción"],
    ["Estimulación de patadas y movimientos activos", "Juego en cuatro apoyos cuando corresponda"],
    ["Cargas de peso según el desarrollo", "Posicionamiento en las actividades diarias"],
    ["Hitos motores según la edad", "Orientación a los padres sobre el cargado y el arnés"],
    {
      aviso: "Apoyo al tratamiento del traumatólogo infantil (arnés de Pavlik o yeso). No retirar el arnés ni forzar la cadera. Pediátrico: no aplicar agentes físicos.",
      evitar: ["calor", "ondacorta", "magneto", "us", "tens", "manual", "frio"]
    }
  ),
  hipotonia_infantil: P(
    "pediatrico",
    "Hipotonia / retraso del desarrollo psicomotor (incluye síndrome de Down)",
    "Evaluación de hitos motores (Escala de Denver II o Alberta Infant Motor Scale)",
    "Compara el desarrollo motor con la edad esperada para definir objetivos.",
    [],
    ["Estimulación sensoriomotriz en distintas posturas", "Posicionamiento en prono con juego"],
    ["Control cefálico y del tronco", "Transiciones de postura (rodar, sentarse)"],
    ["Juego activo con apoyo de peso", "Gateo y cuatro apoyos"],
    ["Bipedestación con apoyo", "Marcha asistida"],
    ["Participación en juegos motores", "Orientación a la familia para la estimulación en casa"],
    {
      aviso: "No forzar posturas ni rangos. Síndrome de Down: vigilar la inestabilidad atlantoaxoidea (evitar flexión forzada del cuello) y las alteraciones cardíacas. Pediátrico: sin agentes físicos.",
      evitar: ["calor", "frio", "ondacorta", "magneto", "us", "tens", "manual"]
    }
  )
});

// ============================================================
// BLOQUE 5: Ejercicios alternativos, ajustes finales y configuración
// ============================================================

// Segundo ejercicio por bloque para las patologías base (más variedad entre sesiones)
const EJ2 = {
  epicondilitis: { mov: "Movilidad de codo y hombro; estiramiento suave de extensores de muñeca", control: "Isométricos de extensores en distintos ángulos de muñeca", fuerza: "Isotónicos de extensores y supinadores con barra flexible o mancuerna liviana", fuerzaFunc: "Agarre con pelota blanda y control del dolor", funcional: "Ajuste de herramientas y técnica de agarre en el trabajo o deporte" },
  tunel: { mov: "Movilidad de dedos y tendón con deslizamiento tendinoso", control: "Control escapular y postura del miembro superior", fuerza: "Fortalecimiento de agarre y pinza con masilla blanda", fuerzaFunc: "Pausas activas con micro-movilidad durante el trabajo manual", funcional: "Pausas y rotación de tareas repetitivas" },
  ciatica: { mov: "Movilidad lumbar en el patrón de preferencia direccional (flexión o extensión) sin provocar irradiación", control: "Activación del transverso con respiración en decúbito", fuerza: "Puente glúteo bilateral con progresión a unipodal", fuerzaFunc: "Caminata progresiva de tramos cortos", funcional: "Técnica de levantamiento con columna neutra" },
  estenosis_lumbar: { mov: "Flexión de rodillas al pecho en decúbito", control: "Inclinación pélvica posterior en decúbito y sentado", fuerza: "Bicicleta fija con inclinación hacia adelante", fuerzaFunc: "Marcha en cinta con leve inclinación o apoyada en carro", funcional: "Actividades diarias en posición de flexión leve (ir de compras con carro)" },
  facetario: { mov: "Rodillas al pecho y rotación lumbar suave en decúbito", control: "Pájaro-perro (bird-dog) con columna neutra", fuerza: "Puente glúteo bilateral", fuerzaFunc: "Marcha con control del patrón postural", funcional: "Pausas posturales y cambio de posición cada 30 a 40 minutos" },
  piriforme: { mov: "Movilidad de cadera en rotación interna y externa en decúbito", control: "Puente glúteo con control de la pelvis", fuerza: "Abducción lateral con banda en decúbito", fuerzaFunc: "Sentadilla con banda sobre las rodillas", funcional: "Pausas de sedestación y cambios de postura en el trabajo" },
  sacroileitis: { mov: "Rodillas al pecho alternadas en decúbito", control: "Activación del transverso y el suelo pélvico", fuerza: "Puente glúteo bilateral con isométrico de aductores (pelota)", fuerzaFunc: "Marcha con pasos cortos y simétricos", funcional: "Evitar asimetrías de carga en el trabajo y la vida diaria" },
  cervicobraquialgia: { mov: "Movilidad cervical en rango sin reproducir síntomas en el brazo", control: "Retracción cervical suave", fuerza: "Remo con banda con retracción escapular", fuerzaFunc: "Carga liviana de objetos con postura controlada", funcional: "Ergonomía en el puesto de trabajo con pantallas" },
  cefalea_cervicogenica: { mov: "Rotación cervical alta en flexión (autotécnica de C1-C2)", control: "Retracción cervical con flexión craneocervical", fuerza: "Remo con banda y retracción escapular", fuerzaFunc: "Marcha con postura erguida", funcional: "Pausas posturales y ergonomía en pantallas" },
  latigazo: { mov: "Rotación cervical activa lenta", control: "Activación de flexores profundos con cabeza neutra", fuerza: "Isométricos cervicales en los cuatro planos", fuerzaFunc: "Actividades diarias con movimiento cervical libre", funcional: "Retorno gradual a conducir y al trabajo" },
  capsulitis: { mov: "Elevación asistida con bastón en decúbito supino", control: "Control escapular con deslizamientos en pared", fuerza: "Isométricos de rotadores en neutro", fuerzaFunc: "Alcance con el brazo en tareas de higiene y vestido", funcional: "Tareas diarias con alcance cada vez mayor" },
  inestabilidad_hombro: { mov: "Movilidad pasiva-asistida en plano escapular", control: "Estabilización rítmica en apoyo sobre pared o mesa", fuerza: "Rotación externa con banda a 0° de abducción", fuerzaFunc: "Empuje en pared con control escapular", funcional: "Progresión de posiciones de riesgo con control" },
  tendinopatia_bicipital: { mov: "Elevación activa en plano escapular sin compresión", control: "Activación de serrato anterior (empuje con plus)", fuerza: "Rotación externa con banda", fuerzaFunc: "Alcance por encima de la cintura con carga baja", funcional: "Actividad por encima de la cabeza con técnica correcta" },
  epitrocleitis: { mov: "Movilidad de codo y estiramiento suave de flexores de muñeca", control: "Isométricos de flexores en distintos ángulos", fuerza: "Isotónicos de flexores y pronadores con carga liviana", fuerzaFunc: "Agarre con pelota blanda y control del dolor", funcional: "Ajuste de técnica y agarre en el gesto repetitivo" },
  dequervain: { mov: "Movilidad de pulgar con flexión y extensión activa", control: "Isométricos del pulgar en posición neutra", fuerza: "Fortalecimiento de pinza con masilla blanda", fuerzaFunc: "Adaptación del agarre con férula en actividades", funcional: "Pausas y rotación de tareas repetitivas de pinza" },
  tunel_cubital: { mov: "Movilidad de codo evitando la flexión sostenida", control: "Control postural escapular", fuerza: "Fortalecimiento de intrínsecos de la mano con masilla", fuerzaFunc: "Evitar el apoyo en el codo en las actividades", funcional: "Ajuste de postura nocturna (evitar la flexión de codo)" },
  bursitis_trocanterea: { mov: "Rodillas al pecho y movilidad de cadera suave", control: "Puente glúteo con control pélvico", fuerza: "Abducción lateral con banda", fuerzaFunc: "Escalones laterales con banda", funcional: "Evitar cruzar piernas y dormir sobre el lado doloroso" },
  pubalgia: { mov: "Movilidad de cadera y aductores en rango indoloro", control: "Activación del transverso y el suelo pélvico", fuerza: "Aducción con pelota entre las rodillas", fuerzaFunc: "Escalones laterales con banda", funcional: "Progresión a carrera lineal y luego cambios de dirección" },
  patelofemoral: { mov: "Movilidad de rodilla y estiramiento suave de cuádriceps", control: "Control del valgo dinámico frente al espejo", fuerza: "Puente glúteo y abducción de cadera con banda", fuerzaFunc: "Subida y bajada de escalón controlada", funcional: "Progresión a sentadilla con carga y a actividad con impacto" },
  tendinopatia_rotuliana: { mov: "Movilidad de rodilla y estiramiento suave de cuádriceps", control: "Isométricos de cuádriceps a 60° de flexión", fuerza: "Prensa o sentadilla de alta carga lenta (HSR)", fuerzaFunc: "Subida de escalón con control", funcional: "Progresión a saltos controlados y carrera" },
  lca: { mov: "Extensión completa de rodilla (apoyo de talón) y flexión progresiva", control: "Equilibrio unipodal con ojos abiertos y cerrados", fuerza: "Sentadilla parcial y prensa con rango controlado", fuerzaFunc: "Marcha con patrón simétrico y escalones", funcional: "Progresión a trote, saltos y cambios de dirección según criterios" },
  itb: { mov: "Movilidad de cadera y rodilla; estiramiento suave de la cintilla y el tensor", control: "Activación de glúteo medio en decúbito lateral", fuerza: "Abducción lateral con banda", fuerzaFunc: "Escalones laterales con banda", funcional: "Corrección de técnica de carrera y volumen progresivo" },
  aquiles: { mov: "Movilidad de tobillo y estiramiento suave de gemelos", control: "Isométricos de tríceps sural en rango medio", fuerza: "Elevación de talones lenta y pesada (carga progresiva)", fuerzaFunc: "Marcha con progresión de carga y ritmo", funcional: "Progresión a saltos suaves y carrera" },
  metatarsalgia: { mov: "Movilización de dedos y metatarsianos", control: "Short foot (acortamiento del pie)", fuerza: "Elevación de talones con control del apoyo", fuerzaFunc: "Marcha con calzado con buena amortiguación", funcional: "Ajuste de plantillas y calzado" },
  neuropatia_diabetica: { mov: "Movilidad de tobillo y dedos con apoyo", control: "Equilibrio con ojos abiertos y cerrados sobre superficie estable", fuerza: "Sentadilla asistida o sit-to-stand", fuerzaFunc: "Marcha con calzado adecuado", funcional: "Rutina diaria de revisión de los pies" },
  pie_caido: { mov: "Movilidad activo-asistida de tobillo", control: "Entrenamiento de equilibrio con apoyo", fuerza: "Dorsiflexión con banda o con ayuda", fuerzaFunc: "Marcha con elevación de rodilla exagerada", funcional: "Marcha en distintos terrenos con ortesis si corresponde" },
  plexo_braquial: { mov: "Movilidad activa-asistida del hombro, codo y mano", control: "Estimulación sensitiva y reeducación motora", fuerza: "Isométricos de los músculos con actividad residual", fuerzaFunc: "Uso funcional del miembro asistido", funcional: "Adaptación de tareas con el miembro sano" },
  lesion_medular: { mov: "Movilidad activa del miembro superior y tronco", control: "Equilibrio sentado con alcances", fuerza: "Fortalecimiento de miembros superiores con banda o pesas", fuerzaFunc: "Propulsión de silla de ruedas", funcional: "Transferencias y manejo de la silla en distintos terrenos" },
  parkinson: { mov: "Movilidad axial y rotación de tronco sentado y de pie", control: "Equilibrio con perturbaciones suaves", fuerza: "Sit-to-stand repetido y puente glúteo", fuerzaFunc: "Marcha con ritmo auditivo (metrónomo)", funcional: "Giros y transferencias con estrategias de pistas" }
};

// Aplicar los ejercicios alternativos a las entradas que ya existen
Object.keys(EJ2).forEach(function(k){
  const d = DB[k]; if(!d) return;
  ['mov','control','fuerza','fuerzaFunc','funcional'].forEach(function(f){
    const a = (d[f] || []).filter(Boolean);
    const extra = EJ2[k][f];
    if(extra && a.indexOf(extra) < 0) a.push(extra);
    d[f] = a;
  });
});

// ============================================================
// Ajustes finales de avisos clínicos (patologías neurológicas centrales)
// ============================================================

DB.acv.aviso = "Controlar presión arterial y signos vitales; vigilar fatiga extrema, riesgo de caídas y dolor de hombro del lado afectado (no tirar del brazo). Con alteración de la sensibilidad no aplicar calor ni frío en la zona. Déficit nuevo o que empeora de golpe (cara caída, debilidad de un lado, dificultad para hablar): derivar de urgencia.";

DB.lesion_medular.aviso = "Lesión por encima de T6: vigilar la disreflexia autonómica (cefalea intensa, hipertensión súbita, sudoración) y la hipotensión ortostática en los cambios de posición. Controlar la piel (escaras) y no aplicar calor ni frío en zonas sin sensibilidad. Evitar estiramientos forzados por osteoporosis por desuso.";
DB.lesion_medular.evitar = ["calor", "frio", "ondacorta"];

DB.parkinson.aviso = "Entrenar en el período ON de la medicación. Vigilar la hipotensión ortostática, los episodios de congelamiento de la marcha y el riesgo de caídas (supervisión). Usar pistas externas (visuales o auditivas) y consignas simples.";

// ============================================================
// Zonas del cuerpo → patologías (para el buscador y el desplegable agrupado)
// ============================================================
const ZONAS = {
  "Columna lumbar": ["lumbalgia", "ciatica", "hernia_lumbar", "estenosis_lumbar", "facetario", "espondilolistesis", "piriforme", "sacroileitis", "coccigodinia"],
  "Columna dorsal y tórax": ["hernia_dorsal", "dorsalgia", "hipercifosis", "escoliosis", "fractura_vertebral", "espondilitis", "costillas", "costocondritis"],
  "Columna cervical": ["cervicalgia", "cervicobraquialgia", "cefalea_tensional", "cefalea_cervicogenica", "latigazo", "torticolis", "desfiladero"],
  "Cabeza, ATM y vestibular": ["cefalea_tensional", "cefalea_cervicogenica", "vppb", "neuritis_vestibular", "paralisis_facial"],
  "Hombro": ["hombro", "rotura_manguito", "capsulitis", "inestabilidad_hombro", "tendinopatia_bicipital", "acromioclavicular", "slap", "calcificante", "disquinesia_escapular", "fractura_humero_prox", "fractura_clavicula"],
  "Codo, muñeca y mano": ["epicondilitis", "epitrocleitis", "luxacion_codo", "bursitis_olecraneana", "rigidez_codo", "fractura_codo", "fractura_supracondilea", "dequervain", "tunel", "tunel_cubital", "tunel_radial", "fractura_colles", "fractura_escafoides", "esguince_muneca", "dedo_gatillo", "rizartrosis", "dupuytren", "fractura_metacarpiano", "fractura_falange", "fractura_antebrazo", "tendon_flexor", "tendon_extensor", "mallet", "pulgar_esquiador", "artrosis_manos", "postop_tunel"],
  "Cadera y muslo": ["cadera", "bursitis_trocanterea", "gluteo_medio", "pubalgia", "fractura_cadera", "protesis_cadera", "desgarro_isquiotibial", "desgarro_aductor", "desgarro_cuadriceps", "cadera_resorte", "tendinopatia_psoas", "meralgia", "osteonecrosis_cadera"],
  "Rodilla": ["rodilla", "patelofemoral", "tendinopatia_rotuliana", "lca", "lcp", "lcm", "lesion_meniscal", "luxacion_rotula", "itb", "bursitis_prerrotuliana", "quiste_baker", "protesis_rodilla", "fractura_rotula", "fractura_platillo", "osgood"],
  "Pierna, tobillo y pie": ["tobillo", "rotura_aquiles", "desgarro_gemelo", "inestabilidad_tobillo", "sindesmosis", "canillitis", "fractura_tobillo", "fractura_tibia", "fractura_metatarsiano", "fractura_calcaneo", "hallux_valgus", "hallux_rigidus", "pie_plano", "pie_cavo", "tibial_posterior", "peroneos", "metatarsalgia", "morton", "tarsiano", "fascitis", "pie_diabetico", "sever"],
  "Neurológico": ["acv", "lesion_medular", "parkinson", "esclerosis_multiple", "guillain_barre", "paralisis_facial", "neuropatico", "pci"],
  "Reumatológico y sistémico": ["artritis_reumatoide", "fibromialgia", "osteoporosis", "gota", "lupus", "espondilitis"],
  "Adulto mayor y geriatría": ["riesgo_caidas", "sarcopenia", "deterioro_cognitivo", "fractura_cadera"],
  "Cardiorrespiratorio": ["epoc", "postcovid", "cardiorehabilitacion"],
  "Vestibular": ["vppb", "neuritis_vestibular"],
  "Pediatría": ["pci", "displasia_cadera", "hipotonia_infantil", "fractura_supracondilea", "osgood", "sever", "escoliosis"]
};

// ============================================================
// Tipos de lesión (para filtros)
// ============================================================
const TIPOS = {
  fractura: "Fracturas",
  desgarro: "Desgarros musculares / tendinosos",
  hernia: "Hernias discales",
  ligamento: "Ligamentos / inestabilidad",
  tendinopatia: "Tendinopatías / bursitis",
  postquirurgico: "Post-operatorios / prótesis",
  degenerativo: "Artrosis / degenerativo",
  mecanico: "Dolor mecánico / postural",
  nervio: "Nervio periférico / atrapamientos",
  neurologico: "Neurológico central",
  reumatologico: "Reumatológico / sistémico",
  cardiorrespiratorio: "Cardiorrespiratorio",
  geriatria: "Adulto mayor",
  vestibular: "Vestibular",
  pediatrico: "Pediátrico / crecimiento"
};

// Sinónimos para el buscador (el usuario escribe en criollo y matchea)
const SINONIMOS_TIPO = {
  fractura: "fractura quebradura rotura de hueso",
  desgarro: "desgarro rotura fibrilar",
  hernia: "hernia discal protrusion",
  ligamento: "esguince ligamento luxacion inestabilidad",
  tendinopatia: "tendinitis tendinosis bursitis",
  postquirurgico: "cirugia operado operacion protesis post operatorio",
  degenerativo: "artrosis desgaste",
  nervio: "nervio atrapamiento",
  neurologico: "acv stroke parkinson neuro",
  reumatologico: "artritis reuma lupus gota fibromialgia",
  cardiorrespiratorio: "epoc respiratorio cardio infarto",
  geriatria: "adulto mayor anciano vejez fragilidad",
  vestibular: "vertigo mareo",
  pediatrico: "nino pediatrico infantil crecimiento"
};

// ============================================================
// Configuración del plan de 10 sesiones
// ============================================================

// Metadatos de cada sesión: fase, objetivo, evaluación y plan de ejercicios
const SES_META = [
  {
    fase: "Evaluación inicial y movilidad protegida",
    meta: "Establecer la línea de base y enseñar los ejercicios sin provocar dolor.",
    eval: "Evaluación inicial: test principal, rango de movimiento, fuerza, banderas (rojas, amarillas y azules) y dolor basal (NRS).",
    plan: [['mov', 0], ['mov', 1], ['control', 0]],
    dosis: "2 series × 10 repeticiones · esfuerzo 3/10 · descanso 60 s · sin dolor"
  },
  {
    fase: "Movilidad y primeros ejercicios de control",
    meta: "Ganar rango sin dolor y empezar a activar el control motor.",
    eval: "Control de síntomas: dolor actual, respuesta a la sesión anterior y banderas.",
    plan: [['mov', 1], ['control', 0], ['control', 1]],
    dosis: "2 series × 12 repeticiones · esfuerzo 3-4/10 · descanso 45-60 s"
  },
  {
    fase: "Activación y control motor",
    meta: "Mejorar el control del movimiento en la zona afectada.",
    eval: "Control de síntomas: dolor actual, respuesta a la sesión anterior y banderas.",
    plan: [['control', 0], ['control', 1], ['mov', 0]],
    dosis: "3 series × 10 repeticiones · esfuerzo 4/10 · descanso 45 s"
  },
  {
    fase: "Activación y control motor",
    meta: "Consolidar el control y sumar tiempo bajo tensión.",
    eval: "Control de síntomas: dolor actual, respuesta a la sesión anterior y banderas.",
    plan: [['control', 1], ['control', 0], ['fuerza', 0]],
    dosis: "3 series × 12 repeticiones o 3 × 30 s en isométrico · esfuerzo 4-5/10 · descanso 45 s"
  },
  {
    fase: "Reevaluación intermedia y primera carga",
    meta: "Medir el avance y empezar a cargar los tejidos de forma progresiva.",
    eval: "Reevaluación intermedia: repetir el test principal y comparar el dolor con la sesión 1.",
    plan: [['control', 0], ['fuerza', 0], ['fuerza', 1]],
    dosis: "3 series × 12 repeticiones con pausa de 3 s en el punto más exigente · esfuerzo 5/10"
  },
  {
    fase: "Fuerza progresiva",
    meta: "Aumentar la resistencia (banda, carga o rango) manteniendo la técnica.",
    eval: "Control de síntomas: dolor actual, respuesta a la sesión anterior y banderas.",
    plan: [['fuerza', 0], ['fuerza', 1], ['control', 1]],
    dosis: "3 series × 10 repeticiones con la resistencia del nivel siguiente · esfuerzo 5-6/10 · descanso 60 s"
  },
  {
    fase: "Fuerza progresiva",
    meta: "Consolidar la fuerza e introducir el gesto funcional.",
    eval: "Control de síntomas: dolor actual, respuesta a la sesión anterior y banderas.",
    plan: [['fuerza', 1], ['fuerza', 0], ['funcional', 0]],
    dosis: "3 series × 10-12 repeticiones · esfuerzo 6/10 · descanso 60 s"
  },
  {
    fase: "Fuerza y transferencia funcional",
    meta: "Llevar la fuerza ganada a movimientos de la vida diaria o del deporte.",
    eval: "Control de síntomas: dolor actual, respuesta a la sesión anterior y banderas.",
    plan: [['fuerza', 0], ['funcional', 0], ['funcional', 1]],
    dosis: "3-4 series × 10 repeticiones · esfuerzo 6-7/10 · descanso 60-90 s"
  },
  {
    fase: "Integración funcional",
    meta: "Practicar el gesto específico de la actividad del paciente.",
    eval: "Control de síntomas: dolor actual, respuesta a la sesión anterior y banderas.",
    plan: [['funcional', 0], ['funcional', 1], ['fuerza', 1]],
    dosis: "4 series × 8-10 repeticiones del gesto específico · esfuerzo 7/10 · descanso 90 s"
  },
  {
    fase: "Reevaluación final y alta",
    meta: "Medir el resultado, afianzar el programa para casa y decidir el alta o un nuevo ciclo.",
    eval: "Reevaluación final: repetir test principal, rango, fuerza y dolor (NRS); comparar con la sesión 1.",
    plan: [['funcional', 1], ['funcional', 0], ['fuerza', 0]],
    dosis: "3 series × 10 repeticiones de mantenimiento · esfuerzo 6/10 · descanso 60 s"
  }
];

// Ejercicios de relleno cuando una patología no tiene suficientes ejercicios propios
const FILLER = {
  mov: "Movilidad activa de la zona y de las articulaciones vecinas, en rango sin dolor",
  control: "Control motor y propiocepción de la zona (equilibrio y estabilidad)",
  fuerza: "Fortalecimiento global de la cadena cinética con banda o peso corporal",
  funcional: "Gesto funcional específico de la actividad del paciente (trabajo, deporte o vida diaria)"
};

// Criterio de progresión entre sesiones
const CRITERIO = "Criterio de progresión: subir un nivel si el dolor durante el ejercicio es ≤3/10 y no aumenta a las 24 h; mantener si es 4-5/10; bajar un nivel si es ≥6/10 o el dolor empeora al día siguiente.";

// ============================================================
// FIN DEL ARCHIVO
// ============================================================
