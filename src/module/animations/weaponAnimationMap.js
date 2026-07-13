/**
 * Mapa arma -> animacion de ataque JB2A por TIPO (espada, hacha, lanza, arco, arrojar...).
 *
 * AUTO-GENERADO (workflow "jb2a-weapon-mapping") + FILTRADO a ids REALES del JB2A free
 * (animations_flat.json): se eliminaron los ids fantasma que el workflow alucino
 * (melee_generic.slashing/piercing/bludgeoning.* no existen) y los patreon-only, porque
 * Sequencer.Database.entryExists los valida en falso y softFail traga el webm ausente ->
 * animacion invisible. Todos los ids aqui existen en el free (que el usuario tiene), asi que
 * renderizan seguro. El resolver infiere el tipo del NOMBRE (longest-match) + critico.
 */

const KEYWORD_TO_TYPE = {
  "espada": "sword",
  "katana": "sword",
  "wakizashi": "sword",
  "sable": "sword",
  "cimitarra": "sword",
  "estoque": "sword",
  "florete": "sword",
  "falcata": "sword",
  "spatha": "sword",
  "katzbalger": "sword",
  "koncerz": "sword",
  "bracamarte": "sword",
  "ninja": "sword",
  "ninjato": "sword",
  "ninja to": "sword",
  "boku": "sword",
  "bokuto": "sword",
  "boku to": "sword",
  "pata": "sword",
  "escramasajon": "sword",
  "hu die dao": "sword",
  "hu die": "sword",
  "shang gou": "sword",
  "lujiaodao": "sword",
  "ram dao": "sword",
  "bastarda": "sword",
  "mundus": "sword",
  "umbra": "sword",
  "aquarius": "sword",
  "libra": "sword",
  "ophiucos": "sword",
  "scorpio": "sword",
  "mandoble": "greatsword",
  "montante": "greatsword",
  "claymore": "greatsword",
  "nodachi": "greatsword",
  "messer": "greatsword",
  "gosse messer": "greatsword",
  "hacha": "axe",
  "kama": "axe",
  "valaska": "axe",
  "hoz": "axe",
  "hacha a dos manos": "greataxe",
  "dos manos": "greataxe",
  "lanza": "spear",
  "pica": "spear",
  "jabalina": "spear",
  "tridente": "spear",
  "brandistock": "spear",
  "goedendag": "spear",
  "glavius": "spear",
  "aries": "spear",
  "alabarda": "polearm",
  "naginata": "polearm",
  "nagimaki": "polearm",
  "guadana": "polearm",
  "berdiche": "polearm",
  "bec de corbin": "polearm",
  "corbin": "polearm",
  "pudao": "polearm",
  "lajatang": "polearm",
  "kumade": "polearm",
  "sode garami": "polearm",
  "sang kauw": "polearm",
  "anciano": "polearm",
  "maza": "mace",
  "garrote": "mace",
  "chui": "mace",
  "jutte": "mace",
  "tonfa": "mace",
  "tetsubo": "mace",
  "kiseru": "mace",
  "pico": "mace",
  "cuervo": "mace",
  "piscis": "mace",
  "virgo": "mace",
  "martillo": "hammer",
  "martillo de guerra": "warhammer",
  "gran martillo": "warhammer",
  "quebradora": "warhammer",
  "daga": "dagger",
  "cuchillo": "dagger",
  "tanto": "dagger",
  "dirk": "dagger",
  "estilete": "dagger",
  "cinquedea": "dagger",
  "katar": "dagger",
  "kris": "dagger",
  "kukri": "dagger",
  "kerambit": "dagger",
  "kunai": "dagger",
  "sai": "dagger",
  "garfio": "dagger",
  "cadena": "flail",
  "mangual": "flail",
  "mayal": "flail",
  "nunchaku": "flail",
  "kusari": "flail",
  "kusari gama": "flail",
  "kyoketsu": "flail",
  "kau sin ke": "flail",
  "liu xing": "flail",
  "baston": "staff",
  "vara": "staff",
  "palo": "staff",
  "latigo": "whip",
  "urumi": "whip",
  "lazo": "whip",
  "arco": "bow",
  "daikyu": "bow",
  "sagittarius": "bow",
  "ballesta": "crossbow",
  "balista": "crossbow",
  "honda": "sling",
  "cerbatana": "sling",
  "bolas": "thrown",
  "boleadoras": "thrown",
  "bumerang": "thrown",
  "dardos": "thrown",
  "shuriken": "thrown",
  "atlatl": "thrown",
  "red": "thrown",
  "uchi": "thrown",
  "uchine": "thrown",
  "arpon": "thrown",
  "taurus": "thrown",
  "turcus": "thrown",
  "capricornius": "thrown",
  "cancer": "thrown",
  "arcabuz": "firearm",
  "canon": "firearm",
  "pistola": "firearm",
  "rifle": "firearm",
  "desarmado": "unarmed",
  "artes marciales": "unarmed",
  "marciales": "unarmed",
  "cestus": "unarmed",
  "shuko": "unarmed",
  "naturales": "natural",
  "armas naturales": "natural",
  "garras": "natural",
  "antorcha": "improvised",
  "silla": "improvised",
  "botella": "improvised",
  "jarron": "improvised",
  "metalica": "improvised",
  "azada": "improvised",
  "escudo": "shield",
  "rodela": "shield"
};

