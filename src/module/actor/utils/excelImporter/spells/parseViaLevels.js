/**
 * Parser de la cadena `VíasDeMagiaSeleccionadas` del Excel comunitario.
 *
 * Formato real (fórmula TEXTJOIN de Místicos): una lista separada por comas de
 *   "<nivel> <Vía> (<subvía>[, <ayudas del grimorio…>])"
 * donde el paréntesis lleva PRIMERO la subvía y luego hechizos-ayuda de la
 * propia vía (no son selecciones). Ej.:
 *   ", 60 Oscuridad (Conocimiento), 99 Aire (Conocimiento, Apertura, ...)"
 *
 * Devolvemos `[{ viaKey, level }]` para vía PRINCIPAL y SUBVÍA (ambas dan
 * acceso a todos sus hechizos hasta el nivel de la vía). Se ignora el resto del
 * paréntesis. Vías no reconocidas se omiten. (Los Libre Acceso / individuales
 * seleccionados se gestionan aparte, no salen de aquí.)
 */

const VIA_NAME_TO_KEY = {
  oscuridad: 'darkness',
  luz: 'light',
  creacion: 'creation',
  destruccion: 'destruction',
  agua: 'water',
  fuego: 'fire',
  aire: 'air',
  tierra: 'earth',
  esencia: 'essence',
  ilusion: 'illusion',
  nigromancia: 'necromancy',
  sangre: 'blood',
  caos: 'chaos',
  muerte: 'death',
  suenos: 'dreams',
  vacio: 'emptiness',
  conocimiento: 'knowledge',
  literae: 'literae',
  musical: 'musical',
  nobleza: 'nobility',
  paz: 'peace',
  pecado: 'sin',
  umbral: 'threshold',
  tiempo: 'time',
  guerra: 'war',
  'libre acceso': 'freeAccess'
};

// Más largos primero: el match por subcadena prefiere el nombre más específico.
const VIA_NAMES_BY_LENGTH = Object.keys(VIA_NAME_TO_KEY).sort(
  (a, b) => b.length - a.length
);

const normalize = s =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

const matchVia = text => {
  const norm = normalize(text);
  const name = VIA_NAMES_BY_LENGTH.find(n => norm.includes(n));
  return name ? VIA_NAME_TO_KEY[name] : null;
};

const extractLevel = text => {
  for (const token of String(text).split(/\s+/)) {
    const n = Number(token);
    if (token !== '' && Number.isFinite(n)) return n;
  }
  return 0;
};

export function parseViaLevels(viasString) {
  // Reconstruir entradas: cada una empieza por un número; los fragmentos sin
  // número inicial son continuación del paréntesis de la entrada anterior (la
  // subvía y las ayudas del grimorio llevan comas dentro del paréntesis).
  const entries = [];
  for (const frag of String(viasString ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)) {
    if (/^\d/.test(frag)) entries.push(frag);
    else if (entries.length) entries[entries.length - 1] += `, ${frag}`;
  }

  const byKey = new Map();
  const add = (viaKey, level) => {
    if (!viaKey) return;
    const prev = byKey.get(viaKey);
    if (prev == null || level > prev) byKey.set(viaKey, level);
  };

  for (const entry of entries) {
    const level = extractLevel(entry);
    const parenStart = entry.indexOf('(');
    const beforeParen = parenStart === -1 ? entry : entry.slice(0, parenStart);
    const parenContent =
      parenStart === -1 ? '' : entry.slice(parenStart + 1).replace(/\)\s*$/, '');

    // Vía principal (nombre tras el número, antes del paréntesis).
    add(matchVia(beforeParen), level);

    // Subvía = primer elemento del paréntesis, solo si es nombre de vía.
    if (parenContent) add(matchVia(parenContent.split(',')[0]), level);
  }

  return [...byKey.entries()].map(([viaKey, level]) => ({ viaKey, level }));
}
