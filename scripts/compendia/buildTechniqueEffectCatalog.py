# Genera el catálogo de Efectos de Técnica de Ki desde la ficha oficial.
#
# Fuente: "Ficha Anima v8.7.0.xlsm" -> pestaña "Tablas Técnicas"
#   - Cols O-X: metadatos por efecto (nombre, ref. a escalones, Tipo, Clase,
#     Características primaria+opcionales, Elementos), agrupados por categoría (>>).
#   - Cols C-L: tabla de escalones (Opción, Coste1=Ki primario, Coste2=Ki
#     secundario, CM, Mant, SMe, SMa, Nivel). Se localizan por la ref. de la col P.
#
# Salida: src/module/domine/techniques/effects/effectCatalog.data.js
# Uso:    python scripts/compendia/buildTechniqueEffectCatalog.py
# (el .xlsm es externo al repo; ajusta XL si cambia de ruta)

import os
import re
import json
import hashlib
import zipfile
import unicodedata
import xml.etree.ElementTree as ET

XL = r"D:\rol\anima\fichas\Ficha Anima v8.7.0.xlsm"
OUT = r"src\module\domine\techniques\effects\effectCatalog.data.js"
SHEET = 'xl/worksheets/sheet17.xml'  # "Tablas Técnicas"
NS = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'


def q(t):
    return NS + t


def load(path):
    z = zipfile.ZipFile(path)
    sst = []
    for si in ET.fromstring(z.read('xl/sharedStrings.xml')).findall(q('si')):
        sst.append(''.join((t.text or '') for t in si.iter(q('t'))))

    def disp(c):
        t = c.get('t')
        v = c.find(q('v'))
        iss = c.find(q('is'))
        if v is not None:
            val = v.text
            if t == 's':
                try:
                    return sst[int(val)]
                except Exception:
                    return val
            return val
        if iss is not None:
            return ''.join((tt.text or '') for tt in iss.iter(q('t')))
        return None

    cells = {}
    for row in ET.fromstring(z.read(SHEET)).find(q('sheetData')).findall(q('row')):
        for c in row.findall(q('c')):
            m = re.match(r'([A-Z]+)(\d+)', c.get('r'))
            cells[(m.group(1), int(m.group(2)))] = disp(c)
    return cells


CHAR = {'FUE': 'strength', 'DES': 'dexterity', 'AGI': 'agility', 'CON': 'constitution',
        'POD': 'power', 'VOL': 'willPower', 'INT': 'intelligence', 'PER': 'perception'}
ELEM = {'Aire': 'air', 'Agua': 'water', 'Fuego': 'fire', 'Tierra': 'earth',
        'Luz': 'light', 'Oscuridad': 'dark'}
TYPE = {'Acción': 'action', 'Asalto': 'round'}
CLASS = {'Ataque': 'attack', 'Defensa': 'defense', 'Contra': 'counter', 'Variable': 'variable'}
CATS = [('OFENSIVOS', 'offensive'), ('DEFENSIVOS', 'defensive'), ('DESTRUCTIVOS', 'destructive'),
        ('ACCION', 'action'), ('REACC', 'reaction'), ('ESPACIALES', 'spatial'),
        ('ENTEREZA', 'integrity'), ('INCREMENTO', 'increment'), ('VARIADOS', 'varied')]


def cat_of(h):
    for k, v in CATS:
        if k in h:
            return v
    return None


def slug(s):
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-zA-Z0-9]+', '-', s).strip('-').lower()


def parse_caracs(s):
    prim = None
    opt = {}
    m = re.match(r'\s*([A-Z]{3})', s)
    if m:
        prim = CHAR.get(m.group(1))
    for mm in re.finditer(r'([A-Z]{3})\+(\d+)', s):
        if mm.start() > (m.end() if m else 0):
            opt[CHAR.get(mm.group(1), mm.group(1))] = int(mm.group(2))
    return prim, opt


PACK_DIR = r"src\packs\technique-effects"
CAT_ES = {'offensive': 'Ofensivo', 'defensive': 'Defensivo', 'destructive': 'Destructivo',
          'action': 'De acción', 'reaction': 'De reacción', 'spatial': 'Espacial',
          'integrity': 'De entereza', 'increment': 'De incremento', 'varied': 'Variado'}
TYPE_ES = {'action': 'Acción', 'round': 'Asalto'}
CLASS_ES = {'attack': 'Ataque', 'defense': 'Defensa', 'counter': 'Contraataque',
            'variable': 'Variable', 'any': 'Cualquiera'}
