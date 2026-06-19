import { equipmentQualityRegistry } from './EquipmentQualityRegistry.js';
import { precise } from './definitions/precise.js';
import { oneHand } from './definitions/oneHand.js';
import { twoHanded } from './definitions/twoHanded.js';
import { oneOrTwoHanded } from './definitions/oneOrTwoHanded.js';
import { noStrengthDouble } from './definitions/noStrengthDouble.js';
import { complex } from './definitions/complex.js';
import { throwable } from './definitions/throwable.js';
import { grappling } from './definitions/grappling.js';
import { locksWeapon } from './definitions/locksWeapon.js';

equipmentQualityRegistry.register(precise);
equipmentQualityRegistry.register(oneHand);
equipmentQualityRegistry.register(twoHanded);
equipmentQualityRegistry.register(oneOrTwoHanded);
equipmentQualityRegistry.register(noStrengthDouble);
equipmentQualityRegistry.register(complex);
equipmentQualityRegistry.register(throwable);
equipmentQualityRegistry.register(grappling);
equipmentQualityRegistry.register(locksWeapon);

export { equipmentQualityRegistry };
