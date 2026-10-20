/* KineFlow — Escalas clínicas de referencia
   Solo se muestran cuando la patología seleccionada las usa. */

const ESCALAS = {
  ashworth: {
    n: "Escala de Ashworth Modificada (espasticidad)",
    d: "Se moviliza pasivamente el segmento y se califica la resistencia: 0 sin aumento de tono; 1 aumento leve con 'catch' y liberación; 1+ 'catch' seguido de resistencia mínima en el resto del rango; 2 aumento marcado en la mayor parte del rango, pero se moviliza fácil; 3 aumento considerable, movimiento pasivo difícil; 4 rígido en flexión o extensión."
  },
  daniels: {
    n: "Escala de Daniels (fuerza muscular, 0-5)",
    d: "0 sin contracción visible; 1 contracción palpable sin movimiento; 2 movimiento completo sin gravedad; 3 movimiento completo contra gravedad; 4 movimiento completo contra resistencia moderada; 5 fuerza normal contra resistencia máxima."
  },
  asia: {
    n: "Escala ASIA / AIS (lesión medular)",
    d: "Combina examen sensitivo (dermatomas) y motor (miotomas clave) para definir el nivel neurológico y clasificar la severidad: A (completa, sin función sacra), B (sensitiva incompleta), C y D (motora incompleta), E (función normal)."
  },
  hoehnyahr: {
    n: "Escala de Hoehn y Yahr (Parkinson)",
    d: "I afectación unilateral leve; II bilateral sin alteración del equilibrio; III bilateral con inestabilidad postural leve-moderada, independiente; IV discapacidad severa, aún puede caminar/pararse; V confinado a silla de ruedas o cama."
  },
  quebec: {
    n: "Escala de gravedad de Quebec (QTF, latigazo cervical)",
    d: "Grado 0 sin dolor ni signos; I dolor sin signos físicos; II dolor con signos musculoesqueléticos; III dolor con signos neurológicos; IV con fractura o luxación."
  },
  tug: {
    n: "Timed Up and Go (TUG)",
    d: "El paciente, sentado en una silla con apoyabrazos, se levanta, camina 3 metros a su ritmo habitual, gira, vuelve y se sienta; se cronometra. Menos de 10 s: normal; 10-12 s: aceptable; más de 12 s: riesgo de caídas; más de 20 s: movilidad muy reducida."
  },
  berg: {
    n: "Escala de equilibrio de Berg (0-56)",
    d: "14 tareas de equilibrio (pararse, sentarse, girar, apoyo unipodal, alcanzar hacia adelante, etc.), cada una puntuada de 0 a 4. Puntaje total 41-56: riesgo bajo; 21-40: riesgo medio; 0-20: riesgo alto de caídas."
  },
  mrc: {
    n: "Escala MRC (fuerza muscular 0-5)",
    d: "Igual a Daniels en lo esencial: 0 sin contracción; 1 contracción visible o palpable sin movimiento; 2 movimiento sin gravedad; 3 movimiento contra gravedad; 4 contra resistencia parcial; 5 fuerza normal. La suma de 6 grupos musculares por lado da un puntaje de 0 a 60."
  },
  housebrackmann: {
    n: "Escala de House-Brackmann (parálisis facial)",
    d: "Grado I función normal; II disfunción leve con simetría en reposo; III disfunción moderada, cierre ocular completo con esfuerzo; IV disfunción moderadamente severa, cierre incompleto; V solo movimientos apenas perceptibles; VI parálisis total. Se observa la cara en reposo y al elevar cejas, cerrar los ojos, sonreír y fruncir los labios."
  },
  sts30: {
    n: "Sit-to-stand de 30 segundos",
    d: "El paciente, con los brazos cruzados sobre el pecho, se sienta y se para de una silla estándar la mayor cantidad de veces posible en 30 segundos. Menos de 12 repeticiones en 60-64 años (menos de 8 en 80-84) indica fuerza de miembros inferiores reducida."
  },
  gmfcs: {
    n: "GMFCS (Gross Motor Function Classification System)",
    d: "Clasifica la movilidad de niños con parálisis cerebral en 5 niveles: I camina sin limitaciones; II camina con limitaciones en terrenos irregulares; III camina con ayuda técnica manual; IV movilidad autónoma limitada (silla); V traslado asistido. Se determina por la observación del movimiento habitual según edad."
  },
  dixhallpike: {
    n: "Maniobra de Dix-Hallpike",
    d: "Con el paciente sentado y la cabeza rotada 45° hacia el lado a evaluar, se lo recuesta rápidamente con la cabeza colgando 20° fuera de la camilla y se observan los ojos 30-60 s. Vértigo con nistagmo rotatorio hacia el oído inferior, que se agota, confirma VPPB del canal posterior de ese lado."
  }
};