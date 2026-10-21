/* ============================================================
   KINEFLOW - Base de Datos Farmacológica
   ============================================================ */

const FARMACOS = {
  // Antiinflamatorios No Esteroides (AINEs)
  "ibuprofeno": { tipo: "AINE", riesgo: "Enmascara el dolor, retrasa la cicatrización tisular y aumenta el riesgo de sangrado gastrointestinal.", contra: ["manual_intensa", "puncion_seca"] },
  "diclofenaco": { tipo: "AINE", riesgo: "Similar a ibuprofeno. Puede enmascarar síntomas de sobrecarga.", contra: ["manual_intensa", "puncion_seca"] },
  "naproxeno": { tipo: "AINE", riesgo: "Riesgo cardiovascular y gastrointestinal. Enmascara el dolor.", contra: ["manual_intensa", "puncion_seca"] },
  "aspirina": { tipo: "AINE/Antiagregante", riesgo: "Riesgo de sangrado. Contraindicado para terapia manual profunda y punción seca.", contra: ["manual_intensa", "puncion_seca"] },

  // Corticosteroides
  "prednisona": { tipo: "Corticoide", riesgo: "Fragilidad tendinosa y ósea. Riesgo de rotura tendinosa con ejercicio excéntrico intenso. Hiperglucemia.", contra: ["ejercicio_excentrico_intenso", "manipulacion_articular"] },
  "dexametasona": { tipo: "Corticoide", riesgo: "Similar a prednisona. Mayor riesgo de osteoporosis.", contra: ["ejercicio_excentrico_intenso", "manipulacion_articular"] },
  "betametasona": { tipo: "Corticoide", riesgo: "Fragilidad tisular. Precaución con agentes físicos que generan calor.", contra: ["calor_profundo", "ejercicio_excentrico_intenso"] },

  // Anticoagulantes y Antiagregantes
  "warfarina": { tipo: "Anticoagulante", riesgo: "Riesgo severo de sangrado. Contraindicado para terapia manual, punción seca y agentes físicos que aumentan el flujo sanguíneo.", contra: ["manual_intensa", "puncion_seca", "calor_profundo", "masaje_profundo"] },
  "clopidogrel": { tipo: "Antiagregante", riesgo: "Riesgo de sangrado. Evitar técnicas invasivas.", contra: ["manual_intensa", "puncion_seca"] },
  "enoxaparina": { tipo: "Anticoagulante", riesgo: "Riesgo alto de hematomas. Contraindicado para masaje y terapia manual.", contra: ["manual_intensa", "puncion_seca", "masaje_profundo"] },

  // Opioides y Relajantes
  "tramadol": { tipo: "Opioide", riesgo: "Sedación, mareo. Puede alterar la percepción del dolor y la propiocepción.", contra: ["ejercicio_alto_riesgo", "equilibrio"] },
  "morfina": { tipo: "Opioide", riesgo: "Sedación profunda. Precaución con el ejercicio y la deambulación.", contra: ["ejercicio_alto_riesgo", "equilibrio"] },
  "ciclobenzaprina": { tipo: "Relajante muscular", riesgo: "Somnolencia. Precaución con el ejercicio y la conducción.", contra: ["ejercicio_alto_riesgo"] },

  // Antibióticos (Fluoroquinolonas)
  "ciprofloxacino": { tipo: "Antibiótico", riesgo: "Riesgo de tendinopatía y rotura del tendón de Aquiles. Evitar ejercicio excéntrico intenso.", contra: ["ejercicio_excentrico_intenso", "carga_tendinosa"] },
  "levofloxacino": { tipo: "Antibiótico", riesgo: "Similar a ciprofloxacino. Riesgo tendinoso.", contra: ["ejercicio_excentrico_intenso", "carga_tendinosa"] }
};

// Función para buscar un fármaco por principio activo
function buscarFarmaco(principioActivo) {
  const key = principioActivo.toLowerCase().trim();
  return FARMACOS[key] || null;
}