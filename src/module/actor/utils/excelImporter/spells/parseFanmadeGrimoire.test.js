import { parseFanmadeGrimoire } from './parseFanmadeGrimoire.js';

// Construye una fila dispersa a partir de {indiceColumna: valor}.
function row(pairs) {
  const r = [];
  for (const [c, v] of Object.entries(pairs)) r[Number(c)] = v;
  return r;
}

describe('parseFanmadeGrimoire (grimorio fandom, 2 columnas)', () => {
  // Datos REALES de "AdAstra (Primigenia)" (Lif Litterae_2.xlsm), primer bloque de conjuros.
  const rows = [
    row({
      1: 2, 2: 'Luna Llena', 7: 'Nivel:', 8: 2, 9: 'Vía / Subvia:', 12: 'Adastra', 15: 'Aprendido',
      20: 12, 21: 'Lluvia de Estrellas', 26: 'Nivel:', 27: 12, 28: 'Vía / Subvia:', 31: 'Adastra', 34: 'Aprendido'
    }),
    row({
      2: 'Grado', 4: 'Int. R.', 5: 'Zeón', 6: 'Mant.', 7: 'Tipo:', 8: 'Efecto', 10: 'Acción:', 12: 'Activa', 14: 'Diario:', 16: 'Si',
      21: 'Grado', 23: 'Int. R.', 24: 'Zeón', 25: 'Mant.', 26: 'Tipo:', 27: 'Ataque, Anímico', 29: 'Acción:', 31: 'Activa', 33: 'Diario:', 35: 'No'
    }),
    row({ 2: 'Base', 4: 6, 5: 60, 6: 10, 7: 'Afecta a los hechizos', 21: 'Base', 23: 8, 24: 30, 25: 5, 26: '1 Ataque' }),
    row({ 2: 'Intermedio', 4: 9, 5: 80, 6: 15, 21: 'Intermedio', 23: 10, 24: 60, 25: 10 }),
    row({ 2: 'Avanzado', 4: 11, 5: 120, 6: 15, 21: 'Avanzado', 23: 12, 24: 100, 25: 15 }),
    row({ 2: 'Arcano', 4: 13, 5: 160, 6: 20, 21: 'Arcano', 23: 14, 24: 140, 25: 20 })
  ];

  const spells = parseFanmadeGrimoire(rows, { viaKey: 'cv-adastra' });

  it('parsea las DOS columnas', () => {
    expect(spells.map(s => s.name)).toEqual(['Luna Llena', 'Lluvia de Estrellas']);
  });

  it('columna izquierda (Luna Llena): efecto, activa, diario, 4 grados', () => {
    const s = spells.find(x => x.name === 'Luna Llena');
    expect(s.level).toBe(2);
    expect(s.viaKey).toBe('cv-adastra');
    expect(s.spellType).toBe('effect');
    expect(s.combatType).toBe('none');
    expect(s.actionType).toBe('active');
    expect(s.hasDailyMaintenance).toBe(true);
    expect(s.grades.base).toEqual({
      intRequired: 6, zeon: 60, maintenanceCost: 10, description: 'Afecta a los hechizos'
    });
    expect(s.grades.arcane).toEqual({
      intRequired: 13, zeon: 160, maintenanceCost: 20, description: ''
    });
  });

  it('columna derecha (Lluvia de Estrellas): ataque, no diario', () => {
    const s = spells.find(x => x.name === 'Lluvia de Estrellas');
    expect(s.level).toBe(12);
    expect(s.spellType).toBe('attack');
    expect(s.combatType).toBe('attack');
    expect(s.hasDailyMaintenance).toBe(false);
    expect(s.grades.base).toEqual({
      intRequired: 8, zeon: 30, maintenanceCost: 5, description: '1 Ataque'
    });
  });
});
