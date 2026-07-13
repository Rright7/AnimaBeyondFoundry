import { parseViaLevels } from './parseViaLevels.js';

describe('parseViaLevels', () => {
  it('parses "<level> <via>" entries into config keys', () => {
    expect(parseViaLevels('60 Luz, 40 Tiempo')).toEqual([
      { viaKey: 'light', level: 60 },
      { viaKey: 'time', level: 40 }
    ]);
  });

  it('handles multi-word via names (Libre Acceso)', () => {
    expect(parseViaLevels('30 Libre Acceso')).toEqual([
      { viaKey: 'freeAccess', level: 30 }
    ]);
  });

  it('reads the level as the leading number of each entry', () => {
    expect(parseViaLevels('50 Fuego')).toEqual([{ viaKey: 'fire', level: 50 }]);
  });

  it('matches via names embedded in extra text (prefix)', () => {
    expect(parseViaLevels('60 Vía de la Luz, 40 Vía del Tiempo')).toEqual([
      { viaKey: 'light', level: 60 },
      { viaKey: 'time', level: 40 }
    ]);
  });

  it('handles the real Excel format: via + subvia, ignoring grimoire helper spells', () => {
    const real =
      ', 60 Oscuridad (Conocimiento), 99 Aire (Conocimiento, Apertura, Nube ácida, El magistrado)';
    // Oscuridad y Aire como vías; Conocimiento como subvía de ambas (nivel máx);
    // el resto del paréntesis (hechizos-ayuda) se ignora.
    expect(parseViaLevels(real)).toEqual([
      { viaKey: 'darkness', level: 60 },
      { viaKey: 'knowledge', level: 99 },
      { viaKey: 'air', level: 99 }
    ]);
  });

  it('emits the subvia (first parenthetical item) as a via at the same level', () => {
    expect(parseViaLevels('70 Fuego (Tiempo)')).toEqual([
      { viaKey: 'fire', level: 70 },
      { viaKey: 'time', level: 70 }
    ]);
  });

  it('normalizes accents and case', () => {
    expect(parseViaLevels('20 CREACIÓN, 10 ilusion')).toEqual([
      { viaKey: 'creation', level: 20 },
      { viaKey: 'illusion', level: 10 }
    ]);
  });

  it('conserva las vías FANDOM (desconocidas) marcándolas custom', () => {
    expect(parseViaLevels('40 Inventada, 30 Guerra')).toEqual([
      { viaKey: 'Inventada', level: 40, custom: true },
      { viaKey: 'war', level: 30 }
    ]);
  });

  it('detecta la vía fandom real (AdAstra) junto a las estándar', () => {
    expect(
      parseViaLevels(', 40 Luz (Literae), 30 Creación (Tiempo), 40 AdAstra')
    ).toEqual([
      { viaKey: 'light', level: 40 },
      { viaKey: 'literae', level: 40 },
      { viaKey: 'creation', level: 30 },
      { viaKey: 'time', level: 30 },
      { viaKey: 'AdAstra', level: 40, custom: true }
    ]);
  });

  it('keeps the higher level when a via is repeated', () => {
    expect(parseViaLevels('20 Luz, 60 Luz')).toEqual([
      { viaKey: 'light', level: 60 }
    ]);
  });

  it('returns [] for empty/undefined input', () => {
    expect(parseViaLevels('')).toEqual([]);
    expect(parseViaLevels(undefined)).toEqual([]);
    expect(parseViaLevels(null)).toEqual([]);
  });

  it('maps all 26 vias', () => {
    const input = [
      '1 Oscuridad', '1 Luz', '1 Creación', '1 Destrucción', '1 Agua',
      '1 Fuego', '1 Aire', '1 Tierra', '1 Esencia', '1 Ilusión',
      '1 Nigromancia', '1 Sangre', '1 Caos', '1 Muerte', '1 Sueños',
      '1 Vacío', '1 Conocimiento', '1 Literae', '1 Musical', '1 Nobleza',
      '1 Paz', '1 Pecado', '1 Umbral', '1 Tiempo', '1 Guerra', '1 Libre Acceso'
    ].join(', ');
    expect(parseViaLevels(input)).toHaveLength(26);
  });
});
