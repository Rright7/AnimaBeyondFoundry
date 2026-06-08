// AUTO-GENERADO por scripts/compendia/buildMartialArtCatalog.py — no editar a mano.
// Fuente: Ficha Anima v8.7.0.xlsm, Tablas!D850:AC939. Valores ACUMULADOS por grado.
// damageBase: { base, characteristic: "strength"|"power"|null, mult }. special/requirements
// (texto informativo del manual) se enriquecen aparte; aqui van vacios.

export const MARTIAL_ARTS = {
  aikido: {
    name: 'Aikido', type: 'basic',
    grades: {
      base: { cm: 0, attack: 0, block: 0, dodge: 0, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 10, characteristic: 'strength', mult: 1 } },
      advanced: { cm: 10, attack: 0, block: 10, dodge: 10, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 10, characteristic: 'strength', mult: 1 } },
      supreme: { cm: 20, attack: 0, block: 20, dodge: 20, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 10, characteristic: 'strength', mult: 1 } },
    },
    special: { base: 'En contraataque añade (2xFUE enemigo) al Daño', advanced: 'En contraataque Presa y Derribo sin penalizador y Daño +2xFUE enemigo', supreme: 'Bono +2 Presa y Derribo. Contra: Presa y Derribo sin pen. y daño +4xFUE enemigo' }, requirements: {}
  },
  boxeo: {
    name: 'Boxeo', type: 'basic',
    grades: {
      base: { cm: 0, attack: 0, block: 0, dodge: 0, turn: 5, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 10, characteristic: 'strength', mult: 2 } },
      advanced: { cm: 10, attack: 0, block: 0, dodge: 0, turn: 10, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 20, characteristic: 'strength', mult: 2 } },
      supreme: { cm: 20, attack: 10, block: 0, dodge: 0, turn: 20, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 30, characteristic: 'strength', mult: 2 } },
    },
    special: { advanced: 'Bono especial de +10 en contraataque', supreme: 'Bono especial de +10 en contraataque' }, requirements: {}
  },
  capoeira: {
    name: 'Capoeira', type: 'basic',
    grades: {
      base: { cm: 0, attack: 0, block: 0, dodge: 0, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 20, characteristic: 'strength', mult: 1 } },
      advanced: { cm: 10, attack: 0, block: 0, dodge: 10, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 20, characteristic: 'strength', mult: 1 } },
      supreme: { cm: 20, attack: 0, block: 0, dodge: 20, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 20, characteristic: 'strength', mult: 1 } },
    },
    special: { base: 'Ataque en Área como arma media', advanced: 'Ataque en Área como arma grande', supreme: 'Ataque en Área como arma grande y con penalizador reducido a -10' }, requirements: {}
  },
  grappling: {
    name: 'Grappling', type: 'basic',
    grades: {
      base: { cm: 0, attack: 0, block: 0, dodge: 0, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 10, characteristic: 'strength', mult: 1 } },
      advanced: { cm: 10, attack: 0, block: 0, dodge: 0, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 20, characteristic: 'strength', mult: 1 } },
      supreme: { cm: 20, attack: 0, block: 0, dodge: 0, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 20, characteristic: 'strength', mult: 1 } },
    },
    special: { base: 'Presa y Derribo con mitad de penalizadores', advanced: 'Presa y Derribo sin penalizadores', supreme: 'Presa y Derribo sin penalizadores. Se puede hacer Daño completo en Presa y Derribo' }, requirements: {}
  },
  kardad: {
    name: 'Kardad', type: 'basic',
    grades: {
      base: { cm: 0, attack: 0, block: 0, dodge: 0, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 10, characteristic: 'strength', mult: 1 } },
      advanced: { cm: 10, attack: 0, block: 10, dodge: 10, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 20, characteristic: 'strength', mult: 1 } },
      supreme: { cm: 20, attack: 0, block: 20, dodge: 20, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 30, characteristic: 'strength', mult: 1 } },
    },
    special: { base: 'Bono de +1 a los controles para defenderse de Presa y Derribo', advanced: 'Bono de +3 a los controles para defenderse de Presa y Derribo', supreme: 'Bono +3 Presa y Derribo. Cada turno puede repetir control para evitar Presa o Derribo' }, requirements: {}
  },
  kempo: {
    name: 'Kempo', type: 'basic',
    grades: {
      base: { cm: 0, attack: 0, block: 0, dodge: 0, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 10, characteristic: 'strength', mult: 1 } },
      advanced: { cm: 10, attack: 0, block: 0, dodge: 0, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 20, characteristic: 'strength', mult: 1 } },
      supreme: { cm: 20, attack: 10, block: 0, dodge: 0, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 20, characteristic: 'strength', mult: 1 } },
    },
    special: { base: 'Ataques adicionales con penalizador de -15 a la HA', advanced: 'Ataques adicionales con penalizador de -10 a la HA', supreme: 'Ataques adicionales -10 HA. Número de Ataques adicionales como si tuviera +100 HA' }, requirements: {}
  },
  kuan: {
    name: 'Kuan', type: 'basic',
    grades: {
      base: { cm: 0, attack: 0, block: 0, dodge: 0, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 10, characteristic: 'strength', mult: 1 } },
      advanced: { cm: 10, attack: 0, block: 10, dodge: 0, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 20, characteristic: 'strength', mult: 1 } },
      supreme: { cm: 20, attack: 0, block: 20, dodge: 0, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 20, characteristic: 'strength', mult: 1 } },
    },
    special: { base: 'Mitad de penalizador para parar Proyectiles Lanzados', advanced: 'Mitad de penalizador para parar Proyectiles (Lanzados y Disparados)', supreme: 'Sin penalizador por parar Proyectiles (Lanzados y Disparados)' }, requirements: {}
  },
  kungFu: {
    name: 'Kung Fu', type: 'basic',
    grades: {
      base: { cm: 0, attack: 0, block: 0, dodge: 0, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 20, characteristic: 'strength', mult: 1 } },
      advanced: { cm: 10, attack: 0, block: 0, dodge: 0, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 20, characteristic: 'strength', mult: 1 } },
      supreme: { cm: 20, attack: 0, block: 0, dodge: 0, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 20, characteristic: 'strength', mult: 1 } },
    },
    special: { advanced: 'Bono variable: +10 a Ataque, Parada, Esquiva, Turno o Daño', supreme: 'Bono variable: +20 a Ataque, Parada, Esquiva, Turno o Daño' }, requirements: {}
  },
  lama: {
    name: 'Lama', type: 'basic',
    grades: {
      base: { cm: 0, attack: 0, block: 10, dodge: 10, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 10, characteristic: 'strength', mult: 1 } },
      advanced: { cm: 10, attack: 0, block: 10, dodge: 10, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 20, characteristic: 'strength', mult: 1 } },
      supreme: { cm: 20, attack: 0, block: 20, dodge: 20, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 20, characteristic: 'strength', mult: 1 } },
    },
    special: { advanced: 'Permite una defensa adicional sin penalizador', supreme: 'Permite dos defensas adicionales sin penalizador' }, requirements: {}
  },
  mallaYuddha: {
    name: 'Malla-yuddha', type: 'basic',
    grades: {
      base: { cm: 0, attack: 0, block: 0, dodge: 0, turn: 0, sturdiness: 10, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 20, characteristic: 'strength', mult: 1 } },
      advanced: { cm: 10, attack: 0, block: 10, dodge: 0, turn: 0, sturdiness: 10, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 30, characteristic: 'strength', mult: 1 } },
      supreme: { cm: 20, attack: 0, block: 30, dodge: 0, turn: 0, sturdiness: 10, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 40, characteristic: 'strength', mult: 1 } },
    },
    special: { base: 'Bono de +10 a su Entereza al parar ataques con sus manos (aplicado)', advanced: 'No sufre daños por parar ataques con sus manos', supreme: 'Desarmar sin penalizador en contraataque' }, requirements: {}
  },
  moaiThai: {
    name: 'Moai Thai', type: 'basic',
    grades: {
      base: { cm: 0, attack: 0, block: 0, dodge: 0, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 20, characteristic: 'strength', mult: 2 } },
      advanced: { cm: 10, attack: 0, block: 0, dodge: 0, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 20, characteristic: 'strength', mult: 3 } },
      supreme: { cm: 20, attack: 0, block: 0, dodge: 0, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 20, characteristic: 'strength', mult: 4 } },
    },
    special: { supreme: 'Añade +20 al nivel del crítico obtenido' }, requirements: {}
  },
  pankration: {
    name: 'Pankration', type: 'basic',
    grades: {
      base: { cm: 0, attack: 0, block: 0, dodge: 0, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 20, characteristic: 'strength', mult: 1 } },
      advanced: { cm: 10, attack: 0, block: 0, dodge: 0, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 20, characteristic: 'strength', mult: 1 } },
      supreme: { cm: 20, attack: 0, block: 10, dodge: 10, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 20, characteristic: 'strength', mult: 1 } },
    },
    special: { base: 'Mitad de penalizador para Presa', advanced: 'Mitad de penalizador para Presa. Habilidad de combate plena mientras realiza Presa', supreme: 'Mitad penalizador Presa. Combate pleno y chequeo -5 para liberarse mientras apresa' }, requirements: {}
  },
  sambo: {
    name: 'Sambo', type: 'basic',
    grades: {
      base: { cm: 0, attack: 0, block: 0, dodge: 0, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 10, characteristic: 'strength', mult: 1 } },
      advanced: { cm: 10, attack: 0, block: 10, dodge: 0, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 20, characteristic: 'strength', mult: 1 } },
      supreme: { cm: 20, attack: 0, block: 20, dodge: 0, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 30, characteristic: 'strength', mult: 1 } },
    },
    special: { base: 'Mitad de penalizador: Derribo y Desarmar', advanced: 'Mitad de penalizador: Derribo, Desarmar, Presa y Ataque en Área', supreme: 'Mitad de penalizador: Derribo, Desarmar, Presa, Ataque en Área y Ataques Apuntados' }, requirements: {}
  },
  shotokan: {
    name: 'Shotokan', type: 'basic',
    grades: {
      base: { cm: 0, attack: 5, block: 0, dodge: 0, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 20, characteristic: 'strength', mult: 1 } },
      advanced: { cm: 10, attack: 10, block: 0, dodge: 0, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 30, characteristic: 'strength', mult: 1 } },
      supreme: { cm: 20, attack: 20, block: 0, dodge: 0, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 50, characteristic: 'strength', mult: 1 } },
    },
    special: {}, requirements: {}
  },
  sooBahk: {
    name: 'Soo Bahk', type: 'basic',
    grades: {
      base: { cm: 0, attack: 0, block: 0, dodge: 0, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 10, characteristic: 'strength', mult: 1 } },
      advanced: { cm: 10, attack: 0, block: 10, dodge: 10, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 20, characteristic: 'strength', mult: 1 } },
      supreme: { cm: 20, attack: 0, block: 20, dodge: 20, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 30, characteristic: 'strength', mult: 1 } },
    },
    special: { base: 'Mitad de penalizador por Flanco', advanced: 'Sin penalizador por Flanco', supreme: 'Sin penalizador por Flanco y Derribado' }, requirements: {}
  },
  taeKwonDo: {
    name: 'Tae Kwon Do', type: 'basic',
    grades: {
      base: { cm: 0, attack: 0, block: 0, dodge: 0, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 10, characteristic: 'strength', mult: 1 } },
      advanced: { cm: 10, attack: 0, block: 0, dodge: 0, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 20, characteristic: 'strength', mult: 1 } },
      supreme: { cm: 20, attack: 0, block: 0, dodge: 0, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 20, characteristic: 'strength', mult: 1 } },
    },
    special: { base: 'Ataque adicional, incluso tras atacar con armas al -30', advanced: 'Ataque adicional, incluso tras atacar con armas al -20', supreme: 'Ataque adicional, incluso tras atacar con armas, sin penalizador' }, requirements: {}
  },
  taiChi: {
    name: 'Tai Chi', type: 'basic',
    grades: {
      base: { cm: 10, attack: 0, block: 0, dodge: 0, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 20, characteristic: 'power', mult: 1 } },
      advanced: { cm: 30, attack: 0, block: 0, dodge: 0, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 20, characteristic: 'power', mult: 2 } },
      supreme: { cm: 60, attack: 0, block: 0, dodge: 0, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 20, characteristic: 'power', mult: 2 } },
    },
    special: {}, requirements: {}
  },
  xingQuan: {
    name: 'Xing Quan', type: 'basic',
    grades: {
      base: { cm: 0, attack: 0, block: 0, dodge: 0, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 10, characteristic: 'strength', mult: 1 } },
      advanced: { cm: 10, attack: 0, block: 0, dodge: 0, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 20, characteristic: 'strength', mult: 1 } },
      supreme: { cm: 20, attack: 0, block: 0, dodge: 0, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 30, characteristic: 'strength', mult: 1 } },
    },
    special: { base: 'Bono de +10 a HA si lleva la iniciativa y declara ataque único', advanced: 'Bono de +20 a HA si lleva la iniciativa y declara ataque único', supreme: 'Bono de +30 a HA si lleva la iniciativa y declara ataque único' }, requirements: {}
  },
  asakusen: {
    name: 'Asakusen', type: 'advanced',
    grades: {
      base: { cm: 10, attack: 10, block: 10, dodge: 10, turn: 10, sturdiness: 0, breakage: 0, damageBonus: 10, masterAttack: 0, masterDefense: 0, damageBase: { base: 0, characteristic: null, mult: 0 } },
      arcane: { cm: 20, attack: 10, block: 10, dodge: 10, turn: 10, sturdiness: 0, breakage: 0, damageBonus: 10, masterAttack: 10, masterDefense: 10, damageBase: { base: 0, characteristic: null, mult: 0 } },
    },
    special: { arcane: 'Sustituye bono de Kung Fu por +40. +20 al Crítico si Apuntado' }, requirements: {}
  },
  dumah: {
    name: 'Dumah', type: 'advanced',
    grades: {
      base: { cm: 10, attack: 20, block: 0, dodge: 0, turn: 0, sturdiness: 0, breakage: 10, damageBonus: 10, masterAttack: 0, masterDefense: 0, damageBase: { base: 0, characteristic: null, mult: 0 } },
      arcane: { cm: 20, attack: 20, block: 0, dodge: 0, turn: 0, sturdiness: 0, breakage: 25, damageBonus: 20, masterAttack: 20, masterDefense: 0, damageBase: { base: 0, characteristic: null, mult: 0 } },
    },
    special: { base: '-2 TA enemiga y +10 a la Rotura (aplicado)', arcane: '-6 TA enemiga y +25 a la Rotura (aplicado). Desangramiento directo' }, requirements: {}
  },
  emp: {
    name: 'Emp', type: 'advanced',
    grades: {
      base: { cm: 10, attack: 20, block: 0, dodge: 0, turn: 10, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 0, characteristic: null, mult: 0 } },
      arcane: { cm: 20, attack: 20, block: 0, dodge: 0, turn: 20, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 20, masterDefense: 0, damageBase: { base: 0, characteristic: null, mult: 0 } },
    },
    special: { base: 'Desarmar sin penalizador y con +3 a los controles enfrentados', arcane: 'Desarmar bono +3 y sin penalizador. Chequeo de Desarmar en cada Parada con éxito' }, requirements: {}
  },
  enuth: {
    name: 'Enuth', type: 'advanced',
    grades: {
      base: { cm: 10, attack: 0, block: 20, dodge: 20, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 0, characteristic: null, mult: 0 } },
      arcane: { cm: 20, attack: 0, block: 20, dodge: 20, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 15, masterDefense: 15, damageBase: { base: 0, characteristic: null, mult: 0 } },
    },
    special: { base: 'Nivel crítico +20 declarando Inconsciencia. Puede reducir daño', arcane: 'Golpe de Inconsciencia automático y +50 al Crítico. Puede reducir daño. Cálculo vida' }, requirements: {}
  },
  exelion: {
    name: 'Exelion', type: 'advanced',
    grades: {
      base: { cm: 15, attack: 10, block: 0, dodge: 0, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 0, characteristic: null, mult: 0, special: 'exelion' } },
      arcane: { cm: 35, attack: 10, block: 0, dodge: 0, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 25, masterDefense: 0, damageBase: { base: 0, characteristic: null, mult: 0, special: 'exelion' } },
    },
    special: { base: 'Daño no modificable de ninguna manera', arcane: 'Daño no modificable de ninguna manera' }, requirements: {}
  },
  godhand: {
    name: 'Godhand', type: 'advanced',
    grades: {
      base: { cm: 10, attack: 10, block: 0, dodge: 0, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 0, characteristic: null, mult: 0 } },
      arcane: { cm: 20, attack: 10, block: 0, dodge: 0, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 15, masterDefense: 0, damageBase: { base: 0, characteristic: null, mult: 0 } },
    },
    special: { base: 'Sacrifica 1 Ataque: +30 HA, +50 Daño primero del siguiente turno', arcane: 'Sacrifica 1 Ataque: +60 HA, +100 Daño primero del siguiente turno' }, requirements: {}
  },
  hakyoukuken: {
    name: 'Hakyoukuken', type: 'advanced',
    grades: {
      base: { cm: 10, attack: 10, block: 0, dodge: 0, turn: 20, sturdiness: 0, breakage: 0, damageBonus: 20, masterAttack: 0, masterDefense: 0, damageBase: { base: 0, characteristic: null, mult: 0 } },
      arcane: { cm: 20, attack: 10, block: 0, dodge: 0, turn: 40, sturdiness: 0, breakage: 0, damageBonus: 30, masterAttack: 20, masterDefense: 0, damageBase: { base: 0, characteristic: null, mult: 0 } },
    },
    special: { base: 'Penalizador -2 a las TA blandas y +20 al nivel de Crítico obtenido', arcane: 'Anula las TA blandas. Bono al Crítico aumentado a +40' }, requirements: {}
  },
  hanja: {
    name: 'Hanja', type: 'advanced',
    grades: {
      base: { cm: 10, attack: 0, block: 10, dodge: 10, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 0, characteristic: null, mult: 0 } },
      arcane: { cm: 20, attack: 0, block: 10, dodge: 10, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 20, masterDefense: 0, damageBase: { base: 0, characteristic: null, mult: 0 } },
    },
    special: { base: 'Sin penalizador por Espalda y Espacio reducido', arcane: 'Sin penalizador por Espalda, Espacio reducido, Amenazado y Parálisis menor y parcial' }, requirements: {}
  },
  lamaTsu: {
    name: 'Lama Tsu', type: 'advanced',
    grades: {
      base: { cm: 10, attack: 0, block: 20, dodge: 20, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 0, characteristic: null, mult: 0 } },
      arcane: { cm: 20, attack: 0, block: 20, dodge: 20, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 20, damageBase: { base: 0, characteristic: null, mult: 0 } },
    },
    special: { base: 'Añade 2 defensas adicionales sin penalizador', arcane: 'Nunca aplica penalizador por defensas adicionales' }, requirements: {}
  },
  melkaiah: {
    name: 'Melkaiah', type: 'advanced',
    grades: {
      base: { cm: 10, attack: 10, block: 0, dodge: 0, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 0, characteristic: null, mult: 0 } },
      arcane: { cm: 20, attack: 10, block: 0, dodge: 0, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 10, masterDefense: 10, damageBase: { base: 0, characteristic: null, mult: 0 } },
    },
    special: { base: 'Bono +3 a controles enfrentados para Presa y Derribo', arcane: 'Bono +3 Presa y Derribo. +50 a Ataque Completo (Presa). +3 a Aplastar y Estrangular' }, requirements: {}
  },
  mushin: {
    name: 'Mushin', type: 'advanced',
    grades: {
      base: { cm: 15, attack: 10, block: 0, dodge: 0, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 0, characteristic: null, mult: 0 } },
      arcane: { cm: 30, attack: 10, block: 0, dodge: 0, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 20, masterDefense: 0, damageBase: { base: 0, characteristic: null, mult: 0 } },
    },
    special: { base: 'RF Daño+20 (Max 220): penalizador igual al Fracaso, daño 2xFracaso', arcane: 'RF Daño+40 (Max 240): penalizador = Fracaso, daño = 2xFracaso. Puntos de presión' }, requirements: {}
  },
  rexFrame: {
    name: 'Rex Frame', type: 'advanced',
    grades: {
      base: { cm: 10, attack: 0, block: 10, dodge: 10, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 0, characteristic: null, mult: 0 } },
      arcane: { cm: 30, attack: 0, block: 10, dodge: 10, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 20, damageBase: { base: 0, characteristic: null, mult: 0 } },
    },
    special: { base: 'TA 3 contra todo. Barrera de Daño 60', arcane: 'TA 6 contra todo. Barrera de Daño 200' }, requirements: {}
  },
  selene: {
    name: 'Selene', type: 'advanced',
    grades: {
      base: { cm: 10, attack: 0, block: 20, dodge: 20, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 0, characteristic: null, mult: 0 } },
      arcane: { cm: 20, attack: 0, block: 20, dodge: 20, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 20, damageBase: { base: 0, characteristic: null, mult: 0 } },
    },
    special: { base: 'Dobla el bono de contraataque con Artes Marciales', arcane: 'Dobla bono de contraataque. Defensa con éxito contraataque automático' }, requirements: {}
  },
  seraphite: {
    name: 'Seraphite', type: 'advanced',
    grades: {
      base: { cm: 10, attack: 20, block: 0, dodge: 0, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 10, masterAttack: 0, masterDefense: 0, damageBase: { base: 0, characteristic: null, mult: 0 } },
      arcane: { cm: 20, attack: 20, block: 0, dodge: 0, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 10, masterAttack: 20, masterDefense: 0, damageBase: { base: 0, characteristic: null, mult: 0 } },
    },
    special: { base: 'Bono opcional de +20 al Ataque, -30 a Defensa', arcane: 'Bono opcional de +30 al Ataque, -50 a Defensa: No pierde acción' }, requirements: {}
  },
  shephon: {
    name: 'Shephon', type: 'advanced',
    grades: {
      base: { cm: 10, attack: 0, block: 20, dodge: 20, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 0, characteristic: null, mult: 0 } },
      arcane: { cm: 20, attack: 0, block: 20, dodge: 20, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 20, damageBase: { base: 0, characteristic: null, mult: 0 } },
    },
    special: { base: 'Defensa Total concede un bono de +60', arcane: 'Defensa Total concede un bono de +100' }, requirements: {}
  },
  suyanta: {
    name: 'Suyanta', type: 'advanced',
    grades: {
      base: { cm: 15, attack: 10, block: 0, dodge: 0, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 0, characteristic: null, mult: 0 } },
      arcane: { cm: 35, attack: 10, block: 0, dodge: 0, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 15, masterDefense: 0, damageBase: { base: 0, characteristic: null, mult: 0 } },
    },
    special: { base: 'Puede escoger dañar la reserva de Ki en lugar de quitar PVs', arcane: 'Daña a la vez la reserva de Ki y sus PVs' }, requirements: {}
  },
  velez: {
    name: 'Velez', type: 'advanced',
    grades: {
      base: { cm: 20, attack: 0, block: 20, dodge: 20, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 0, damageBase: { base: 0, characteristic: null, mult: 0 } },
      arcane: { cm: 40, attack: 0, block: 20, dodge: 20, turn: 0, sturdiness: 0, breakage: 0, damageBonus: 0, masterAttack: 0, masterDefense: 15, damageBase: { base: 0, characteristic: null, mult: 0 } },
    },
    special: { arcane: 'Ataques intangibles de Energía. Permite usar POD para chequeos' }, requirements: {}
  },
};

export const MARTIAL_ART_IDS = ['aikido', 'boxeo', 'capoeira', 'grappling', 'kardad', 'kempo', 'kuan', 'kungFu', 'lama', 'mallaYuddha', 'moaiThai', 'pankration', 'sambo', 'shotokan', 'sooBahk', 'taeKwonDo', 'taiChi', 'xingQuan', 'asakusen', 'dumah', 'emp', 'enuth', 'exelion', 'godhand', 'hakyoukuken', 'hanja', 'lamaTsu', 'melkaiah', 'mushin', 'rexFrame', 'selene', 'seraphite', 'shephon', 'suyanta', 'velez'];

export const MARTIAL_ART_GRADES = {
  basic: ['base', 'advanced', 'supreme'],
  advanced: ['base', 'arcane']
};
