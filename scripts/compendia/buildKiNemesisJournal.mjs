// Genera el compendio de Diario "Habilidades de Ki y Némesis" a partir del
// catálogo canónico KI_SKILLS + las descripciones (kiSkillDescriptions). Crea 2
// JournalEntry (Ki / Némesis), una página por habilidad, con su coste en CM, la
// habilidad de la que deriva y la descripción. Idempotente (ids deterministas):
// reejecutar tras editar descripciones sólo cambia el contenido, no los ids.
//
// Uso:  node scripts/compendia/buildKiNemesisJournal.mjs
// Luego compendia:pack (en build:prod/redeploy) lo empaqueta.

import { promises as fs } from 'fs';
import crypto from 'crypto';
import { KI_SKILLS } from '../../src/module/actor/utils/excelImporter/kiSkills/kiSkills.js';
import { KI_SKILL_DESCRIPTIONS } from './kiSkillDescriptions.mjs';

const OUT_DIR = './src/packs/ki-nemesis-skills';

const id16 = seed => crypto.createHash('md5').update(seed).digest('hex').slice(0, 16);
const esc = s =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const byId = Object.fromEntries(KI_SKILLS.map(s => [s.id, s]));

function pageContent(skill) {
  const parts = [`<p><strong>Coste:</strong> ${skill.martialKnowledge} CM</p>`];
  const parent = skill.tree?.parent ? byId[skill.tree.parent] : null;
  if (parent) parts.push(`<p><strong>Deriva de:</strong> ${esc(parent.name)}</p>`);
  parts.push('<hr>');
  const desc = KI_SKILL_DESCRIPTIONS[skill.id];
  parts.push(desc ?? '<p><em>Descripción pendiente.</em></p>');
  return parts.join('\n');
}

function buildEntry(name, type, entrySort) {
  const journalId = id16('ki-nemesis-journal-' + type);
  const skills = KI_SKILLS.filter(s => s.type === type);
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
    { file: 'journal_HabilidadesDelKi.json', doc: buildEntry('Habilidades del Ki', 'ki', 100000) },
    {
      file: 'journal_HabilidadesDeNemesis.json',
      doc: buildEntry('Habilidades de Némesis', 'nemesis', 200000)
    }
  ];
  for (const { file, doc } of docs) {
    await fs.writeFile(`${OUT_DIR}/${file}`, JSON.stringify(doc, null, 2) + '\n', 'utf8');
    const withDesc = doc.pages.filter(
      p => !p.text.content.includes('Descripción pendiente')
    ).length;
    console.log(`${file}: ${doc.pages.length} páginas (${withDesc} con descripción)`);
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
