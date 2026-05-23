import { ABFItems } from '../../../../items/ABFItems';
import { KI_SKILLS, findKiSkillByName } from './kiSkills.js';

/**
 * Splits the raw HabilidadesKiNemesis string from the community Excel into a
 * Ki part and a Nemesis part. Strips the "Sellos: …" suffix (seals are
 * imported via a separate flow), then divides Ki from Nemesis using the
 * "Uso del Némesis" marker, and finally expands the parenthesized
 * "Ataque elemental (Fuego, Hielo, …)" notation into one entry per element.
 *
 * Returns `{ ki, nemesis }` — strings still comma-separated, ready to .split(',').
 * Behaviour matches the previous inline implementation in parseExcelToActor.js
 * so the importer is regression-free at the call site.
 *
 * @param {unknown} raw
 * @returns {{ ki: string, nemesis: string }}
 */
export function splitKiAndNemesis(raw) {
  if (typeof raw !== 'string') {
    return { ki: '', nemesis: '' };
  }

  // Drop the seals tail ("Sellos: …") — handled by another importer
  const sealsIdx = raw.indexOf('Sellos:');
  const withoutSeals = sealsIdx !== -1 ? raw.slice(0, sealsIdx).trim() : raw.trim();

  // Nemesis abilities begin at "Uso del Némesis" in the canonical string
  const nemesisIdx = withoutSeals.indexOf('Uso del Némesis');

  if (nemesisIdx === -1) {
    return { ki: expandElementalAttack(withoutSeals), nemesis: '' };
  }

  const kiPart = withoutSeals.slice(0, nemesisIdx).trim();
  const nemesisPart = withoutSeals.slice(nemesisIdx).trim();

  return {
    ki: expandElementalAttack(kiPart),
    nemesis: nemesisPart
  };
}

/**
 * Replaces every "Ataque elemental (X, Y, …)" occurrence with "Ataque elemental: X, Ataque elemental: Y, …".
 * Returns a normalised string with no double commas or trailing comma.
 *
 * @param {string} text
 * @returns {string}
 */
export function expandElementalAttack(text) {
  if (!text) return '';

  return text
    .replace(/Ataque elemental\s*\(([^)]+)\)/gi, (_match, group) => {
      const elements = group
        .split(',')
        .map(e => e.trim())
        .filter(e => e !== '');
      if (!elements.length) return '';
      return elements.map(e => `Ataque elemental: ${e}`).join(', ');
    })
    .replace(/,\s*,/g, ', ')
    .replace(/,\s*$/g, '')
    .trim();
}

/**
 * Strips the trailing numeric value from names like "Detección del Ki 50".
 * Used only for Detección/Ocultación where the Excel appends the user's score.
 *
 * @param {string} name
 * @returns {string}
 */
export function stripTrailingValue(name) {
  if (!name) return name;
  const parts = name.split(' ');
  parts.pop();
  return parts.join(' ').trim();
}

/**
 * Normalises an Excel-emitted ability name down to its canonical form so we
 * can look it up against KI_SKILLS. Handles two patterns:
 *   - "Ataque elemental: Fuego" → "Ataque elemental"
 *   - "Detección del Ki 50"     → "Detección del Ki"
 * Names that are already canonical pass through untouched.
 *
 * @param {string} name
 * @returns {string}
 */
export function normalizeForLookup(name) {
  if (!name) return '';
  let n = name.trim();
  // Strip elemental-attack suffix ("...: Fuego")
  n = n.replace(/:\s*[^:]+$/, '').trim();
  // Strip trailing numeric value ("... 50")
  n = n.replace(/\s+\d+$/, '').trim();
  return n;
}

/**
 * Splits a comma-separated list into clean, non-empty trimmed entries.
 * @param {string} text
 * @returns {string[]}
 */
function splitEntries(text) {
  return (text || '')
    .split(',')
    .map(s => s.trim())
    .filter(s => s !== '');
}

/**
 * Builds the `system` payload for an inner item from a canonical entry.
 * Inner items don't carry Foundry Active Effects, so effects[] lives in
 * KI_SKILLS by canonicalId — calc/UI code reads them on demand via the id.
 *
 * @param {(typeof KI_SKILLS)[number] | undefined} canonical
 * @returns {object}
 */
function buildItemSystem(canonical) {
  if (!canonical) return {};
  return {
    martialKnowledge: { value: canonical.martialKnowledge },
    canonicalId: canonical.id,
    tree: {
      parent: canonical.tree.parent,
      depth: canonical.tree.depth
    }
  };
}

/**
 * Creates kiSkill and nemesisSkill inner items on the actor from the raw
 * HabilidadesKiNemesis Excel field. Each item is enriched with canonical
 * data (CM cost, tree position, canonicalId) when a match is found.
 * Unknown names are still created as inner items with empty `system`, so
 * the actor never loses an ability the player wrote in the Excel.
 *
 * @param {object} actor — ABFActor instance with createInnerItem()
 * @param {unknown} habilidadesKiNemesis — raw string from excelData.HabilidadesKiNemesis
 * @returns {Promise<{ ki: number, nemesis: number, notFound: string[] }>}
 */
export async function importKiSkills(actor, habilidadesKiNemesis) {
  const { ki, nemesis } = splitKiAndNemesis(habilidadesKiNemesis);

  const kiEntries = splitEntries(ki);
  const nemesisEntries = splitEntries(nemesis);

  const notFound = [];
  let kiCount = 0;
  let nemesisCount = 0;

  for (const rawName of kiEntries) {
    // Detección/Ocultación in the Excel come as "Name <value>"; keep canonical name only
    let displayName = rawName;
    if (
      displayName.includes('Detección del Ki') ||
      displayName.includes('Ocultación del Ki')
    ) {
      displayName = stripTrailingValue(displayName);
    }

    const canonical = findKiSkillByName(normalizeForLookup(displayName));
    if (!canonical) notFound.push(displayName);

    await actor.createInnerItem({
      name: displayName,
      type: ABFItems.KI_SKILL,
      system: buildItemSystem(canonical)
    });
    kiCount += 1;
  }

  for (const rawName of nemesisEntries) {
    const canonical = findKiSkillByName(normalizeForLookup(rawName));
    if (!canonical) notFound.push(rawName);

    await actor.createInnerItem({
      name: rawName,
      type: ABFItems.NEMESIS_SKILL,
      system: buildItemSystem(canonical)
    });
    nemesisCount += 1;
  }

  return { ki: kiCount, nemesis: nemesisCount, notFound };
}
