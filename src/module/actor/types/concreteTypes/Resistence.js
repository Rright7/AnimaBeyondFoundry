import { BaseType } from '../BaseType.js';

export class Resistance extends BaseType {
  static type = 'Resistance';

  static defaults() {
    return {
      base: { value: 0 },
      special: { value: 0 },
      final: { value: 0 },
      characteristicKey: ''
    };
  }

  getDerivedFlowSpecs() {
    return [];
  }
}
