import { maneuverRegistry } from './ManeuverRegistry.js';
import { derribo } from './definitions/derribo.js';
import { desarme } from './definitions/desarme.js';
import { presa } from './definitions/presa.js';
import { engatillar } from './definitions/engatillar.js';
import { inutilizar } from './definitions/inutilizar.js';
import { inconsciencia } from './definitions/inconsciencia.js';

maneuverRegistry.register(derribo);
maneuverRegistry.register(desarme);
maneuverRegistry.register(presa);
maneuverRegistry.register(engatillar);
maneuverRegistry.register(inutilizar);
maneuverRegistry.register(inconsciencia);

export { maneuverRegistry };
