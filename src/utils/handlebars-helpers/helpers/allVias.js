import { getAllViasList } from '../../../module/mystic/customVias.js';

// {{#each (allVias)}} -> [{ key, label }] de TODAS las vias (base + custom) para desplegables.
export const allVias = {
  name: 'allVias',
  fn: () => getAllViasList()
};
