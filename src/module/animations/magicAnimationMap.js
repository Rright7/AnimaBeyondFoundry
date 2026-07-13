/**
 * Mapa contexto -> animacion para MAGIA y PSIQUICA (JB2A via Sequencer).
 *
 * AUTO-GENERADO por el workflow "jb2a-magic-mapping": 9 agentes leyeron la base de datos
 * REAL de JB2A instalada (free + Complete Collection) y eligieron los mejores efectos por
 * elemento y rol; una sintesis los fusiono. TODOS los fallbacks free (ultimo de cada array)
 * fueron verificados con grep contra animations_flat.json (120 claves, 0 no-op).
 *
 * Cada valor = array de candidatos: patreon-primero (mas rico), fallback free al final.
 * AnimationService.playEffect usa el PRIMERO que exista (Sequencer.Database.entryExists), asi
 * que el patreon enriquece y, si falta, cae al free. Los IDs de proyectil sin sufijo de
 * distancia son "carpetas" que stretchTo resuelve a la variante .Xft correcta.
 *
 * Roles por elemento: cast (circulo de lanzamiento), proj (proyectil lanzador->objetivo),
 * impact (impacto puntual), explosion (detonacion de area), aura (persistente), shield (defensa).
 * Cuando un elemento no tiene un rol, se cae al generico del rol (<rol>Generic).
 */
