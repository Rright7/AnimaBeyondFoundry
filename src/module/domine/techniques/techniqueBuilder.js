import { ABFItems } from '../../items/ABFItems';
import {
  getEffect,
  getDisadvantage,
  getEffectByName,
  getDisadvantageByName,
  getEffectsByCategory,
  DISADVANTAGE_CATALOG,
  KI_CHARACTERISTICS,
  ELEMENTS,
  DISADVANTAGE_DETAIL
} from './effectCatalog';
import {
  newTechniqueEffectRow,
  newTechniqueDisadvantageRow
} from '../../types/domine/TechniqueItemConfig';
import { techniquePersistentBonuses } from './activeTechniqueModifiers';

// Lógica del constructor de Técnicas de Ki, compartida entre la pestaña
// "Creación de Técnicas de Ki" (ficha de actor) y la hoja del item técnica.
// El view-model es puro; los helpers de mutación reciben el item y escriben con
// item.update (leyendo el array completo, mutando y reescribiéndolo entero, para
// no corromper arrays con updates parciales).

export const TECHNIQUE_CATEGORY_LABELS = {
  offensive: 'Ofensivos',
  defensive: 'Defensivos',
  destructive: 'De destrucción',
  increment: 'De aumento',
  integrity: 'De integridad',
  action: 'De acción',
  reaction: 'De reacción',
  spatial: 'Espaciales',
  varied: 'Variados'
};

export const TECHNIQUE_CHARACTERISTICS = [
  { key: 'agility', label: 'AGI' },
  { key: 'constitution', label: 'CON' },
  { key: 'dexterity', label: 'DES' },
  { key: 'strength', label: 'FUE' },
  { key: 'power', label: 'POD' },
  { key: 'willPower', label: 'VOL' }
];

const CHAR_ABBR = Object.fromEntries(
  TECHNIQUE_CHARACTERISTICS.map(c => [c.key, c.label])
);

// Etiquetas cortas de los bonos persistentes que se auto-aplican (F6 entrega 2).
const PERSISTENT_BUCKET_ABBR = {
  resistancePhysical: 'RF',
  resistanceMagic: 'RM',
  resistancePsychic: 'RP'
};

export const TECHNIQUE_MAINT_MODES = [
  { value: 'none', label: '—' },
  { value: 'maintained', label: 'Mantenido' },
  { value: 'sustainMinor', label: 'Sost. Menor' },
  { value: 'sustainMajor', label: 'Sost. Mayor' }
];

const MAINT_MODE_LABELS = Object.fromEntries(
  TECHNIQUE_MAINT_MODES.map(m => [m.value, m.label])
);

const TYPE_LABELS = { action: 'Acción', round: 'Asalto' };
const CLASS_LABELS = {
  attack: 'Ataque',
  defense: 'Defensa',
  counter: 'Contraataque',
  variable: 'Variable',
  any: 'Cualquiera'
};
const ELEMENT_LABELS = {
  air: 'Aire',
  water: 'Agua',
  fire: 'Fuego',
  earth: 'Tierra',
  light: 'Luz',
  dark: 'Oscuridad'
};

const TECHNIQUE_VALIDATION_LABELS = {
  cmExcesivo: 'CM excede el tope del nivel',
  nivelMinimo: 'Nivel insuficiente para los efectos/desventajas',
  mantenidoYSostenido: 'No se puede mezclar Mantenido y Sostenido',
  errorEnSostenidos: 'Sostenimiento no permitido (Nv1 o efecto Nv3)',
  unSoloPrimario: 'Debe haber exactamente 1 efecto primario',
  desventajasLimite: 'Las desventajas no pueden reducir el coste de CM por debajo de la mitad.',
  noPuedeReducirKi: 'Sólo puedes reducir Ki dependiendo de 3+ características',
  maxReduccionKi: 'No puedes reducir una característica más de la mitad',
  modificacionDeCostes: 'La redistribución no cuadra con las reducciones',
  costeActivo: 'El Ki activo repartido no coincide con el coste (columnas Act.)',
  costeMantenimiento: 'El Ki de mantenimiento no está repartido (columnas Mant.)',
  elementoNoAfin: 'El elemento elegido (Atadura/Requerimientos) no es afín a los efectos'
};

/** "DES (AGI+2, FUE+2, POD+2, VOL+3)" a partir del catálogo. */
const buildCharString = def => {
  if (!def) return '';
  const prim = CHAR_ABBR[def.primaryCharacteristic] ?? '';
  const opt = Object.entries(def.optionalCharacteristics ?? {})
    .map(([c, n]) => `${CHAR_ABBR[c] ?? c}+${n}`)
    .join(', ');
  return opt ? `${prim} (${opt})` : prim;
};