DISADV_CLASS = {'Cualquiera': 'any', 'Ataque': 'attack', 'Defensa': 'defense'}
CHAR_ES = {'strength': 'Fuerza', 'dexterity': 'Destreza', 'agility': 'Agilidad',
           'constitution': 'Constitución', 'power': 'Poder', 'willPower': 'Voluntad',
           'intelligence': 'Inteligencia', 'perception': 'Percepción'}
ELEM_ES = {'air': 'Aire', 'water': 'Agua', 'fire': 'Fuego', 'earth': 'Tierra',
           'light': 'Luz', 'dark': 'Oscuridad'}


def effect_doc_id(slug):
    return hashlib.md5(('techEffect:' + slug).encode()).hexdigest()[:16]


def build_description(e):
    opt = ', '.join(f"{CHAR_ES.get(k, k)}+{v}" for k, v in e['optionalCharacteristics'].items())
    elems = ', '.join(ELEM_ES.get(x, x) for x in e['elements'])
    rows = ''.join(
        f"<tr><td>{t['option']}</td><td>{t['kiPrimary']}</td><td>{t['kiSecondary']}</td>"
        f"<td>{t['cm']}</td><td>{t['maint']}</td><td>{t['sMe']}</td><td>{t['sMa']}</td>"
        f"<td>{t['level']}</td></tr>"
        for t in e['tiers'])
    return (
        f"<p><strong>Categoría:</strong> {CAT_ES.get(e['category'], e['category'])} · "
        f"<strong>Tipo:</strong> {TYPE_ES.get(e['type'], e['type'] or '-')} · "
        f"<strong>Clase:</strong> {CLASS_ES.get(e['class'], e['class'] or '-')}</p>"
        f"<p><strong>Característica:</strong> "
        f"{CHAR_ES.get(e['primaryCharacteristic'], e['primaryCharacteristic'] or '-')}"
        f"{(' (opcionales: ' + opt + ')') if opt else ''}</p>"
        f"<p><strong>Elementos:</strong> {elems or '-'}</p>"
        f"<table border='1' style='border-collapse:collapse;width:100%;text-align:center'>"
        f"<thead><tr><th>Opción</th><th>Ki 1º</th><th>Ki 2º</th><th>CM</th>"
        f"<th>Mant</th><th>SMe</th><th>SMa</th><th>Nv</th></tr></thead>"
        f"<tbody>{rows}</tbody></table>")


def build_disadvantage_description(d):
    rows = ''.join(
        f"<tr><td>{o['option']}</td><td>{o['cmReduction']}</td><td>{o['level']}</td></tr>"
        for o in d['options'])
    return (
        f"<p><strong>Desventaja</strong> · <strong>Clase:</strong> {d['clazz'] or '-'}</p>"
        f"<p>Reduce el coste en CM de la Técnica (no puede bajar del límite del nivel).</p>"
        f"<table border='1' style='border-collapse:collapse;width:100%;text-align:center'>"
        f"<thead><tr><th>Opción</th><th>Reducción CM</th><th>Nv</th></tr></thead>"
        f"<tbody>{rows}</tbody></table>")


def write_pack(effects, disadvantages):
    os.makedirs(PACK_DIR, exist_ok=True)
    for fn in os.listdir(PACK_DIR):
        if fn.endswith('.json'):
            os.remove(os.path.join(PACK_DIR, fn))
    for e in effects:
        _id = effect_doc_id(e['id'])
        doc = {
            'name': e['name'], 'type': 'techniqueEffect',
            'img': 'icons/magic/light/orb-lightning-purple.webp',
            'system': {
                'kind': {'value': 'effect'}, 'category': {'value': e['category']},
                'effectType': {'value': e['type']}, 'effectClass': {'value': e['class']},
                'primaryCharacteristic': {'value': e['primaryCharacteristic']},
                'optionalCharacteristics': e['optionalCharacteristics'], 'elements': e['elements'],
                'tiers': e['tiers'], 'description': {'value': build_description(e)}
            },
            'effects': [], 'ownership': {'default': 0}, 'flags': {},
            '_id': _id, '_key': '!items!' + _id
        }
        with open(os.path.join(PACK_DIR, f"effect_{e['id']}_{_id}.json"), 'w', encoding='utf-8') as f:
            json.dump(doc, f, ensure_ascii=False, indent=2)
    for d in disadvantages:
        _id = effect_doc_id('dis:' + d['id'])
        doc = {
            'name': d['name'], 'type': 'techniqueEffect',
            'img': 'icons/magic/unholy/silhouette-robe-evil-power.webp',
            'system': {
                'kind': {'value': 'disadvantage'}, 'category': {'value': 'disadvantage'},
                'effectType': {'value': ''},
                'effectClass': {'value': DISADV_CLASS.get(d['clazz'], 'any')},
                'primaryCharacteristic': {'value': ''}, 'optionalCharacteristics': {},
                'elements': [], 'tiers': d['options'],
                'description': {'value': build_disadvantage_description(d)}
            },
            'effects': [], 'ownership': {'default': 0}, 'flags': {},
            '_id': _id, '_key': '!items!' + _id
        }
        with open(os.path.join(PACK_DIR, f"disadv_{d['id']}_{_id}.json"), 'w', encoding='utf-8') as f:
            json.dump(doc, f, ensure_ascii=False, indent=2)


