/**
 * Mapa accion semantica de Anima -> ID(s) de Sequencer DB (JB2A).
 *
 * UNICO sitio con rutas de JB2A (los dot-paths son fragiles entre versiones; la DB de
 * JB2A se declara "work in progress"). Cada valor puede ser un ID o un ARRAY de candidatos:
 * AnimationService usa el PRIMERO que exista (effectExists), asi que el patreon enriquece
 * sobre el free sin romper, y si un ID desaparece se cae al siguiente.
 *
 * Para fijar/ajustar IDs: abre el visor de assets en una sesion ->  Sequencer.DatabaseViewer.show()
 * y copia el "Datapath". Truco: quitar el ultimo segmento (color) hace que Sequencer elija
 * una variante aleatoria.
 *
 * Granularidad inicial (decision del usuario): SIMPLE por tipo de tabla (armorType) + el
 * efecto de Cargar Ki. Las demas acciones llegan en fases posteriores.
 */
export const ANIMATION_MAP = {
  // --- Cargar Ki: power-up en dos capas (estilo "concentrar energia") ---
  // 1) Energia que converge hacia el cuerpo. patreon = blue/green/purple/red/yellow;
  //    free solo registra green, asi que el resolver cae a green si no hay patreon.
  kiChargeStrands: [
    'jb2a.energy_strands.in.yellow.01',
    'jb2a.energy_strands.in.blue.01',
    'jb2a.energy_strands.in.green.01'
  ],
  // 2) Circulo de energia ascendente bajo el token (build-up de conjuro).
  kiChargeGround: [
    'jb2a.cast_generic.03.blue',
    'jb2a.cast_generic.02.blue',
    'jb2a.cast_generic.01.yellow',
    'jb2a.energy_field.02.below.blue'
  ],

  // --- Fase 1: impacto en el defensor segun la tabla de dano (armorType) ---
  // patreon (damage-type generics, mas limpios) primero; free verificado como fallback.
  impactCut: [
    'jb2a.melee_generic.slashing.one_handed',
    'jb2a.melee_generic.slash.01.orange',
    'jb2a.sword.melee.01.white'
  ],
  impactThrust: [
    'jb2a.melee_generic.piercing.one_handed',
    'jb2a.spear.melee.01.white'
  ],
  impactImpact: [
    'jb2a.melee_generic.bludgeoning.one_handed',
    'jb2a.melee_attack.02.mace.01',
    'jb2a.impact.010.orange'
  ],
  impactEnergy: [
    'jb2a.energy_attack.01.purple',
    'jb2a.energy_attack.01.orange',
    'jb2a.energy_attack.01.blue'
  ],

  // --- Fase 1: proyectiles (viajan atacante->defensor; Sequencer autoselecciona distancia) ---
  projectileArrow: [
    'jb2a.arrow.physical.orange',
    'jb2a.arrow.physical.blue',
    'jb2a.arrow.physical.white.01'
  ],
  projectileThrown: [
    'jb2a.dagger.throw.01.blue',
    'jb2a.spear.throw.01.white',
    'jb2a.dagger.throw.01.white'
  ],
  projectileEnergy: [
    'jb2a.eldritch_blast.dark_purple',
    'jb2a.eldritch_blast.purple'
  ]

  // --- Pendiente (fases siguientes): critical, bleeding, parry, dodge, spellCast,
  //     psychicAttack, grapple... Ver docs/develop/animaciones-jb2a-plan.md (tabla seccion 4).
};

// Tablas de dano "no fisicas": comparten impacto/proyectil de energia.
const ENERGY_ARMOR_TYPES = new Set(['energy', 'heat', 'cold', 'electricity']);
const IMPACT_BY_ARMOR = { cut: 'impactCut', thrust: 'impactThrust', impact: 'impactImpact' };

/** armorType (tabla de dano) -> clave de impacto. '-'/'' o desconocido -> golpe generico. */
export function impactKeyForArmorType(armorType) {
  if (ENERGY_ARMOR_TYPES.has(armorType)) return 'impactEnergy';
  return IMPACT_BY_ARMOR[armorType] ?? 'impactImpact';
}

/** Tipo de proyectil: energia por tabla, luego arma arrojadiza (throw) o flecha (resto). */
export function projectileKeyFor(armorType, projectileType) {
  if (ENERGY_ARMOR_TYPES.has(armorType)) return 'projectileEnergy';
  if (projectileType === 'throw') return 'projectileThrown';
  return 'projectileArrow';
}

/** Devuelve el/los ID(s) para una accion semantica, o null si no esta mapeada. */
export function effectFor(action) {
  return ANIMATION_MAP[action] ?? null;
}