const CRITIC_FALLBACK = {
  "cut": "sword",
  "thrust": "spear",
  "impact": "mace"
};

const MELEE_BY_TYPE = {
  "sword": [
    "jb2a.melee_attack.01.magic_sword.yellow.01",
    "jb2a.sword.melee.01.white"
  ],
  "greatsword": [
    "jb2a.melee_attack.03.greatsword.01",
    "jb2a.greatsword.melee.standard.white"
  ],
  "axe": [
    "jb2a.melee_attack.02.battleaxe.01",
    "jb2a.handaxe.melee.standard.white"
  ],
  "greataxe": [
    "jb2a.melee_attack.03.greataxe.01",
    "jb2a.greataxe.melee.standard.white"
  ],
  "spear": [
    "jb2a.spear.melee.01.white"
  ],
  "polearm": [
    "jb2a.halberd.melee.01.white",
    "jb2a.glaive.melee.01.white"
  ],
  "mace": [
    "jb2a.melee_attack.02.mace.01",
    "jb2a.mace.melee.01.white"
  ],
  "hammer": [
    "jb2a.melee_attack.02.hammer.01",
    "jb2a.hammer.melee.01.white"
  ],
  "warhammer": [
    "jb2a.melee_attack.02.warhammer.01",
    "jb2a.warhammer.melee.01.white",
    "jb2a.maul.melee.standard.white"
  ],
  "dagger": [
    "jb2a.dagger.melee.02.white"
  ],
  "flail": [
    "jb2a.melee_generic.whirlwind.01.orange",
    "jb2a.mace.melee.01.white"
  ],
  "staff": [
    "jb2a.quarterstaff.melee.01.white"
  ],
  "whip": [
    "jb2a.melee_generic.slash.01.orange"
  ],
  "unarmed": [
    "jb2a.unarmed_strike.physical.02.blue",
    "jb2a.unarmed_strike.physical.01.blue",
    "jb2a.flurry_of_blows.physical.blue"
  ],
  "natural": [
    "jb2a.melee_generic.creature_attack.claw.002.red",
    "jb2a.melee_generic.creature_attack.claw.001.red",
    "jb2a.melee_generic.creature_attack.fist.002.blue"
  ],
  "improvised": [
    "jb2a.melee_attack.02.club.01",
    "jb2a.club.melee.01.white"
  ],
  "shield": [
    "jb2a.melee_attack.06.shield.01"
  ]
};

const PROJECTILE_BY_TYPE = {
  "bow": [
    "jb2a.arrow.physical.white.01",
    "jb2a.arrow.physical.white.01.30ft"
  ],
  "crossbow": [
    "jb2a.arrow.physical.blue",
    "jb2a.arrow.physical.blue.30ft"
  ],
  "sling": [
    "jb2a.bullet.03.blue",
    "jb2a.bullet.01.orange",
    "jb2a.bullet.03.blue.30ft"
  ],
  "thrown": [
    "jb2a.dagger.throw.01.white",
    "jb2a.dagger.throw.01.white.30ft"
  ],
  "firearm": [
    "jb2a.bullet.01.orange",
    "jb2a.bullet.02.orange",
    "jb2a.bullet.01.orange.30ft"
  ]
};