const elementsLabel = def =>
  (def?.elements ?? []).map(e => ELEMENT_LABELS[e] ?? e).join(', ');

/** Resumen de un efecto para la tarjeta: "Nombre (opción, opción, Mantenido)". */
const effectSummary = (def, row) => {
  if (!def) return '';
  const parts = [...(Array.isArray(row.tierOptions) ? row.tierOptions : [])];
  if (row.maintMode && row.maintMode !== 'none') {
    parts.push(MAINT_MODE_LABELS[row.maintMode] ?? row.maintMode);
  }
  return parts.length ? `${def.name} (${parts.join(', ')})` : def.name;
};

/**
 * View-model del constructor para un item técnica (puro, sin Foundry salvo el
 * acceso a item.system).
 */
export function buildTechniqueViewModel(item) {
  const build = item?.system?.build ?? {};
  const computed = item?.system?.computed ?? {};
  const effects = Array.isArray(build.effects) ? build.effects : [];
  const disadvantages = Array.isArray(build.disadvantages) ? build.disadvantages : [];

  const groups = getEffectsByCategory();
  const effectGroups = Object.keys(groups).map(key => ({
    key,
    label: TECHNIQUE_CATEGORY_LABELS[key] ?? key,
    effects: groups[key].map(e => ({ id: e.id, name: e.name }))
  }));

  const effectRows = effects.map((row, index) => {
    const def = getEffect(row.effectId);
    const role = row.role ?? (index === 0 ? 'primary' : 'secondary');
    const isPrimary = role === 'primary';
    const selectedOptions = Array.isArray(row.tierOptions) ? row.tierOptions : [];
    const tierChoices = def
      ? def.tiers.map(t => ({
          option: t.option,
          label: `${t.option} · cm ${t.cm} · ki ${isPrimary ? t.kiPrimary : t.kiSecondary}${
            t.level ? ` · Nv${t.level}` : ''
          }`
        }))
      : [];
    // Al menos 4 desplegables de opción por efecto (+ uno libre tras los elegidos).
    const slotCount = Math.max(4, selectedOptions.length + 1);
    const optionSlots = [];
    for (let s = 0; s < slotCount; s += 1) {
      const value = selectedOptions[s] ?? '';
      optionSlots.push({
        slot: s,
        value,
        choices: tierChoices.map(c => ({ ...c, selected: c.option === value }))
      });
    }
    return {
      index,
      role,
      isPrimary,
      roleOptions: [
        { value: 'primary', label: 'Primario', selected: isPrimary },
        { value: 'secondary', label: 'Secundario', selected: !isPrimary }
      ],
      effectId: row.effectId ?? '',
      effectName: def?.name ?? '',
      charString: buildCharString(def),
      typeLabel: TYPE_LABELS[def?.type] ?? '',
      classLabel: CLASS_LABELS[def?.class] ?? '',
      elementsLabel: elementsLabel(def),
      maintMode: row.maintMode ?? 'none',
      optionSlots,
      ki: TECHNIQUE_CHARACTERISTICS.map(c => ({
        key: c.key,
        label: c.label,
        active: row.kiByCharacteristic?.[c.key] ?? 0,
        maint: row.maintKiByCharacteristic?.[c.key] ?? 0
      })),
      perEffect: computed.perEffect?.[index] ?? null
    };
  });

  const disadvantageRows = disadvantages.map((row, index) => {
    const def = getDisadvantage(row.disadvantageId);
    const cfg = DISADVANTAGE_DETAIL[row.disadvantageId];
    const detailKind = cfg?.kind ?? 'none';
    const elementSlots = [];
    if (detailKind === 'element') {
      const chosen = Array.isArray(row.detailElements) ? row.detailElements : [];
      const count =
        row.disadvantageId === 'atadura-elemental'
          ? row.option === 'A Dos Elementos'
            ? 2
            : 1
          : cfg.count ?? 1;
      for (let s = 0; s < count; s += 1) {
        const value = chosen[s] ?? '';
        elementSlots.push({
          slot: s,
          value,
          choices: ELEMENTS.map(e => ({ key: e.key, label: e.label, selected: e.key === value }))
        });
      }
    }
    return {
      index,
      disadvantageId: row.disadvantageId ?? '',
      option: row.option ?? '',
      detailKind,
      detail: row.detail ?? '',
      detailPlaceholder: cfg?.placeholder ?? 'detalle',
      elementSlots,
      name: def?.name ?? '',
      options: def
        ? def.options.map(o => ({
            option: o.option,
            cmReduction: o.cmReduction,
            selected: o.option === row.option
          }))
        : []
    };
  });

  const validations = computed.validations ?? {};
  const validationBadges = Object.keys(TECHNIQUE_VALIDATION_LABELS)
    .filter(key => validations[key])
    .map(key => ({ key, label: TECHNIQUE_VALIDATION_LABELS[key] }));

  const costByCharacteristic = TECHNIQUE_CHARACTERISTICS.map(c => ({
    label: c.label,
    active: computed.costByCharacteristic?.[c.key]?.active ?? 0,
    maint: computed.costByCharacteristic?.[c.key]?.maint ?? 0
  }));

  // "CON 6, DES 6, POD 5 (2)" — sólo características con coste activo.
  const costString = costByCharacteristic
    .filter(c => c.active)
    .map(c => `${c.label} ${c.active}${c.maint ? ` (${c.maint})` : ''}`)
    .join(', ');

  // Resumen de efectos para la tarjeta de Domine.
  const effectsSummary = effects
    .map(row => effectSummary(getEffect(row.effectId), row))
    .filter(Boolean)
    .join(', ');

  // Desglose explícito de sobrecostes de la técnica (CM y Ki) para la cabecera.
  const lvl = computed.level || 1;
  const costNotes = [];
  if (build.combinable) costNotes.push(`Combinable: +${10 * lvl} CM · +${3 * lvl} Ki`);
  if (computed.flags?.anyMaintained) {
    costNotes.push(`Mantenido: +${10 * lvl} CM · ${computed.kiMaintTotal || 0} Ki/asalto`);
  }
  if (computed.flags?.anySostMenor) costNotes.push(`Sostenido menor: +${20 * lvl} CM · 5 asaltos`);
  if (computed.flags?.anySostMayor) costNotes.push(`Sostenido mayor: +${30 * lvl} CM · 1 min`);

  // Bonos persistentes mecánico-limpios que la técnica aplica al activarse
  // (Capacidad Incrementada -> característica; Incremento de Resistencia -> RF/RM/RP).
  const persistent = techniquePersistentBonuses(effects);
  const appliedBonuses = [
    ...Object.entries(persistent.characteristics).map(
      ([c, v]) => `${CHAR_ABBR[c] ?? c} +${v}`
    ),
    ...persistent.kiBonusEffects.map(
      e => `${PERSISTENT_BUCKET_ABBR[e.target] ?? e.target} +${e.value}`
    )
  ];

  return {
    id: item?.id ?? item?._id,
    name: item?.name,
    description: item?.system?.description?.value ?? '',
    levelOptions: [1, 2, 3].map(v => ({ value: v, selected: Number(build.level) === v })),
    build,
    computed,
    characteristics: TECHNIQUE_CHARACTERISTICS,
    maintModes: TECHNIQUE_MAINT_MODES,
    effectGroups,
    disadvantageOptions: DISADVANTAGE_CATALOG.map(d => ({ id: d.id, name: d.name })),
    effectRows,
    disadvantageRows,
    canAddEffect: effects.length < 5,
    canAddDisadvantage: disadvantages.length < 3,
    validationBadges,
    costByCharacteristic,
    costString,
    effectsSummary,
    costNotes,
    appliedBonuses,
    appliedBonusesString: appliedBonuses.join(' · '),
    // Estado de uso en juego (F6).
    active: !!item?.flags?.animabf?.active,
    remaining: Number(item?.flags?.animabf?.remaining) || 0,
    isMantenida: !!computed.flags?.anyMaintained,
    isSostenida: !!(computed.flags?.anySostMenor || computed.flags?.anySostMayor),
    isInstant: !(
      computed.flags?.anyMaintained ||
      computed.flags?.anySostMenor ||
      computed.flags?.anySostMayor
    ),
    kiActiveTotal: computed.kiActiveTotal ?? 0,
    kiMaintTotal: computed.kiMaintTotal ?? 0
  };
}

