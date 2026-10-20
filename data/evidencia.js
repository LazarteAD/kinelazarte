/* KineFlow — Sustento científico
   Referencias halladas por búsqueda. Verificar siempre en la fuente antes de aplicar.
   Cada entrada: { r: [{c: cita, u: url}], n: nota interpretativa } */

const EVIDENCIA = {
  lumbalgia: {
    r: [
      { c: "Interventions for the Management of Acute and Chronic Low Back Pain: Revision 2021", u: "https://pubmed.ncbi.nlm.nih.gov/34719942/" },
      { c: "Low back pain and sciatica in over 16s: assessment and management (NICE NG59)", u: "https://www.nice.org.uk/guidance/ng59" }
    ],
    n: "El Lasègue evalúa compromiso radicular, no es un test central de lumbalgia mecánica inespecífica; la evidencia de TENS, ultrasonido y magnetoterapia es débil y las guías priorizan ejercicio, educación y terapia manual."
  },
  ciatica: {
    r: [
      { c: "Low back pain and sciatica in over 16s (NICE NG59)", u: "https://www.nice.org.uk/guidance/ng59" },
      { c: "Physical examination for lumbar radiculopathy due to disc herniation in patients with low-back pain (Cochrane)", u: "https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD007431.pub3/" }
    ],
    n: "El Lasègue es útil pero con especificidad limitada; la evidencia de TENS, magnetoterapia y calor es débil frente a ejercicio y educación."
  },
  hernia_lumbar: {
    r: [
      { c: "Physical examination for lumbar radiculopathy (Cochrane)", u: "https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD007431.pub3/" },
      { c: "Low back pain and sciatica in over 16s (NICE NG59)", u: "https://www.nice.org.uk/guidance/ng59" }
    ],
    n: "La evidencia sobre pruebas físicas sugiere combinar varios tests en lugar de depender de uno solo; los agentes físicos tienen respaldo débil."
  },
  cervicalgia: {
    r: [
      { c: "Neck Pain: Clinical Practice Guidelines Revision 2017 (JOSPT)", u: "https://www.jospt.org/doi/10.2519/jospt.2017.0302" }
    ],
    n: "El Spurling es para radiculopatía, no para cervicalgia mecánica inespecífica; la evidencia de TENS y magnetoterapia es débil frente a ejercicio y terapia manual."
  },
  cervicobraquialgia: {
    r: [
      { c: "The Spurling test and cervical radiculopathy (Spine)", u: "https://pubmed.ncbi.nlm.nih.gov/10788861/" }
    ],
    n: "El Spurling tiene baja sensibilidad; conviene combinarlo con otros tests; la evidencia de TENS, calor y magnetoterapia es débil."
  },
  hombro: {
    r: [
      { c: "Rotator Cuff Tendinopathy Diagnosis, Nonsurgical Medical Care, and Rehabilitation: A Clinical Practice Guideline (JOSPT 2025)", u: "https://www.jospt.org/doi/10.2519/jospt.2025.0301" },
      { c: "Electrotherapy modalities for rotator cuff disease (Cochrane)", u: "https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD012225.pub2/" }
    ],
    n: "Las revisiones sobre ultrasonido y electroterapia en manguito rotador muestran evidencia débil o de baja certeza; el ejercicio es el pilar, y los tests aislados como Jobe tienen precisión limitada."
  },
  rodilla: {
    r: [
      { c: "OARSI guidelines for the non-surgical management of knee osteoarthritis", u: "https://pubmed.ncbi.nlm.nih.gov/24462672/" }
    ],
    n: "Las guías de gonartrosis priorizan ejercicio, educación y control de peso; los agentes físicos (calor, magnetoterapia) son complementarios y de evidencia limitada."
  },
  lca: {
    r: [
      { c: "The diagnostic accuracy of clinical tests for anterior cruciate ligament tears (KSSTA)", u: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9464183/" }
    ],
    n: "El Lachman es el test más sensible, pero su precisión ha sido sobreestimada según revisiones recientes; combinar con otros tests."
  },
  tobillo: {
    r: [
      { c: "Ankle stability and movement coordination impairments: Lateral ankle ligament sprains revision 2021 (JOSPT)", u: "https://www.jospt.org/doi/10.2519/jospt.2021.0302" },
      { c: "Therapeutic ultrasound for acute ankle sprains (Cochrane)", u: "https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD001250.pub2/" }
    ],
    n: "Evidencia débil para ultrasonido terapéutico; la guía enfatiza movilización y ejercicio."
  },
  aquiles: {
    r: [
      { c: "Achilles Pain, Stiffness, and Muscle Power Deficits: Midportion Achilles Tendinopathy Revision 2018 (JOSPT)", u: "https://www.jospt.org/doi/10.2519/jospt.2018.0302" }
    ],
    n: "El eje de la guía es el ejercicio de carga; el ultrasonido no es central."
  },
  fascitis: {
    r: [
      { c: "Heel Pain - Plantar Fasciitis: Revision 2023 (JOSPT)", u: "https://www.jospt.org/doi/10.2519/jospt.2023.0303" }
    ],
    n: "Evidencia limitada para ultrasonido terapéutico; la guía prioriza educación, ejercicio, terapia manual y ortesis."
  },
  epicondilitis: {
    r: [
      { c: "Lateral elbow pain and muscle function impairments (APTA/JOSPT CPG)", u: "https://www.jospt.org/doi/10.2519/jospt.2022.0302" }
    ],
    n: "La guía prioriza ejercicio y educación; la evidencia para ultrasonido, magnetoterapia y TENS es débil."
  },
  tunel: {
    r: [
      { c: "Carpal Tunnel Syndrome (AAOS Clinical Practice Guideline)", u: "https://www.aaos.org/ctscpg" }
    ],
    n: "Phalen tiene precisión diagnóstica limitada por sí solo; la guía no respalda de forma sólida frío, TENS ni magnetoterapia."
  },
  acv: {
    r: [
      { c: "Electrostimulation for promoting recovery of movement or functional ability after stroke (Cochrane)", u: "https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD003241.pub3/" }
    ],
    n: "La fiabilidad de la Ashworth modificada es limitada; no se verificó respaldo para magnetoterapia."
  },
  parkinson: {
    r: [
      { c: "European Physiotherapy Guideline for Parkinson's Disease", u: "https://www.parkinsons.org.uk/professionals/resources/european-physiotherapy-guideline-parkinsons-disease" }
    ],
    n: ""
  },
  epoc: {
    r: [
      { c: "Pulmonary rehabilitation for chronic obstructive pulmonary disease (Cochrane)", u: "https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD003793.pub3/" }
    ],
    n: ""
  },
  riesgo_caidas: {
    r: [
      { c: "Exercise for preventing falls in older people living in the community (Cochrane)", u: "https://pubmed.ncbi.nlm.nih.gov/30703272/" }
    ],
    n: ""
  },
  sarcopenia: {
    r: [
      { c: "Sarcopenia: revised European consensus on definition and diagnosis (EWGSOP2)", u: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6322506/" }
    ],
    n: ""
  },
  artritis_reumatoide: {
    r: [
      { c: "EULAR recommendations for physical activity in people with inflammatory arthritis and osteoarthritis", u: "https://pubmed.ncbi.nlm.nih.gov/29967194/" }
    ],
    n: ""
  },
  fibromialgia: {
    r: [
      { c: "EULAR revised recommendations for the management of fibromyalgia", u: "https://pubmed.ncbi.nlm.nih.gov/27377815/" }
    ],
    n: ""
  },
  osteoporosis: {
    r: [
      { c: "Exercise to Prevent and Manage Frailty and Fragility Fractures", u: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10105671/" }
    ],
    n: ""
  },
  cancer_ejercicio: {
    r: [
      { c: "Exercise for people diagnosed with cancer: managing fatigue during and after cancer treatment (Cochrane)", u: "https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD006145.pub3/" }
    ],
    n: ""
  }
};