// Impacto de golpe por tabla de dano (cut/thrust/impact) + generico.
const IMPACT_BY_CRITIC = {
  "cut": [
    "jb2a.melee_generic.slash.01.orange",
    "jb2a.sword.melee.01.white"
  ],
  "thrust": [
    "jb2a.spear.melee.01.white"
  ],
  "impact": [
    "jb2a.melee_attack.02.mace.01",
    "jb2a.impact.010.orange"
  ],
  "generic": [
    "jb2a.impact.010.orange",
    "jb2a.impact.011.blue"
  ]
};

// Reaccion en defensa EXITOSA: block (escudo), parry (arma), dodge (esquiva).
const REACTION = {
  "block": [
    "jb2a.melee_attack.06.shield.01",
    "jb2a.impact.011.blue"
  ],
  "parry": [
    "jb2a.static_electricity.01.blue",
    "jb2a.impact.004.blue",
    "jb2a.impact.007.orange"
  ],
  "dodge": [
    "jb2a.swirling_sparkles.01.blue"
  ]
};

const normalize = str =>
  String(str ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const KEYWORDS_BY_LEN = Object.keys(KEYWORD_TO_TYPE).sort((a, b) => b.length - a.length);
const PROJECTILE_TYPES = new Set(Object.keys(PROJECTILE_BY_TYPE));
const PROJ_KEYWORDS = KEYWORDS_BY_LEN.filter(k => PROJECTILE_TYPES.has(KEYWORD_TO_TYPE[k]));

/** Tipo de arma inferido de (nombre, critico, isRanged, shotType). Longest-match de palabra clave. */
export function weaponTypeFor({ weaponName = '', critic = '', isRanged = false, shotType = '' } = {}) {
  const name = normalize(weaponName);
  if (isRanged) {
    const k = PROJ_KEYWORDS.find(kw => name.includes(kw));
    if (k) return KEYWORD_TO_TYPE[k];
    if (shotType === 'throw') return 'thrown';
    return 'bow';
  }
  const k = KEYWORDS_BY_LEN.find(kw => name.includes(kw));
  if (k) return KEYWORD_TO_TYPE[k];
  return CRITIC_FALLBACK[critic] || 'sword';
}

/** Animacion de ATAQUE del tipo: proyectil (ranged=true) o swing melee. */
export function weaponAttackEffect(type) {
  if (PROJECTILE_BY_TYPE[type]) return { file: PROJECTILE_BY_TYPE[type], ranged: true };
  return { file: MELEE_BY_TYPE[type] || MELEE_BY_TYPE.sword, ranged: false };
}

/**
 * Tipo MELEE del arma IGNORANDO isRanged (si el nombre casa un tipo a distancia, degrada al melee
 * por critico). Para animar TODO como cuerpo a cuerpo (evita la fragilidad de isProjectile).
 */
export function weaponMeleeType(weaponName, critic) {
  const t = weaponTypeFor({ weaponName, critic, isRanged: false });
  return MELEE_BY_TYPE[t] ? t : CRITIC_FALLBACK[critic] || 'sword';
}

/** Animacion de swing MELEE del arma (siempre melee, nunca proyectil). */
export function weaponMeleeEffect(weaponName, critic) {
  return MELEE_BY_TYPE[weaponMeleeType(weaponName, critic)] || MELEE_BY_TYPE.sword;
}

/** Impacto de golpe por tabla de dano (critico). Cae a generico. */
export function weaponImpactEffect(critic) {
  return IMPACT_BY_CRITIC[critic] || IMPACT_BY_CRITIC.generic;
}

/** Reaccion en defensa exitosa: escudo->block, esquiva->dodge, resto (parada de arma)->parry. */
export function weaponReactionEffect(defenseType) {
  const key = defenseType === 'shield' ? 'block' : defenseType === 'dodge' ? 'dodge' : 'parry';
  return REACTION[key] || REACTION.parry;
}
