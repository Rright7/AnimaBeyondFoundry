// Requisitos por arte y grado (fuente: manual Dominus Exxet, Cap. 4 "Las Artes
// Marciales"). El Excel no los tabula (col Z = "NO"), por eso viven aqui aparte
// del catalogo auto-generado. Estructura: { canonicalId: { grade: 'texto' } }.
// '' = sin requisito (Grado Base de muchas Basicas).
export const MARTIAL_ART_REQUIREMENTS = {
  // ---------- BASICAS ----------
  aikido: {
    base: 'Trucos de manos 20',
    advanced: 'Trucos de manos 40, Habilidad de Ataque sin armas 100, Habilidad de Defensa sin armas 120',
    supreme: 'Trucos de manos 80, Maestría en defensa sin armas'
  },
  boxeo: {
    base: 'Proezas de fuerza 30',
    advanced: 'Proezas de fuerza 60, Habilidad de Ataque sin armas 120, Habilidad de Defensa sin armas 120',
    supreme: 'Proezas de fuerza 120, Maestría en ataque y defensa sin armas'
  },
  capoeira: {
    base: 'Baile 20',
    advanced: 'Baile 40, Habilidad de Esquiva sin armas 120',
    supreme: 'Baile 120, Maestría en esquiva sin armas'
  },
  grappling: {
    base: 'Proezas de fuerza 20',
    advanced: 'Proezas de fuerza 40, Habilidad de Ataque sin armas 130',
    supreme: 'Proezas de fuerza 120, Maestría en ataque sin armas'
  },
  kardad: {
    base: 'Atletismo 40, Trucos de manos 20',
    advanced: 'Atletismo 60, Trucos de manos 40, Habilidad de Defensa sin armas 120',
    supreme: 'Atletismo 120, Trucos de manos 100'
  },
  kempo: {
    base: '',
    advanced: 'Habilidad de Ataque sin armas 120',
    supreme: 'Maestría en ataque sin armas'
  },
  kuan: {
    base: 'Trucos de manos 40',
    advanced: 'Trucos de manos 60, Habilidad de Defensa sin armas 120',
    supreme: 'Trucos de manos 140, Maestría en defensa sin armas'
  },
  kungFu: {
    base: 'Acrobacias 20, Trucos de manos 20 y Estilo 10',
    advanced: 'Acrobacias 40, Trucos de manos 40, Estilo 20, Habilidad de Ataque sin armas 120, Habilidad de Defensa sin armas 120',
    supreme: 'Acrobacias 120, Trucos de manos 120, Estilo 100, Maestría en ataque y defensa sin armas'
  },
  lama: {
    base: 'Estilo 20',
    advanced: 'Estilo 40, Habilidad de Defensa sin armas 130',
    supreme: 'Estilo 80, Maestría en defensa sin armas'
  },
  mallaYuddha: {
    base: 'Trucos de manos 20',
    advanced: 'Trucos de manos 40, Habilidad de Defensa sin armas 120',
    supreme: 'Trucos de manos 100, Maestría en parada sin armas'
  },
  moaiThai: {
    base: 'Proezas de fuerza 30',
    advanced: 'Proezas de fuerza 40, Habilidad de Ataque sin armas 130',
    supreme: 'Proezas de fuerza 160, Maestría en ataque sin armas'
  },
  pankration: {
    base: 'Atletismo 30, Proezas de fuerza 30',
    advanced: 'Atletismo 50, Proezas de fuerza 50, Habilidad de Ataque sin armas 110, Habilidad de Defensa sin armas 110',
    supreme: 'Proezas de fuerza 120, Maestría en defensa sin armas'
  },
  sambo: {
    base: '',
    advanced: 'Habilidad de Ataque sin armas 130',
    supreme: 'Maestría en ataque y defensa sin armas'
  },
  shotokan: {
    base: '',
    advanced: 'Habilidad de Ataque 120 sin armas, Habilidad de Defensa sin armas 120',
    supreme: 'Maestría en ataque sin armas'
  },
  sooBahk: {
    base: 'Advertir 50',
    advanced: 'Advertir 90, Habilidad de Defensa sin armas 120',
    supreme: 'Advertir 120, Acrobacias 60, Maestría en defensa sin armas'
  },
  taeKwonDo: {
    base: '',
    advanced: 'Habilidad de Ataque sin armas 130, Habilidad de Defensa sin armas 100',
    supreme: 'Maestría en ataque sin armas'
  },
  taiChi: {
    base: '',
    advanced: 'Uso del Ki',
    supreme: 'Uso de la energía necesaria, Habilidad de Ataque sin armas 180, Habilidad de Defensa sin armas 180'
  },
  xingQuan: {
    base: 'Trucos de manos 20',
    advanced: 'Trucos de manos 50, Turno 100, Habilidad de Ataque sin armas 120',
    supreme: 'Trucos de manos 100, Turno 120, Maestría en ataque sin armas'
  },

  // ---------- AVANZADAS ----------
  asakusen: {
    base: 'Kung Fu (Grado Avanzado), Habilidad de Ataque sin armas 160, Habilidad de Defensa sin armas 160',
    arcane: 'Kung Fu (Grado Supremo), Inhumanidad, Habilidad de Ataque sin armas 280, Habilidad de Defensa sin armas 280'
  },
  dumah: {
    base: 'Kempo (Grado Avanzado) o Capoeira (Grado Avanzado), Extrusión de presencia',
    arcane: 'Kempo (Grado Supremo) o Capoeira (Grado Supremo), Inhumanidad, Habilidad de Ataque sin armas 280'
  },
  emp: {
    base: 'Kempo (Grado Avanzado), Kuan (Grado Avanzado) o Malla-yuddha (Grado Avanzado), Maestría en ataque sin armas',
    arcane: 'Kempo (Grado Supremo), Kuan (Grado Supremo) o Malla-yuddha (Grado Supremo), Habilidad de Ataque sin armas 280, Habilidad de Defensa sin armas 260'
  },
  enuth: {
    base: 'Sambo (Grado Avanzado) o Shotokan (Grado Avanzado), Habilidad de Ataque sin armas 160, Habilidad de Defensa sin armas 160',
    arcane: 'Sambo (Grado Supremo) o Shotokan (Grado Supremo), Inhumanidad, Erudición, Habilidad de Ataque sin armas 280, Habilidad de Defensa sin armas 280'
  },
  exelion: {
    base: 'Kardad (Grado Avanzado) o Tai Chi (Grado Avanzado), Maestría en ataque sin armas, Extensión del aura al arma',
    arcane: 'Kardad (Grado Supremo) o Tai Chi (Grado Supremo), Inhumanidad, Habilidad de Ataque sin armas 300'
  },
  godhand: {
    base: 'Boxeo (Grado Avanzado) o Shotokan (Grado Avanzado), Maestría en ataque sin armas',
    arcane: 'Boxeo (Grado Supremo) o Shotokan (Grado Supremo), Inhumanidad, Extrusión del Ki, Habilidad de Ataque sin armas 300'
  },
  hakyoukuken: {
    base: 'Shotokan (Grado Avanzado) o Moai Thai (Grado Avanzado), Uso de la energía necesaria, Maestría en ataque sin armas',
    arcane: 'Shotokan (Grado Supremo) o Moai Thai (Grado Supremo), Inhumanidad, Habilidad de Ataque sin armas 300'
  },
  hanja: {
    base: 'Soo Bahk (Grado Avanzado), Detección del Ki, Advertir 200, Maestría en defensa sin armas',
    arcane: 'Soo Bahk (Grado Supremo), Inhumanidad, Erudición, Advertir 240, Habilidad de Defensa sin armas 300'
  },
  lamaTsu: {
    base: 'Lama (Grado Avanzado), Detección del Ki, Estilo 120, Habilidad de Defensa sin armas 220',
    arcane: 'Lama (Grado Supremo), Erudición, Estilo 140, Habilidad de Defensa sin armas 300'
  },
  melkaiah: {
    base: 'Grappling (Grado Avanzado) o Pankration (Grado Avanzado), Inhumanidad, Habilidad de Ataque sin armas 160, Habilidad de Defensa sin armas 160',
    arcane: 'Grappling (Grado Supremo) o Pankration (Grado Supremo), Habilidad de Ataque sin armas 260, Habilidad de Defensa sin armas 260'
  },
  mushin: {
    base: 'Kung Fu (Grado Avanzado) o Xing Quan (Grado Avanzado), Medicina 100 (o especialización en Anatomía 60), Maestría en ataque sin armas',
    arcane: 'Kung Fu (Grado Supremo) o Xing Quan (Grado Supremo), Inhumanidad, Medicina 120 (o especialización en Anatomía 80), Habilidad de Ataque sin armas 300'
  },
  rexFrame: {
    base: 'Malla-yuddha (Grado Avanzado) o Moai Thai (Grado Avanzado), Maestría en defensa sin armas, Inhumanidad',
    arcane: 'Malla-yuddha (Grado Supremo) o Moai Thai (Grado Supremo), Habilidad de Defensa sin armas 300, Zen'
  },
  selene: {
    base: 'Aikido (Grado Avanzado), Maestría en defensa sin armas',
    arcane: 'Aikido (Grado Supremo), Inhumanidad, Habilidad de Esquiva o Parada sin armas 300'
  },
  seraphite: {
    base: 'Shotokan (Grado Avanzado) o Kempo (Grado Avanzado), Extrusión de presencia, Habilidad de Ataque sin armas 180',
    arcane: 'Shotokan (Grado Supremo) o Kempo (Grado Supremo), Extrusión de presencia, Habilidad de Ataque sin armas 280'
  },
  shephon: {
    base: 'Aikido (Grado Avanzado) o Kuan (Grado Avanzado), Uso del Ki, Maestría en defensa sin armas',
    arcane: 'Aikido (Grado Supremo) o Kuan (Grado Supremo), Habilidad de Defensa sin armas 300'
  },
  suyanta: {
    base: 'Tai Chi (Grado Avanzado), Extrusión del Ki, Maestría en ataque sin armas',
    arcane: 'Tai Chi (Grado Supremo) o Kung Fu (Grado Supremo), Habilidad de Ataque sin armas 280'
  },
  velez: {
    base: 'Tai Chi (Grado Avanzado) o Kung Fu (Grado Avanzado), Extrusión de presencia',
    arcane: 'Tai Chi (Grado Supremo), Inhumanidad, Habilidad de Ataque sin armas 300'
  }
};
