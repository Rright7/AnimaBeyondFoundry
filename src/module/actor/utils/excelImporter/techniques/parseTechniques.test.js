import { readTechniquesFromWorkbook } from './parseTechniques.js';
import {
  getEffectByName,
  getDisadvantageByName
} from '../../../../domine/techniques/effectCatalog.js';

// Workbook xlsx mínimo: mapa de celdas A1 -> {v} en la hoja "Creación de
// Técnicas". El bloque 1 empieza en la fila 12.
function makeWorkbook(cells) {
  const sheet = {};
  for (const [addr, v] of Object.entries(cells)) sheet[addr] = { v };
  return {
    SheetNames: ['Creación de Técnicas'],
    Sheets: { 'Creación de Técnicas': sheet }
  };
}

describe('readTechniquesFromWorkbook', () => {
  test('reconstruye el build de una técnica (efecto primario + Atadura Elemental)', () => {
    const wb = makeWorkbook({
      D12: 'Golpe Sombrío',
      P12: 2,
      S12: 'No',
      D37: 'Descripción libre del jugador',
      // Efecto 1 (fila 16): Habilidad de Ataque, Primario, sin mantenimiento.
      D16: 'Primario',
      F16: 'Habilidad de Ataque',
      K16: '-',
      AB16: 5, // FUE (strength) Ki activo
      D29: '+50', // opción de escalón del efecto 1
      // Desventaja 1 (fila 21): Atadura Elemental a un elemento (Fuego).
      F21: 'Atadura Elemental',
      K21: 'A Un Elemento',
      O21: 'Fuego'
    });

    const result = readTechniquesFromWorkbook(wb);
    expect(result).toHaveLength(1);

    const t = result[0];
    expect(t.name).toBe('Golpe Sombrío');
    expect(t.level).toBe(2);
    expect(t.combinable).toBe(false);
    expect(t.description).toBe('Descripción libre del jugador');
    expect(t.notFound).toEqual([]);

    expect(t.effects).toHaveLength(1);
    const e = t.effects[0];
    expect(e.effectId).toBeTruthy();
    expect(e.effectId).toBe(getEffectByName('Habilidad de Ataque')?.id);
    expect(e.role).toBe('primary');
    expect(e.maintMode).toBe('none');
    expect(e.tierOptions).toEqual(['+50']);
    expect(e.kiByCharacteristic.strength).toBe(5);

    expect(t.disadvantages).toHaveLength(1);
    const d = t.disadvantages[0];
    expect(d.disadvantageId).toBeTruthy();
    expect(d.disadvantageId).toBe(getDisadvantageByName('Atadura Elemental')?.id);
    expect(d.option).toBe('A Un Elemento');
    expect(d.detailElements).toEqual(['fire']);
  });

  test('maintMode: mapea Mantenido y reparte el Ki de mantenimiento', () => {
    const wb = makeWorkbook({
      D12: 'Adrenalina',
      F16: 'Habilidad de Ataque',
      K16: 'Mantenido',
      AB16: 7, // FUE activo
      AC16: 3 // FUE mantenimiento
    });
    const e = readTechniquesFromWorkbook(wb)[0].effects[0];
    expect(e.maintMode).toBe('maintained');
    expect(e.kiByCharacteristic.strength).toBe(7);
    expect(e.maintKiByCharacteristic.strength).toBe(3);
  });

  test('salta bloques vacíos (técnicas < 10)', () => {
    const wb = makeWorkbook({ D12: 'Única', F16: 'Habilidad de Ataque', D29: '+10' });
    const result = readTechniquesFromWorkbook(wb);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Única');
  });

  test('efecto fuera del catálogo va a notFound y no rompe', () => {
    const wb = makeWorkbook({ D12: 'Rara', F16: 'Efecto Inventado XYZ' });
    const result = readTechniquesFromWorkbook(wb);
    expect(result).toHaveLength(1);
    expect(result[0].effects).toHaveLength(0);
    expect(result[0].notFound).toContain('Efecto Inventado XYZ');
  });

  test('devuelve null si no existe la hoja de técnicas', () => {
    expect(readTechniquesFromWorkbook({ SheetNames: [], Sheets: {} })).toBeNull();
  });

  test('resuelve la hoja por NOMBRE aunque no sea la primera', () => {
    const wb = {
      SheetNames: ['Otra', 'Creación de Técnicas'],
      Sheets: {
        Otra: {},
        'Creación de Técnicas': { D12: { v: 'X' }, F16: { v: 'Habilidad de Ataque' } }
      }
    };
    expect(readTechniquesFromWorkbook(wb)).toHaveLength(1);
  });
});