export const MAGIC_ANIMATION_MAP = {
  "castFire": ["jb2a.cast_generic.fire.01.orange","jb2a.cast_generic.fire.side01.orange","jb2a.magic_signs.circle.02.evocation.loop.red"],
  "projFire": ["jb2a.fire_bolt.dark_red","jb2a.fireball.beam.dark_red","jb2a.fire_bolt.orange","jb2a.scorching_ray.01.orange"],
  "impactFire": ["jb2a.impact.fire.01.orange"],
  "explosionFire": ["jb2a.fireball.explosion.dark_red","jb2a.fireball.explosion.orange","jb2a.explosion.08.orange"],
  "auraFire": ["jb2a.markers.on_token_mask.loop.01.orange","jb2a.flames.orange.01"],
  "shieldFire": ["jb2a.shield_themed.above.fire.01.orange","jb2a.shield_themed.below.fire.01.orange"],
  "castIce": ["jb2a.template_circle.symbol.normal.snowflake.blue","jb2a.cast_generic.02.blue","jb2a.cast_generic.03.blue"],
  "projIce": ["jb2a.spell_projectile.ice_shard.blue","jb2a.spell_projectile.ice_shard.blue.30ft"],
  "impactIce": ["jb2a.impact_themed.ice_shard.blue","jb2a.impact.frost.white.01","jb2a.impact.002.blue"],
  "explosionIce": ["jb2a.ice_spikes.radial.burst.blue","jb2a.ice_spikes.radial.burst.white","jb2a.explosion.04.blue"],
  "auraIce": ["jb2a.markers.snowflake.blue.01","jb2a.sleet_storm.blue"],
  "shieldIce": ["jb2a.shield_themed.above.ice.01.blue","jb2a.shield_themed.below.ice.01.blue"],
  "castWater": ["jb2a.cast_generic.water.02.blue","jb2a.cast_generic.02.blue"],
  "projWater": ["jb2a.ray_of_frost.blue","jb2a.ray_of_frost.blue.30ft"],
  "impactWater": ["jb2a.impact.water.02.blue","jb2a.liquid.splash.blue","jb2a.impact.002.blue"],
  "explosionWater": ["jb2a.water_splash.circle.01.blue","jb2a.explosion.02.blue"],
  "auraWater": ["jb2a.bubble.001.001.loop.blue","jb2a.liquid.blob.blue"],
  "shieldWater": ["jb2a.bubble.002.002.complete.blue","jb2a.shield_themed.above.ice.01.blue"],
  "castLightning": ["jb2a.static_electricity.03.purple","jb2a.template_circle.lightning.01.loop.bluepurple","jb2a.static_electricity.01.blue"],
  "projLightning": ["jb2a.lightning_bolt.narrow.purple","jb2a.lightning_bolt.wide.blue","jb2a.lightning_bolt.narrow.blue"],
  "impactLightning": ["jb2a.lightning_strike.purple","jb2a.lightning_strike.blue"],
  "explosionLightning": ["jb2a.lightning_ball.purple","jb2a.thunderwave.center.dark_purple","jb2a.lightning_ball.blue"],
  "auraLightning": ["jb2a.static_electricity.01.purple","jb2a.static_electricity.01.blue","jb2a.lightning_orb.01.loop.bluepurple"],
  "shieldLightning": ["jb2a.energy_field.02.above.purple","jb2a.energy_field.01.blue","jb2a.shield.01.loop.blue"],
  "castWind": ["jb2a.wind_lines.01.01.white","jb2a.swirling_leaves.loop.01.green"],
  "projWind": ["jb2a.swirling_leaves.ranged.greenorange","jb2a.swirling_leaves.ranged.greenorange.30ft","jb2a.gust_of_wind.default"],
  "impactWind": ["jb2a.whirlwind.bluewhite","jb2a.whirlwind.bluegrey"],
  "explosionWind": ["jb2a.swirling_leaves.outburst.01.pink","jb2a.swirling_feathers.outburst.01.textured"],
  "auraWind": ["jb2a.whirlwind.bluewhite","jb2a.swirling_leaves.loop.01.green","jb2a.whirlwind.bluegrey"],
  "shieldWind": ["jb2a.wind_wall.200x100","jb2a.swirling_leaves.loop.02.green"],
  "castEarth": ["jb2a.cast_generic.earth.01.browngreen","jb2a.magic_signs.circle.02.transmutation.complete.yellow"],
  "projEarth": ["jb2a.boulder.toss.02.01.stone.brown"],
  "impactEarth": ["jb2a.impact.ground_crack.orange.01","jb2a.impact.010.orange"],
  "explosionEarth": ["jb2a.eruption.orange","jb2a.eruption.orange.01","jb2a.ground_cracks.orange.01"],
  "auraEarth": ["jb2a.ground_cracks.orange","jb2a.ground_cracks.orange.01"],
  "shieldEarth": ["jb2a.shield_themed.above.molten_earth.01.dark_orange","jb2a.shield_themed.above.molten_earth.01.orange","jb2a.shield_themed.below.molten_earth.01.orange"],
  "castNature": ["jb2a.cast_generic.earth.01.browngreen","jb2a.magic_signs.circle.02.necromancy.loop.green"],
  "projNature": ["jb2a.swirling_leaves.ranged.greenorange"],
  "impactNature": ["jb2a.swirling_leaves.outburst.01.greenorange","jb2a.swirling_leaves.complete.01.green"],
  "explosionNature": ["jb2a.entangle.green02","jb2a.entangle.green","jb2a.entangle.02.complete.02.green","jb2a.plant_growth.03.round.4x4.complete.greenyellow"],
  "auraNature": ["jb2a.entangle.02.loop.02.green","jb2a.plant_growth.03.round.2x2.loop.greenyellow","jb2a.vine.loop.nature.single.01.green"],
  "shieldNature": ["jb2a.vine.complete.nature.group.01.green","jb2a.template_circle.symbol.normal.shield.green"],
  "castLight": ["jb2a.magic_signs.circle.02.conjuration.intro.yellow","jb2a.bless.400px.intro.yellow","jb2a.magic_signs.circle.02.conjuration.complete.yellow"],
  "projLight": ["jb2a.guiding_bolt.01.yellow","jb2a.guiding_bolt.01.blueyellow","jb2a.guiding_bolt.01.blueyellow.30ft"],
  "impactLight": ["jb2a.divine_smite.target.yellowwhite","jb2a.sacred_flame.target.yellow","jb2a.divine_smite.target.blueyellow"],
  "explosionLight": ["jb2a.healing_generic.burst.yellowwhite","jb2a.explosion.03.blueyellow"],
  "auraLight": ["jb2a.spirit_guardians.blueyellow.ring","jb2a.bless.400px.loop.yellow"],
  "shieldLight": ["jb2a.shield.01.loop.yellow","jb2a.shield.01.loop.white","jb2a.shield.01.loop.blue"],
  "castHeal": ["jb2a.magic_signs.circle.02.conjuration.intro.yellow","jb2a.bless.400px.intro.yellow"],
  "impactHeal": ["jb2a.cure_wounds.400px.yellow","jb2a.healing_generic.400px.green","jb2a.healing_generic.400px.yellow"],
  "explosionHeal": ["jb2a.healing_generic.03.burst.yellow","jb2a.healing_generic.burst.yellowwhite","jb2a.healing_generic.burst.greenorange"],
  "auraHeal": ["jb2a.healing_generic.loop.yellowwhite","jb2a.healing_generic.loop.greenorange"],
  "castDark": ["jb2a.magic_signs.circle.02.illusion.complete.dark_purple","jb2a.magic_signs.circle.02.illusion.complete.purple"],
  "projDark": ["jb2a.eldritch_blast.dark_purple","jb2a.eldritch_blast.purple","jb2a.magic_missile.purple"],
  "impactDark": ["jb2a.explosion.dark_purple","jb2a.arms_of_hadar.dark_purple"],
  "explosionDark": ["jb2a.explosion.dark_purple","jb2a.black_tentacles.dark_purple","jb2a.explosion.shrapnel.bomb.01.black"],
  "auraDark": ["jb2a.darkness.black","jb2a.markers.smoke.ring.loop.bluepurple"],
  "shieldDark": ["jb2a.shield_themed.above.eldritch_web.01.dark_purple"],
  "castNecrotic": ["jb2a.magic_signs.circle.02.necromancy.complete.dark_green","jb2a.magic_signs.circle.02.necromancy.complete.green","jb2a.extras.tmfx.runes.circle.simple.necromancy"],
  "projNecrotic": ["jb2a.eldritch_blast.dark_green","jb2a.disintegrate.green"],
  "impactNecrotic": ["jb2a.toll_the_dead.green.complete","jb2a.toll_the_dead.green.skull_smoke"],
  "explosionNecrotic": ["jb2a.explosion.green","jb2a.black_tentacles.dark_green","jb2a.toll_the_dead.green.shockwave"],
  "auraNecrotic": ["jb2a.magic_signs.circle.02.necromancy.loop.dark_green","jb2a.magic_signs.circle.02.necromancy.loop.green"],
  "shieldNecrotic": ["jb2a.shield_themed.above.eldritch_web.01.dark_green","jb2a.shield_themed.above.eldritch_web.01.dark_purple"],
  "castBlood": ["jb2a.magic_signs.circle.02.evocation.complete.dark_red","jb2a.magic_signs.circle.02.evocation.complete.red"],
  "projBlood": ["jb2a.eldritch_blast.dark_red","jb2a.magic_missile.dark_red","jb2a.disintegrate.dark_red","jb2a.lasershot.red"],
  "impactBlood": ["jb2a.impact.dark.01.red","jb2a.liquid.splash02.red","jb2a.liquid.splash_side02.red"],
  "explosionBlood": ["jb2a.explosion.dark_red","jb2a.explosion.red","jb2a.arms_of_hadar.dark_red","jb2a.liquid.splash02.red"],
  "auraBlood": ["jb2a.condition.curse.01.001.red"],
  "shieldBlood": ["jb2a.shield_themed.above.eldritch_web.01.dark_purple"],
  "castArcane": ["jb2a.magic_signs.circle.02.illusion.complete.purple","jb2a.cast_generic.03.blue","jb2a.cast_generic.02.blue"],
  "projArcane": ["jb2a.eldritch_blast.dark_purple","jb2a.magic_missile.purple","jb2a.eldritch_blast.purple"],
  "impactArcane": ["jb2a.energy_attack.01.purple","jb2a.energy_attack.01.blue"],
  "explosionArcane": ["jb2a.explosion.02.blue","jb2a.particle_burst.01.circle.bluepurple"],
  "auraArcane": ["jb2a.energy_field.01.blue","jb2a.magic_signs.circle.02.illusion.loop.purple"],
  "shieldArcane": ["jb2a.shield.01.complete.01.purple","jb2a.wall_of_force.sphere.grey","jb2a.shield.01.complete.01.blue"],
  "castIllusion": ["jb2a.magic_signs.circle.02.illusion.complete.purple","jb2a.misty_step.01.blue","jb2a.detect_magic.circle.blue"],
  "projIllusion": ["jb2a.eldritch_blast.dark_purple","jb2a.eldritch_blast.purple"],
  "impactIllusion": ["jb2a.shimmer.01.blue","jb2a.impact.004.blue"],
  "explosionIllusion": ["jb2a.swirling_sparkles.01.blue","jb2a.particle_burst.01.circle.bluepurple"],
  "auraIllusion": ["jb2a.detect_magic.circle.blue","jb2a.shimmer.01.blue"],
  "shieldIllusion": ["jb2a.shield.01.complete.01.purple","jb2a.shield.01.complete.01.blue"],
  "castSound": ["jb2a.cast_generic.sound.01.pinkteal","jb2a.music_notations.treble_clef.blue"],
  "projSound": ["jb2a.eldritch_blast.purple"],
  "impactSound": ["jb2a.soundwave.01.purple","jb2a.soundwave.01.blue"],
  "explosionSound": ["jb2a.soundwave.02.purple","jb2a.soundwave.02.blue"],
  "auraSound": ["jb2a.bardic_inspiration.greenorange","jb2a.music_notations.treble_clef.blue"],
  "shieldSound": ["jb2a.shield.01.complete.01.purple","jb2a.shield.01.complete.01.blue"],
  "castDreams": ["jb2a.butterflies.inward.01.bluepurple","jb2a.cast_generic.02.blue"],
  "projDreams": ["jb2a.eldritch_blast.purple"],
  "impactDreams": ["jb2a.sleep.symbol.pink","jb2a.twinkling_stars.points07.white"],
  "explosionDreams": ["jb2a.butterflies.outward_burst.01.bluepurple","jb2a.fairies.outward_burst.01.bluepurple"],
  "auraDreams": ["jb2a.fairies.loop.01.bluepurple","jb2a.butterflies.loop.01.bluepurple"],
  "shieldDreams": ["jb2a.shield.01.complete.01.purple","jb2a.shield.01.complete.01.blue"],
  "castForce": ["jb2a.magic_signs.circle.02.abjuration.intro.blue","jb2a.magic_signs.circle.02.abjuration.loop.blue"],
  "projForce": ["jb2a.energy_strands.range.standard.purple.01","jb2a.energy_strands.range.standard.purple.01.30ft"],
  "impactForce": ["jb2a.impact.011.blue","jb2a.impact.004.blue"],
  "explosionForce": ["jb2a.thunderwave.center.blue"],
  "auraForce": ["jb2a.arcane_hand.cold.purple","jb2a.arcane_hand.purple"],
  "shieldForce": ["jb2a.wall_of_force.sphere.grey"],
  "castEnergy": ["jb2a.cast_generic.02.blue","jb2a.cast_generic.03.blue"],
  "projEnergy": ["jb2a.energy_beam.normal.bluepink.03","jb2a.energy_beam.normal.blue.01","jb2a.energy_beam.normal.blue.01.30ft"],
  "impactEnergy": ["jb2a.energy_attack.01.blue"],
  "explosionEnergy": ["jb2a.explosion.02.blue","jb2a.explosion.04.blue"],
  "auraEnergy": ["jb2a.energy_field.01.blue"],
  "shieldEnergy": ["jb2a.energy_field.02.above.blue","jb2a.energy_field.02.below.blue"],
  "castMind": ["jb2a.magic_signs.circle.02.enchantment.intro.pink","jb2a.magic_signs.circle.02.enchantment.loop.pink"],
  "projMind": ["jb2a.eldritch_blast.dark_purple","jb2a.magic_missile.purple","jb2a.magic_missile.purple.30ft"],
  "impactMind": ["jb2a.dizzy_stars.200px.blueorange"],
  "explosionMind": ["jb2a.dizzy_stars.400px.blueorange"],
  "auraMind": ["jb2a.sleep.symbol.pink","jb2a.sleep.target.pink"],
  "castPhysical": ["jb2a.magic_signs.circle.02.transmutation.intro.yellow","jb2a.magic_signs.circle.02.transmutation.loop.yellow"],
  "auraPhysical": ["jb2a.bless.400px.loop.yellow","jb2a.condition.boon.01.001.green"],
  "castGeneric": ["jb2a.cast_generic.02.dark_purple","jb2a.cast_generic.01.dark_purple","jb2a.cast_generic.03.blue","jb2a.cast_generic.02.blue","jb2a.magic_signs.circle.02.divination.complete"],
  "projGeneric": ["jb2a.magic_missile.grey","jb2a.magic_missile.blue","jb2a.magic_missile.purple","jb2a.ranged.03.projectile.01.bluegreen"],
  "impactGeneric": ["jb2a.impact.004.dark_purple","jb2a.impact.002.orange","jb2a.impact.004.blue","jb2a.impact.002.blue"],
  "explosionGeneric": ["jb2a.explosion.02.orange","jb2a.explosion.04.dark_purple","jb2a.explosion.01.orange","jb2a.explosion.02.blue"],
  "shieldGeneric": ["jb2a.shield.02.complete.01.blue","jb2a.shield.01.complete.01.blue","jb2a.energy_field.01.blue"],
  "auraGeneric": ["jb2a.energy_field.02.above.blue","jb2a.shield.01.loop.blue"],
  "templateArea": ["jb2a.template_circle.aura.03.outward.001.loop.combined.blue","jb2a.template_circle.out_pulse.01.loop.bluewhite","jb2a.detect_magic.circle.blue"]
};

