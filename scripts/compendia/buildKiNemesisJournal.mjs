// Genera el compendio de Diario "Habilidades de Ki y Némesis" a partir del
// catálogo canónico KI_SKILLS + las descripciones (kiSkillDescriptions). Crea 2
// JournalEntry (Ki / Némesis), una página por habilidad, con su coste en CM, la
// habilidad de la que deriva y la descripción. Idempotente (ids deterministas):
// reejecutar tras editar descripciones sólo cambia el contenido, no los ids.
//
// Uso:  node scripts/compendia/buildKiNemesisJournal.mjs
// --elemental-only actualiza sólo las páginas elementales, conservando el resto.
// Luego compendia:pack (en build:prod/redeploy) lo empaqueta.

import { promises as fs } from 'fs';
import crypto from 'crypto';
import {
  KI_SKILLS,
  ELEMENTAL_KI_SKILLS,
  findKiSkillById
} from '../../src/module/actor/utils/excelImporter/kiSkills/kiSkills.js';
import { KI_SKILL_DESCRIPTIONS } from './kiSkillDescriptions.mjs';

const OUT_DIR = './src/packs/ki-nemesis-skills';

const id16 = seed => crypto.createHash('md5').update(seed).digest('hex').slice(0, 16);
const esc = s =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const byId = Object.fromEntries(KI_SKILLS.map(s => [s.id, s]));

function pageContent(skill) {
  const cost = `${skill.martialKnowledge} CM${
    skill.elementOverview ? ' por elemento' : ''
  }`;
  const parts = [`<p><strong>Coste:</strong> ${cost}</p>`];
  if (skill.element)
    parts.push(`<p><strong>Elemento:</strong> ${esc(skill.element)}</p>`);
  const parent = skill.tree?.parent ? byId[skill.tree.parent] : null;
  if (parent) parts.push(`<p><strong>Deriva de:</strong> ${esc(parent.name)}</p>`);
  parts.push('<hr>');
  const desc =
    KI_SKILL_DESCRIPTIONS[skill.id] ??
    (skill.element ? KI_SKILL_DESCRIPTIONS.elementalAttack : undefined);
  parts.push(desc ?? '<p><em>Descripción pendiente.</em></p>');
  return parts.join('\n');
}

function buildEntry(name, type, entrySort) {
  const journalId = id16('ki-nemesis-journal-' + type);
  const skills = KI_SKILLS.filter(s => s.type === type);
  const elementalIndex = skills.findIndex(s => s.element);
  if (elementalIndex !== -1) {
    // Preserve the old overview page's UUID for existing journal links.
    skills.splice(elementalIndex, 0, {
      ...findKiSkillById('elementalAttack'),
      name: 'Ataque elemental (resumen)',
      elementOverview: true
    });
  }
  const pages = skills.map((s, i) => {
    const pageId = id16('ki-nemesis-page-' + s.id);
    return {
      sort: (i + 1) * 100000,
      name: s.name,
      type: 'text',
      _id: pageId,
      title: { show: true, level: 1 },
      image: {},
      text: { format: 1, content: pageContent(s) },
      video: { controls: true, volume: 0.5 },
      src: null,
      system: {},
      ownership: { default: -1 },
      flags: {},
      _key: `!journal.pages!${journalId}.${pageId}`
    };
  });
  return {
    name,
    pages,
    folder: null,
    flags: {},
    ownership: { default: 0 },
    _id: journalId,
    sort: entrySort,
    _key: `!journal!${journalId}`
  };
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const docs = [
    {
      file: 'journal_HabilidadesDelKi.json',
      doc: buildEntry('Habilidades del Ki', 'ki', 100000)
    },
    {
      file: 'journal_HabilidadesDeNemesis.json',
      doc: buildEntry('Habilidades de Némesis', 'nemesis', 200000)
    }
  ];
  for (const { file, doc } of docs) {
    let output = doc;
    if (process.argv.includes('--elemental-only')) {
      if (file !== 'journal_HabilidadesDelKi.json') continue;
      output = JSON.parse(await fs.readFile(`${OUT_DIR}/${file}`, 'utf8'));
      const elementIds = ELEMENTAL_KI_SKILLS.map(skill =>
        id16('ki-nemesis-page-' + skill.id)
      );
      output.pages = output.pages.filter(page => !elementIds.includes(page._id));
      const overviewId = id16('ki-nemesis-page-elementalAttack');
      const index = output.pages.findIndex(page => page._id === overviewId);
      if (index === -1) throw new Error('Missing elemental attack overview page');
      const start = output.pages[index].sort;
      const end = output.pages[index + 1]?.sort ?? start + 100000;
      const step = Math.floor((end - start) / (elementIds.length + 1));
      const overview = {
        ...doc.pages.find(page => page._id === overviewId),
        sort: start
      };
      const elements = elementIds.map((id, i) => ({
        ...doc.pages.find(page => page._id === id),
        sort: start + step * (i + 1)
      }));
      output.pages.splice(index, 1, overview, ...elements);
    }
    await fs.writeFile(
      `${OUT_DIR}/${file}`,
      JSON.stringify(output, null, 2) + '\n',
      'utf8'
    );
    const withDesc = output.pages.filter(
      p => !p.text.content.includes('Descripción pendiente')
    ).length;
    console.log(`${file}: ${output.pages.length} páginas (${withDesc} con descripción)`);
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
