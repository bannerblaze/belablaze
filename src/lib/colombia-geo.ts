/* ──────────────────────────────────────────────────────────────────────
 * Colombia geo helpers — pure, server/client-safe.
 *
 *   • projectGeo(lat, lng)  → SVG (x, y) inside the fleet map viewBox
 *   • CITY_COORDS           → lat/lng fallback for the cities used by
 *                             our seed/mock data when the screen row
 *                             doesn't carry coordinates yet
 *   • COLOMBIA_OUTLINE      → simplified silhouette (~30 vertices)
 *   • COLOMBIA_GRID         → faint lat/lng graticule lines for texture
 *   • CITY_LABELS           → optional anchor cities for orientation
 *
 * The outline is hand-tuned: not cartographically perfect but instantly
 * readable as Colombia. Coordinates were precomputed from the projection
 * below using key border vertices (Punta Gallinas, Cabo Manglares,
 * Leticia, Puerto Carreño…).
 * ────────────────────────────────────────────────────────────────────── */

export const MAP_VIEWBOX = { w: 600, h: 800 } as const;

const BOUNDS = { west: -79, east: -66, north: 13, south: -4.5 } as const;
const SCALE = MAP_VIEWBOX.h / (BOUNDS.north - BOUNDS.south); // 45.71 px/deg
const OFFSET_X =
  (MAP_VIEWBOX.w - (BOUNDS.east - BOUNDS.west) * SCALE) / 2;

export function projectGeo(lat: number, lng: number): { x: number; y: number } {
  const x = OFFSET_X + (lng - BOUNDS.west) * SCALE;
  const y = (BOUNDS.north - lat) * SCALE;
  return { x, y };
}

/** Lat/lng for the cities currently in our screen catalog. Used only
 *  when a Screen row does not have its own latitude/longitude yet. */
export const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  Medellín: { lat: 6.2476, lng: -75.5658 },
  Bogotá: { lat: 4.711, lng: -74.0721 },
  Cali: { lat: 3.4516, lng: -76.532 },
  Barranquilla: { lat: 10.9685, lng: -74.7813 },
  Cartagena: { lat: 10.391, lng: -75.4794 },
  Bucaramanga: { lat: 7.1193, lng: -73.1227 },
  Pereira: { lat: 4.8133, lng: -75.6961 },
  Manizales: { lat: 5.0689, lng: -75.5174 },
  Bello: { lat: 6.3373, lng: -75.5577 },
  Envigado: { lat: 6.1751, lng: -75.5917 },
  Itagüí: { lat: 6.17, lng: -75.5996 },
  "Santa Marta": { lat: 11.2408, lng: -74.199 },
  Cúcuta: { lat: 7.8939, lng: -72.5078 },
  Ibagué: { lat: 4.4389, lng: -75.2322 },
  Villavicencio: { lat: 4.142, lng: -73.6266 },
  Pasto: { lat: 1.2136, lng: -77.2811 },
  Armenia: { lat: 4.5341, lng: -75.6757 },
  Neiva: { lat: 2.9273, lng: -75.2819 },
  Montería: { lat: 8.7479, lng: -75.8814 },
  Sincelejo: { lat: 9.3047, lng: -75.3978 },
  Valledupar: { lat: 10.4631, lng: -73.2532 },
  Popayán: { lat: 2.4448, lng: -76.6147 },
};

/** Resolve a screen's map coordinates. Prefers the row's lat/lng,
 *  falls back to the city dictionary, returns null if unknown. */
export function resolveScreenCoords(screen: {
  latitude?: number | null;
  longitude?: number | null;
  city?: string | null;
}): { lat: number; lng: number } | null {
  if (typeof screen.latitude === "number" && typeof screen.longitude === "number") {
    return { lat: screen.latitude, lng: screen.longitude };
  }
  if (screen.city && CITY_COORDS[screen.city]) return CITY_COORDS[screen.city]!;
  return null;
}