// --- Helpers de mutación (reciben el item técnica) -------------------------

const cloneEffects = item =>
  foundry.utils.duplicate(item.system?.build?.effects ?? []);
const cloneDisadvantages = item =>
  foundry.utils.duplicate(item.system?.build?.disadvantages ?? []);

// Rol por defecto al añadir un efecto: primario si aún no hay ninguno; si ya
// existe un primario, secundario. El usuario puede cambiarlo luego por fila.
const defaultRole = effects =>
  effects.some(e => e.role === 'primary') ? 'secondary' : 'primary';

export async function techAddEffect(item) {
  const effects = cloneEffects(item);
  if (effects.length >= 5) return;
  effects.push(newTechniqueEffectRow(defaultRole(effects)));
  await item.update({ 'system.build.effects': effects });
}

export async function techRemoveEffect(item, index) {
  const effects = cloneEffects(item);
  if (!effects[index]) return;
  effects.splice(index, 1);
  await item.update({ 'system.build.effects': effects });
}

export async function techAddDisadvantage(item) {
  const disadvantages = cloneDisadvantages(item);
  if (disadvantages.length >= 3) return;
  disadvantages.push(newTechniqueDisadvantageRow());
  await item.update({ 'system.build.disadvantages': disadvantages });
}

export async function techRemoveDisadvantage(item, index) {
  const disadvantages = cloneDisadvantages(item);
  if (!disadvantages[index]) return;
  disadvantages.splice(index, 1);
  await item.update({ 'system.build.disadvantages': disadvantages });
}

