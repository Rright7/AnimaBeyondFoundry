import Handlebars from 'handlebars';
import { mathHBSHelper } from '../helpers/mathHBSHelper.js';

describe('math Handlebars helper', () => {
  test.each([
    [12, '+', 4, 16],
    [12, '-', 4, 8],
    [12, '*', 4, 48],
    [12, '/', 4, 3],
    [13, '%', 4, 1],
    [2, '**', 3, 8],
    ['12', '/', '4', 3],
    [-3, '/', 2, -1.5]
  ])('calculates %s %s %s', (left, operator, right, expected) => {
    expect(mathHBSHelper.fn(left, operator, right)).toBe(expected);
  });

  test('renders quarter movement through Handlebars', () => {
    const handlebars = Handlebars.create();
    handlebars.registerHelper(mathHBSHelper.name, mathHBSHelper.fn);
    const render = handlebars.compile('{{math movement "/" 4}}');

    expect(render({ movement: 30 })).toBe('7.5');
    expect(render({ movement: '30' })).toBe('7.5');
    expect(render({ movement: 0 })).toBe('0');
  });

  test('rejects JavaScript expressions without executing them', () => {
    const payload = 'globalThis.mathHelperExecuted = true';

    expect(() => mathHBSHelper.fn(payload, '/', 4)).toThrow(TypeError);
    expect(() => mathHBSHelper.fn(12, payload, 4)).toThrow(TypeError);
    expect(globalThis.mathHelperExecuted).toBeUndefined();
  });

  test.each([undefined, 'invalid', NaN, Infinity])(
    'rejects invalid operands: %s',
    operand => {
      expect(() => mathHBSHelper.fn(operand, '/', 4)).toThrow(TypeError);
      expect(() => mathHBSHelper.fn(12, '/', operand)).toThrow(TypeError);
    }
  );
});
