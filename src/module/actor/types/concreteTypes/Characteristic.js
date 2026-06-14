import { BaseType } from '../BaseType.js';
import { calculateAttributeModifier } from '../../utils/prepareActor/calculations/util/calculateAttributeModifier.js';
import {
  characteristicCap,
  PHYSICAL_CHARACTERISTIC_KEYS as PHYSICAL_KEYS,
  SYSTEM_CHARACTERISTIC_CEILING
} from '../../utils/prepareActor/calculations/util/characteristicLimits.js';
//src/module/actor/

export class Characteristic extends BaseType {
  static type = 'Characteristic';

  get base() {
    return this._get('base.value', 0);
  }
  get special() {
    return this._get('special.value', 0);
  }
  get final() {
    return this._get('final.value', 0);
  }

  // computeFinal() {
  //   return Math.min(Math.max(this.base + this.special, 0), 20);
  // }

  // applyDerived() {
  //   const ensureObj = path => {
  //     const cur = this._get(path, null);
  //     if (!cur || typeof cur !== 'object') {
  //       this._set(path, { value: Number(cur) || 0 });
  //     }
  //   };

  //   ensureObj('base');
  //   ensureObj('special');
  //   ensureObj('final');
  //   ensureObj('mod');

  //   this._set('final.value', this.computeFinal());
  //   this._set('mod.value', calculateAttributeModifier(this.final));
  // }

  static defaults() {
    return {
      base: { value: 0 },
      special: { value: 0 },
      final: { value: 0 },
      mod: { value: 0 }
    };
  }

  static normalizeInflateInput(node) {
    if (!node || typeof node !== 'object') return node;

    const out = { ...node };

    // legacy: { value: number } -> base.value
    if (out.value !== undefined && out.base === undefined) {
      out.base = { value: Number(out.value) || 0 };
      delete out.value;
    }

    // legacy: { mod: number } -> mod.value
    if (
      out.mod !== undefined &&
      (typeof out.mod === 'number' || typeof out.mod === 'string')
    ) {
      out.mod = { value: Number(out.mod) || 0 };
    }

    return out;
  }

  static editorConfig() {
    return {
      readonly: ['final.value', 'mod.value'],
      hidden: [],
      labels: {
        'base.value': 'Base',
        'special.value': 'Special',
        'final.value': 'Final',
        'mod.value': 'Mod'
      },
      order: ['base.value', 'special.value', 'final.value', 'mod.value'],
      overrides: {}
    };
  }

  getDerivedFlowSpecs() {
    const specs = [
      {
        id: 'final',
        deps: ['base.value', 'special.value'],
        mods: ['final.value'],
        compute: this._computeFinal.bind(this)
      },
      {
        id: 'mod',
        deps: ['base.value', 'special.value'],
        mods: ['mod.value'],
        compute: this._computeMod.bind(this)
      }
    ];

    if (PHYSICAL_KEYS.has(this.key)) {
      this.setInstanceDeps('final', [
        'system.general.settings.inhuman.value',
        'system.general.settings.zen.value'
      ]);
    } else {
      this.clearInstanceDeps('final');
    }

    return this._mergeInstanceDeps(specs);
  }

  /**
   * Tope del 'final' (valor de la caracteristica) para las fisicas: 10 sin nada,
   * 13 con Inhumanidad, 20 con Zen. Las psiquicas mantienen el techo del sistema (20).
   */
  _characteristicCap() {
    const settings = this.actor?.system?.general?.settings;
    return characteristicCap(this.key, {
      inhuman: !!settings?.inhuman?.value,
      zen: !!settings?.zen?.value
    });
  }

  /** @param {{ base:number, special:number }} inputs */
  _computeFinal({ base = 0, special = 0 }) {
    const final = Math.min(Math.max(base + special, 0), this._characteristicCap());
    return { final };
  }

  /**
   * El modificador (bono) usa SIEMPRE el valor real (base+special, hasta el techo
   * del sistema 20), no el 'final' topado por Inhumanidad/Zen: el tope limita el
   * valor de la caracteristica, no el bono que aporta (p.ej. al daño).
   * @param {{ base:number, special:number }} inputs
   */
  _computeMod({ base = 0, special = 0 }) {
    const real = Math.min(Math.max(base + special, 0), SYSTEM_CHARACTERISTIC_CEILING);
    return { mod: calculateAttributeModifier(real) };
  }
}
