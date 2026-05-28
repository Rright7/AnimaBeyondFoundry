import { maneuverRegistry } from './ManeuverRegistry.js';
import { derribo } from './definitions/derribo.js';
import { desarme } from './definitions/desarme.js';
import { presa } from './definitions/presa.js';

maneuverRegistry.register(derribo);
maneuverRegistry.register(desarme);
maneuverRegistry.register(presa);

export { maneuverRegistry };
