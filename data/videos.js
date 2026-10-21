/* ============================================================
   KINEFLOW - Mapeo de Videos Demostrativos (YouTube IDs)
   ============================================================ */

const VIDEOS_EJERCICIOS = {
  // Columna
  "movilidad pélvica en cuadrupedia": "8bbE64NuDTU",
  "activación de core en decúbito": "pSHjTRCQxIw",
  "puente de glúteos": "8bbE64NuDTU",
  "movilidad cervical activa": "Ks-_U2s2b0E",
  "chin tuck": "Ks-_U2s2b0E",
  "remo con banda": "X6xX7j6s7a0",
  "peso muerto rumano": "2SHsk9AzdjA",
  "prensa de piernas": "IZxyjW7MPJQ",

  // Hombro
  "péndulos de codman": "X6xX7j6s7a0",
  "rotación externa con banda": "X6xX7j6s7a0",
  "face pull": "X6xX7j6s7a0",
  "elevaciones laterales": "3Z2tHw7bU7Y",

  // Rodilla
  "sentadilla": "aclHkVaku9U",
  "extensión de rodilla": "IZxyjW7MPJQ",
  "elevación de talones": "3Z2tHw7bU7Y",
  "monster walk": "8bbE64NuDTU",

  // Tobillo/Pie
  "equilibrio unipodal": "8bbE64NuDTU",
  "eversión con banda": "X6xX7j6s7a0",
  "short foot": "8bbE64NuDTU",

  // Test Clínicos (Videos genéricos representativos)
  "test de lachman": "Ks-_U2s2b0E",
  "test de jobe": "Ks-_U2s2b0E",
  "test de spurling": "Ks-_U2s2b0E",
  "test de thompson": "Ks-_U2s2b0E",
  "test de mcmurray": "Ks-_U2s2b0E"
};

// Función para obtener la URL de embed
function getVideoUrl(ejercicioONombre) {
  const key = ejercicioONombre.toLowerCase().trim();
  const id = VIDEOS_EJERCICIOS[key] || VIDEOS_EJERCICIOS["puente de glúteos"]; // Fallback
  return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`;
}