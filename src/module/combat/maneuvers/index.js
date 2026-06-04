import { maneuverRegistry } from './ManeuverRegistry.js';
import { derribo } from './definitions/derribo.js';
import { desarme } from './definitions/desarme.js';
import { presa } from './definitions/presa.js';
import { engatillar } from './definitions/engatillar.js';
import { inutilizar } from './definitions/inutilizar.js';
import { inconsciencia } from './definitions/inconsciencia.js';
import { carga } from './definitions/carga.js';
import { mounted } from './definitions/mounted.js';
import { crush } from './definitions/crush.js';
import { danoRetrasado } from './definitions/danoRetrasado.js';
import { lluviaDeProyectiles } from './definitions/lluviaDeProyectiles.js';

maneuverRegistry.register(derribo);
maneuverRegistry.register(desarme);
maneuverRegistry.register(presa);
maneuverRegistry.register(engatillar);
maneuverRegistry.register(inutilizar);
maneuverRegistry.register(inconsciencia);
maneuverRegistry.register(carga);
maneuverRegistry.register(mounted);
maneuverRegistry.register(crush);
maneuverRegistry.register(danoRetrasado);
maneuverRegistry.register(lluviaDeProyectiles);

export { maneuverRegistry };