// Tipo de dano ESPECIFICO -> elemento visual. Solo heat/cold/electricity mandan sobre la via
// (son inequivocos: fuego/hielo/rayo). 'energy' (dano magico generico, ~80% de los conjuros de
// ataque) NO se mapea aqui a proposito: cae a la VIA, que es el elemento tematico real
// (necromancia->necrotico, luz->luz, oscuridad->sombra, agua->agua...). Antes 'energy'->'arcane'
// hacia que casi todos los conjuros compartieran la misma animacion. cut/thrust/impact = fisico.
const DAMAGE_TYPE_TO_ELEMENT = {
  "heat": "fire",
  "cold": "ice",
  "electricity": "lightning"
};

// Las 26 vias magicas -> elemento visual.
const VIA_TO_ELEMENT = {
  "air": "wind",
  "blood": "blood",
  "chaos": "arcane",
  "creation": "arcane",
  "darkness": "dark",
  "death": "necrotic",
  "destruction": "arcane",
  "dreams": "dreams",
  "earth": "earth",
  "emptiness": "arcane",
  "essence": "arcane",
  "fire": "fire",
  "freeAccess": "arcane",
  "illusion": "illusion",
  "knowledge": "arcane",
  "light": "light",
  "literae": "arcane",
  "musical": "sound",
  "necromancy": "necrotic",
  "nobility": "arcane",
  "peace": "arcane",
  "sin": "arcane",
  "threshold": "arcane",
  "time": "arcane",
  "war": "arcane",
  "water": "water"
};

