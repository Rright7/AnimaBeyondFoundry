import { readFileSync } from 'fs';
import Handlebars from 'handlebars';
import { KI_ATTACK_ELEMENTS } from '../combat/kiElementalAttack.js';

const translations = JSON.parse(
  readFileSync(new URL('../../lang/es.json', import.meta.url))
);
const hbs = Handlebars.create();
hbs.registerPartial(
  'systems/animabf/templates/common/ui/ki-element-badge.hbs',
  readFileSync(
    new URL('../../templates/common/ui/ki-element-badge.hbs', import.meta.url),
    'utf8'
  )
);
hbs.registerHelper('localize', key => translations[key] ?? key);
hbs.registerHelper('concat', (...parts) => parts.slice(0, -1).join(''));
hbs.registerHelper('json', value => JSON.stringify(value));
hbs.registerHelper('abfSettingEnabled', () => false);
hbs.registerHelper('isArrayEmpty', value => !value?.length);
hbs.registerHelper('gt', (a, b) => a > b);
hbs.registerHelper('is', (op, a, b) => op === 'eq' && a === b);
for (const name of ['group', 'group-body', 'custom-select']) {
  hbs.registerPartial(
    `systems/animabf/templates/common/ui/${name}.hbs`,
    '{{> @partial-block}}'
  );
}
for (const name of ['group-header', 'horizontal-titled-input']) {
  hbs.registerPartial(`systems/animabf/templates/common/ui/${name}.hbs`, '');
}

test.each(KI_ATTACK_ELEMENTS)(
  '$id is visible in attack, manual defense and all result cards',
  element => {
    const data = {
      attackData: { kiElement: element.id, armorType: 'cut' },
      combatResult: { kiElement: element.id, armorType: 'cut' },
      entries: [{ kiElement: element.id, damageFinal: 0 }],
      ui: {},
      defender: { combat: {} }
    };
    for (const template of [
      'chat/attack-data',
      'chat/combat-result',
      'chat/multi-defense-result',
      'dialog/combat/defense-config-dialog'
    ]) {
      const source = readFileSync(
        new URL(`../../templates/${template}.hbs`, import.meta.url),
        'utf8'
      );
      expect(hbs.compile(source)(data)).toContain(
        translations[`anima.combat.kiElement.${element.id}`]
      );
    }
  }
);