def main():
    cells = load(XL)

    def g(col, r):
        v = cells.get((col, r))
        return '' if v is None else str(v).strip()

    def num(s):
        s = str(s).strip()
        return int(s) if re.fullmatch(r'-?\d+', s) else None

    effects = []
    cat = None
    for r in range(9, 600):
        o = cells.get(('O', r))
        if not o:
            continue
        o = str(o).strip()
        if o.startswith('>>'):
            cat = cat_of(o)
            continue
        if cat is None:
            continue
        mm = re.search(r'\$([A-Z])\$(\d+):\$[A-Z]\$(\d+)', g('P', r))
        if not mm:
            continue
        prim, opt = parse_caracs(g('S', r))
        elems = [ELEM.get(e.strip(), e.strip()) for e in g('W', r).split(',') if e.strip()]
        tiers = []
        for tr in range(int(mm.group(2)), int(mm.group(3)) + 1):
            ov = g('D', tr)
            if not ov:
                continue
            tiers.append({'option': ov, 'kiPrimary': num(g('E', tr)), 'kiSecondary': num(g('F', tr)),
                          'cm': num(g('G', tr)), 'maint': num(g('H', tr)),
                          'sMe': num(g('I', tr)), 'sMa': num(g('J', tr)), 'level': num(g('K', tr))})
        effects.append({'id': slug(o), 'name': o, 'category': cat, 'type': TYPE.get(g('Q', r)),
                        'class': CLASS.get(g('R', r)), 'primaryCharacteristic': prim,
                        'optionalCharacteristics': opt, 'elements': elems, 'tiers': tiers})

    disadvantages = []
    for r in range(165, 189):
        name = g('O', r)
        if not name or name.startswith('>'):
            continue
        mm = re.search(r'\$P\$(\d+):\$P\$(\d+)', g('P', r))
        if not mm:
            continue
        clazz = g('Q', r)
        options = []
        for tr in range(int(mm.group(1)), int(mm.group(2)) + 1):
            if g('O', tr).startswith('>'):
                continue
            options.append({'option': g('P', tr) or name,
                            'cmReduction': num(g('Q', tr)), 'level': num(g('R', tr))})
        disadvantages.append({'id': slug(name), 'name': name, 'clazz': clazz, 'options': options})

    def jv(v):
        return json.dumps(v, ensure_ascii=False)

    lines = ['// GENERADO desde "Ficha Anima v8.7.0.xlsm" -> pestaña "Tablas Técnicas". No editar a mano.',
             '// Regenerar con scripts/compendia/buildTechniqueEffectCatalog.py', '',
             'export const EFFECT_CATALOG = [']
    for e in effects:
        tiers = ', '.join('{ ' + ', '.join(f'{k}: {jv(v)}' for k, v in t.items()) + ' }' for t in e['tiers'])
        lines += ['  {',
                  f"    id: {jv(e['id'])}, name: {jv(e['name'])}, category: {jv(e['category'])},",
                  f"    type: {jv(e['type'])}, class: {jv(e['class'])}, primaryCharacteristic: {jv(e['primaryCharacteristic'])},",
                  f"    optionalCharacteristics: {jv(e['optionalCharacteristics'])}, elements: {jv(e['elements'])},",
                  f"    tiers: [{tiers}]", '  },']
    lines.append('];')
    lines.append('')
    lines.append('export const DISADVANTAGE_CATALOG = [')
    for d in disadvantages:
        opts = ', '.join('{ ' + ', '.join(f'{k}: {jv(v)}' for k, v in o.items()) + ' }'
                         for o in d['options'])
        lines += ['  {',
                  f"    id: {jv(d['id'])}, name: {jv(d['name'])}, class: {jv(DISADV_CLASS.get(d['clazz'], 'any'))},",
                  f"    options: [{opts}]", '  },']
    lines.append('];')
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines) + '\n')
    write_pack(effects, disadvantages)
    print(f"Efectos: {len(effects)} | escalones: {sum(len(e['tiers']) for e in effects)} | "
          f"desventajas: {len(disadvantages)} ({sum(len(d['options']) for d in disadvantages)} opciones) "
          f"-> {OUT} + compendio ({len(effects) + len(disadvantages)} items)")


if __name__ == '__main__':
    main()