// Las 9 disciplinas psiquicas -> elemento visual.
const PSYCHIC_DISCIPLINE_TO_ELEMENT = {
  "matrixPowers": "mind",
  "telepathy": "mind",
  "telekenisis": "force",
  "pyrokinesis": "fire",
  "cryokinesis": "ice",
  "energy": "energy",
  "telemetry": "mind",
  "sentient": "mind",
  "physicalIncrease": "physical"
};

// Tinte de color por VIA ABSTRACTA (adicion manual, no viene del workflow). Todas las vias
// abstractas comparten los efectos 'arcane' (morado neutro); este tinte las diferencia ligando
// cada concepto a un color, sin necesidad de assets dedicados. Las vias con elemento propio
// (fire, necromancy, light, water...) NO se tinen: ya tienen su color. freeAccess = sin tinte
// (arcano neutro, es un cajon de sastre).
const VIA_TINT = {
  destruction: '#ff4433', // rojo — destruccion
  war: '#ff7a1a', // naranja — guerra
  sin: '#a3123a', // carmesi oscuro — pecado
  chaos: '#ff2fb0', // magenta — caos
  creation: '#39d353', // verde — creacion / vida
  essence: '#25d0c0', // turquesa — esencia
  knowledge: '#2f8cff', // azul — conocimiento
  peace: '#9ad0ff', // azul claro — paz
  time: '#ffb020', // ambar — tiempo
  nobility: '#e8c33a', // oro — nobleza
  threshold: '#7b5cff', // indigo — umbral
  emptiness: '#8a8f98', // gris — vacio
  literae: '#c07bff' // purpura claro — letras / runas
};