/** Anchor cities drawn underneath the pins for orientation. */
export const CITY_LABELS: Array<{ name: string; lat: number; lng: number }> = [
  { name: "Bogotá", ...CITY_COORDS["Bogotá"]! },
  { name: "Medellín", ...CITY_COORDS["Medellín"]! },
  { name: "Cali", ...CITY_COORDS["Cali"]! },
  { name: "Barranquilla", ...CITY_COORDS["Barranquilla"]! },
  { name: "Cartagena", ...CITY_COORDS["Cartagena"]! },
  { name: "Bucaramanga", ...CITY_COORDS["Bucaramanga"]! },
  { name: "Pereira", ...CITY_COORDS["Pereira"]! },
  { name: "Cúcuta", ...CITY_COORDS["Cúcuta"]! },
];

/** Faint lat/lng graticule. Returns an array of {x1,y1,x2,y2} segments. */
export function buildGraticule(stepDeg = 2): Array<{ x1: number; y1: number; x2: number; y2: number }> {
  const segs: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  for (let lat = Math.ceil(BOUNDS.south); lat <= BOUNDS.north; lat += stepDeg) {
    const a = projectGeo(lat, BOUNDS.west);
    const b = projectGeo(lat, BOUNDS.east);
    segs.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
  }
  for (let lng = Math.ceil(BOUNDS.west); lng <= BOUNDS.east; lng += stepDeg) {
    const a = projectGeo(BOUNDS.north, lng);
    const b = projectGeo(BOUNDS.south, lng);
    segs.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
  }
  return segs;
}

/** Simplified Colombia outline. Clockwise from Punta Gallinas → La
 *  Guajira tip → Caribbean → Darién → Pacific → Tumaco → Amazon →
 *  Leticia → Brazil/Venezuela border → back to Guajira. */
export const COLOMBIA_OUTLINE = [
  "M 336.7 22.9",        // Punta Gallinas (NE tip)
  "L 313.8 36.6",        // Cabo de la Vela
  "L 281.8 68.6",        // Riohacha
  "L 222.4 82.3",        // Santa Marta
  "L 195 93.7",          // Barranquilla
  "L 160.7 118.8",       // Cartagena
  "L 153.9 164.6",       // Coveñas
  "L 108.1 224.0",       // Turbo (Urabá)
  "L 80.7 205.7",        // Acandí
  "L 78.4 198.8",        // Frontera Panamá (Capurganá)
  "L 62.4 274.3",        // Punta Ardita (costa Pacífica norte)
  "L 76.1 310.9",        // Bahía Solano
  "L 92.1 416.0",        // Buenaventura
  "L 12.1 512.0",        // Tumaco
  "L 5.3 521.1",         // Cabo Manglares (frontera Ecuador Pacífico)
  "L 62.4 555.4",        // Frontera Ecuador interior
  "L 121.8 575.9",       // Putumayo (frontera Ecuador)
  "L 140.1 594.2",       // San Miguel
  "L 162.9 612.5",       // Tres fronteras Ecu-Per
  "L 254.4 662.8",       // Río Putumayo
  "L 345.8 708.5",       // Río Putumayo medio
  "L 416.7 786.2",       // Leticia (S extremo)
  "L 437.2 685.7",       // Sube por la frontera con Brasil
  "L 437.2 640.0",       // Río Negro
  "L 437.2 548.5",       // Mitú (frontera Brasil)
  "L 505.7 525.7",       // Cerro Marahuaca
  "L 551.4 516.6",       // Río Negro (frontera Bzl-Vzl)
  "L 555.9 507.4",       // San Felipe
  "L 528.4 411.4",       // Bordeando Venezuela al N
  "L 528.4 310.9",       // Puerto Carreño (Vichada)
  "L 482.7 297.2",       // Río Meta frontera
  "L 382.1 269.7",       // Río Arauca
  "L 327.3 278.9",       // Saravena (Norte de Santander sur)
  "L 299.8 233.2",       // Cúcuta (frontera Vzl)
  "L 286.1 196.6",       // Sierra de Perijá
  "L 299.8 114.3",       // Frontera Maracaibo coast
  "L 322.7 73.1",        // Cerca Maicao
  "Z",
].join(" ");
