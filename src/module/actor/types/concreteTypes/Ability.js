import { AffectedByCharacteristicValue } from './AffectedByCharacteristicValue.js';
import { calculateAttributeModifier } from '../../utils/prepareActor/calculations/util/calculateAttributeModifier.js';

export class Ability extends AffectedByCharacteristicValue {
  static type = 'Ability';

  get applyAllActionMod() {
    return this._get('applyAllActionMod', true);
  }

  get applyPhysicalActionMod() {
    const v = this._get('applyPhysicalActionMod', undefined);
    if (v !== undefined) return v;

    const ATTRIBUTES_AFFECTED_BY_PHYSICAL_PENALTIES = [
      'agility',
      'dexterity',
      'strength',
      'constitution'
    ];

    return ATTRIBUTES_AFFECTED_BY_PHYSICAL_PENALTIES.includes(this.attribute);
  }

  static defaults() {
    // Do NOT seed `applyAllActionMod`/`applyPhysicalActionMod` here. The
    // getters above already provide sensible fallbacks (allActions defaults
    // to true; physicalActions defaults based on the attribute being a
    // physical one). Seeding `true` in defaults() crushes any explicit
    // `false` coming from the `__type` JSON marker because defaults are
    // applied AFTER the merge, persisting `true` into actor.system and
    // making _get(...) find a truthy value before the fallback logic runs.
    return super.defaults();
  }

  static normalizeInflateInput(node) {
    const out = super.normalizeInflateInput(node);
    if (!out || typeof out !== 'object') return out;

    if (typeof out.applyAllActionMod !== 'boolean') out.applyAllActionMod = true;

    const ATTRIBUTES_AFFECTED_BY_PHYSICAL_PENALTIES = [
      'agility',
      'dexterity',
      'strength',
      'constitution'
    ];

    if (typeof out.applyPhysicalActionMod !== 'boolean') {
      out.applyPhysicalActionMod = ATTRIBUTES_AFFECTED_BY_PHYSICAL_PENALTIES.includes(
        out.attribute
      );
    }

    return out;
  }

  static editorConfig() {
    const base = super.editorConfig();

    return {
      ...base,
      labels: {
        ...(base.labels ?? {}),
        applyAllActionMod: 'Apply all action modifier',
        applyPhysicalActionMod: 'Apply physical action modifier'
      },
      order: [...(base.order ?? []), 'applyAllActionMod', 'applyPhysicalActionMod']
    };
  }

  _computeFinal({ base = 0, special = 0 }) {
    let { final } = super._computeFinal({ base, special });

    final += Number(this._computeMods());

    return { final };
  }

  /**
   * El bono de caracteristica de una habilidad usa SIEMPRE el modificador REAL
   * (mod.value, calculado del valor real base+special), no el final topado por
   * Inhumanidad/Zen. Asi Ataque/Parada (DES) y Esquiva (AGI) aprovechan la
   * caracteristica real aunque su valor este capado. La clase base ya usa el bono
   * real, asi que wearArmor (capacidad de carga) tambien lo aprovecha.
   */
  _computeCharacteristicDelta() {
    if (!this.computeCharacteristicMod || !this.attribute) return 0;

    const ch = this.actor?.system?.characteristics?.primaries?.[this.attribute];
    if (!ch) return 0;

    const chBase = Number(ch.base?.value ?? ch.base ?? 0);
    const chMod = Number(ch.mod?.value ?? 0);

    return chMod - calculateAttributeModifier(chBase);
  }

  /**
   *
   * Calculates ability mod
   * @returns {Number}
   */
  _computeMods() {
    let result = 0;
    if (this.applyAllActionMod) {
      result += Number(
        this.actor?.system?.general?.modifiers?.allActions?.final?.value ?? 0
      );
    }

    if (this.applyPhysicalActionMod) {
      result += Number(
        this.actor?.system?.general?.modifiers?.physicalActions?.final?.value ?? 0
      );
    }
    return result;
  }

  getDerivedFlowSpecs() {
    const specs = super.getDerivedFlowSpecs();
    const finalSpec = specs.find(s => s.id === 'final');

    if (finalSpec) {
      // keep super deps, just add toggles
      finalSpec.deps = [...finalSpec.deps, 'applyAllActionMod', 'applyPhysicalActionMod'];
      finalSpec.compute = this._computeFinal.bind(this);

      // El bono usa mod.value (valor real), no final.value (topado por
      // Inhumanidad/Zen): re-apunta la dependencia de caracteristica a mod.value
      // para que el toposort recalcule cuando cambie el modificador real.
      const chPath = this.attribute
        ? `system.characteristics.primaries.${this.attribute}`
        : null;
      const deps = [...(this.getInstanceDeps('final') ?? [])].map(d =>
        chPath && d === `${chPath}.final.value` ? `${chPath}.mod.value` : d
      );

      if (this.applyAllActionMod) {
        deps.push('system.general.modifiers.allActions.final.value');
      }
      if (this.applyPhysicalActionMod) {
        deps.push('system.general.modifiers.physicalActions.final.value');
      }

      this.setInstanceDeps('final', deps);
    }

    return this._mergeInstanceDeps(specs);
  }
}