// Fallback generico por rol cuando el elemento no define ese rol.
const ROLE_GENERIC = {
  cast: 'castGeneric',
  proj: 'projGeneric',
  impact: 'impactGeneric',
  explosion: 'explosionGeneric',
  shield: 'shieldGeneric',
  aura: 'auraGeneric'
};

/**
 * Elemento visual segun el contexto del conjuro/poder.
 * Prioridad: disciplina psiquica > dano ESPECIFICO (heat->fuego, cold->hielo, electricity->rayo) > via.
 * El dano 'energy' (generico) NO manda: cae a la via, que es el elemento tematico real del conjuro.
 * Sin via reconocible -> 'arcane' (default neutro morado/azul).
 */
export function magicElementFor({ via, damageType, psychicDiscipline } = {}) {
  if (psychicDiscipline) return PSYCHIC_DISCIPLINE_TO_ELEMENT[psychicDiscipline] || 'arcane';
  const byDamage = DAMAGE_TYPE_TO_ELEMENT[damageType];
  if (byDamage) return byDamage;
  return VIA_TO_ELEMENT[via] || 'arcane';
}

/**
 * IDs (array de candidatos) para un (elemento, rol). Si el elemento no define el rol, cae al
 * generico del rol. role: 'cast' | 'proj' | 'impact' | 'explosion' | 'aura' | 'shield'.
 */
export function magicEffectFor(element, role) {
  if (!element) return null;
  const key = role + element.charAt(0).toUpperCase() + element.slice(1);
  if (MAGIC_ANIMATION_MAP[key]) return MAGIC_ANIMATION_MAP[key];
  const generic = ROLE_GENERIC[role];
  return generic ? MAGIC_ANIMATION_MAP[generic] ?? null : null;
}

/**
 * Color de tinte para diferenciar las vias ABSTRACTAS (que comparten los efectos 'arcane').
 * Solo devuelve color si el elemento resuelto es 'arcane' (asi un conjuro de via abstracta pero
 * con dano especifico -p.ej. destruccion/heat=fuego- NO se tine y conserva su color elemental).
 * @returns {string|undefined} color hex, o undefined si no procede tintar.
 */
export function magicTintFor(via, element) {
  return element === 'arcane' ? VIA_TINT[via] : undefined;
}