export async function techEffectFieldChange(item, el) {
  const index = Number(el.dataset.index);
  const field = el.dataset.techEffectField;
  const effects = cloneEffects(item);
  const row = effects[index];
  if (!row) return;

  row.kiByCharacteristic ??= {};
  row.maintKiByCharacteristic ??= {};

  if (field === 'effectId') {
    row.effectId = el.value;
    row.tierOptions = []; // las opciones del efecto anterior dejan de ser válidas
  } else if (field === 'role') {
    row.role = el.value;
  } else if (field === 'maintMode') {
    row.maintMode = el.value;
  } else if (field === 'tierOption') {
    // Cada efecto tiene varios desplegables de opción; reconstruimos tierOptions
    // a partir de TODOS los slots (en orden, sin vacíos ni duplicados).
    const container = el.closest('[data-effect-options]');
    const selects = container
      ? [...container.querySelectorAll('select[data-tech-effect-field="tierOption"]')]
      : [el];
    row.tierOptions = [...new Set(selects.map(s => s.value).filter(Boolean))];
  } else if (field.startsWith('ki.')) {
    row.kiByCharacteristic[field.slice(3)] = Number(el.value) || 0;
  } else if (field.startsWith('maint.')) {
    row.maintKiByCharacteristic[field.slice(6)] = Number(el.value) || 0;
  }

  await item.update({ 'system.build.effects': effects });
}

export async function techDisadvantageFieldChange(item, el) {
  const index = Number(el.dataset.index);
  const field = el.dataset.techDisadvantageField;
  const disadvantages = cloneDisadvantages(item);
  const row = disadvantages[index];
  if (!row) return;

  if (field === 'disadvantageId') {
    row.disadvantageId = el.value;
    row.option = '';
    row.detail = '';
    row.detailElements = [];
  } else if (field === 'option') {
    row.option = el.value;
  } else if (field === 'detail') {
    row.detail = el.value;
  } else if (field === 'detailElement') {
    const container = el.closest('[data-disadvantage-detail]');
    const selects = container
      ? [...container.querySelectorAll('select[data-tech-disadvantage-field="detailElement"]')]
      : [el];
    row.detailElements = selects.map(s => s.value);
  }

  await item.update({ 'system.build.disadvantages': disadvantages });
}

export async function onDropTechniqueEffect(item, event) {
  let payload;
  try {
    payload = JSON.parse(event.dataTransfer?.getData('text/plain') ?? '{}');
  } catch {
    return;
  }
  if (!payload || payload.type !== 'Item') return;

  const doc = await fromUuid(payload.uuid);
  if (!doc || doc.type !== ABFItems.TECHNIQUE_EFFECT) {
    return ui.notifications?.warn(
      'Solo se pueden arrastrar items de tipo Efecto de Técnica aquí.'
    );
  }

  // Desventaja -> build.disadvantages ; Efecto -> build.effects
  if (doc.system?.kind?.value === 'disadvantage') {
    const def = getDisadvantageByName(doc.name);
    if (!def) {
      return ui.notifications?.warn(`"${doc.name}" no está en el catálogo de desventajas.`);
    }
    const disadvantages = cloneDisadvantages(item);
    if (disadvantages.length >= 3) {
      return ui.notifications?.warn('No puedes añadir más de 3 desventajas.');
    }
    disadvantages.push({ ...newTechniqueDisadvantageRow(), disadvantageId: def.id });
    await item.update({ 'system.build.disadvantages': disadvantages });
    return;
  }

  const def = getEffectByName(doc.name);
  if (!def) {
    return ui.notifications?.warn(`"${doc.name}" no está en el catálogo de efectos.`);
  }
  const effects = cloneEffects(item);
  if (effects.length >= 5) {
    return ui.notifications?.warn('No puedes añadir más de 5 efectos.');
  }
  const row = newTechniqueEffectRow(defaultRole(effects));
  row.effectId = def.id;
  effects.push(row);
  await item.update({ 'system.build.effects': effects });
}
