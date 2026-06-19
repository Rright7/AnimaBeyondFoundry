import { prepareItem } from './utils/prepareItem/prepareItem';
import { ABFItems } from './ABFItems';
import { computeWeaponGripSync } from '../actor/utils/prepareActor/utils/getCombatHandWeapons';

export default class ABFItem extends Item {
  async prepareDerivedData() {
    await super.prepareDerivedData();

    await prepareItem(this);
  }

  /**
   * Invariante de agarre del arma: la cualidad de agarre MANDA y manageabilityType la
   * refleja (exactamente una de oneHand/twoHanded/oneOrTwoHanded). Sincroniza en el
   * MISMO update venga del selector o del arrastre de cualidad. Escudos y desarmado no
   * usan agarre, así que se excluyen.
   */
  async _preUpdate(changed, options, user) {
    await super._preUpdate(changed, options, user);
    if (this.type !== ABFItems.WEAPON) return;
    if (this.system?.isShield?.value || this.system?.isUnarmed?.value) return;

    // `changed` puede venir aplanado (claves con puntos) o anidado segun el origen del
    // update. Lo normalizamos a expandido para leer y escribir sin mezclar formas.
    const expanded = foundry.utils.expandObject(changed);
    const patch = computeWeaponGripSync({
      currentManage: this.system?.manageabilityType?.value,
      currentQualities: this.system?.qualities?.value ?? [],
      changedManage: foundry.utils.getProperty(expanded, 'system.manageabilityType.value'),
      changedQualities: foundry.utils.getProperty(expanded, 'system.qualities.value')
    });
    if (patch.qualities === undefined && patch.manageabilityType === undefined) return;

    if (patch.qualities !== undefined) {
      foundry.utils.setProperty(expanded, 'system.qualities.value', patch.qualities);
    }
    if (patch.manageabilityType !== undefined) {
      foundry.utils.setProperty(expanded, 'system.manageabilityType.value', patch.manageabilityType);
    }
    // Reescribe `changed` en su sitio (misma referencia), ya expandido + sincronizado.
    for (const k of Object.keys(changed)) delete changed[k];
    Object.assign(changed, expanded);
  }

  toActiveEffectData() {
    if (this.type !== ABFItems.EFFECT) return null;

    const effectData = this.system.effectData ?? {};
    return {
      name: this.name,
      icon: effectData.icon ?? this.img ?? 'icons/svg/aura.svg',
      disabled: effectData.disabled ?? true,
      changes: effectData.changes ?? [],
      duration: effectData.duration ?? {},
      transfer: false,
      flags: effectData.flags ?? {}
    };
  }

  async fromActiveEffect(activeEffect) {
    if (this.type !== ABFItems.EFFECT || !activeEffect) return;

    const data = activeEffect.toObject();
    const { name, icon, disabled, changes, duration, flags } = data;

    await this.update({
      name,
      'system.active': !disabled,
      'system.effectData': {
        icon,
        disabled,
        changes,
        duration,
        transfer: false,
        flags
      }
    });
  }
}
