#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Genera el catalogo de Artes Marciales (datos numericos AUTORITATIVOS) leyendo la
ficha oficial Excel. Fuente: Tablas!D850:AC939 (Tabla_ArtesMarciales).

Modelo verificado contra las formulas del Excel:
- Los valores por grado en el Excel son INCREMENTOS. La col Y (Adquirido) cascada
  (Supremo activa Avanzado y Base), y la fila 940 SUMA todas las filas con Y=1.
  Por tanto el bono efectivo al dominar un grado = SUMA de su grado + inferiores.
  => aqui emitimos el valor ACUMULADO por grado para attack/block/dodge/turn/
     sturdiness/breakage/damageBonus/master*/cm.
- El Dano Base (col E) NO se acumula: Q941 = MAX(X850:X939). Se toma el valor del
  grado poseido y, entre varias artes, el mayor. Se emite por grado (no acumulado).

Re-generable: python scripts/compendia/buildMartialArtCatalog.py
"""
import zipfile, re, os, sys, unicodedata
import xml.etree.ElementTree as ET

XLSM = r"D:\rol\anima\fichas\Ficha Anima v8.7.0.xlsm"
OUT = os.path.join(os.path.dirname(__file__), "..", "..",
                   "src", "module", "combat", "martialArts", "martialArtCatalog.data.js")
NS = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
GRADE_MAP = {'Base': 'base', 'Avanzado': 'advanced', 'Supremo': 'supreme', 'Arcano': 'arcane'}
GRADE_ORDER = {'basic': ['base', 'advanced', 'supreme'], 'advanced': ['base', 'arcane']}
# Columnas de COMBATE: en el Excel son INCREMENTOS por grado; se acumulan (cascada Y + suma fila 940).
ACC = {'F': 'damageBonus', 'H': 'attack', 'I': 'dodge', 'J': 'block',
       'K': 'turn', 'L': 'sturdiness', 'M': 'breakage', 'V': 'masterAttack', 'W': 'masterDefense'}
# CM (col G): el Excel YA almacena el acumulado por grado (Aikido 0/10/20 = deltas manual 0/+10/+10).
# Por tanto se usa el valor de la fila TAL CUAL, sin re-acumular.


def load_cells():
    z = zipfile.ZipFile(XLSM)
    ss = []
    for si in ET.fromstring(z.read('xl/sharedStrings.xml')).findall(f'{NS}si'):
        ss.append(''.join(t.text or '' for t in si.iter(f'{NS}t')))
    wb = z.read('xl/workbook.xml').decode('utf-8', 'replace')
    rels = z.read('xl/_rels/workbook.xml.rels').decode('utf-8', 'replace')
    rid = dict(re.findall(r'name="([^"]+)"[^>]*r:id="([^"]+)"', wb))['Tablas']
    tgt = dict(re.findall(r'Id="([^"]+)"[^>]*Target="([^"]+)"', rels))[rid]
    xml = z.read('xl/' + tgt.lstrip('/')).decode('utf-8', 'replace')
    cells = {}
    for m in re.finditer(r'<c r="([A-Z]+\d+)"([^>]*?)(?:/>|>(.*?)</c>)', xml, re.S):
        ref, attrs, inner = m.group(1), m.group(2), (m.group(3) or '')
        t = re.search(r't="([^"]+)"', attrs); t = t.group(1) if t else 'n'
        vm = re.search(r'<v>(.*?)</v>', inner, re.S); fm = re.search(r'<f>(.*?)</f>', inner, re.S)
        val = vm.group(1) if vm else ''
        if t == 's' and val != '':
            val = ss[int(val)]
        cells[ref] = (val, fm.group(1) if fm else '')
    return cells


def slug(name):
    s = unicodedata.normalize('NFKD', name).encode('ascii', 'ignore').decode()
    parts = re.split(r'[\s\-]+', s.strip())
    return parts[0].lower() + ''.join(p.capitalize() for p in parts[1:])


def num(v):
    try:
        return int(float(v))
    except (TypeError, ValueError):
        return 0


def parse_damage_base(formula, value):
    """col E: formula '10+Bono_Fue', '20+2*Bono_Pod', literal '0', o especial."""
    f = (formula or '').strip()
    if not f:
        n = num(value)
        return {'base': n, 'characteristic': None, 'mult': 0}
    if 'Presencia' in f:  # Exelion: 2*Presencia+Pod-... (inmodificable)
        return {'base': 0, 'characteristic': None, 'mult': 0, 'special': 'exelion'}
    m = re.match(r'^(\d+)\+(?:(\d+)\*)?Bono_(Fue|Pod)$', f)
    if m:
        char = 'strength' if m.group(3) == 'Fue' else 'power'
        return {'base': int(m.group(1)), 'characteristic': char, 'mult': int(m.group(2) or 1)}
    return {'base': num(value), 'characteristic': None, 'mult': 0, 'raw': f}


def clean_special(v):
    s = str(v or '').strip()
    if s in ('-', '--', 'NO', 'No', 'no', '—', ''):
        return ''
    return s


def main():
    cells = load_cells()

    def g(col, row):
        return cells.get(f'{col}{row}', ('', ''))

    arts = {}  # slug -> dict
    order = []
    cur_type = 'basic'
    for row in range(851, 940):
        name, _ = g('D', row)
        name = str(name).strip()
        if not name:
            continue
        if name.startswith('>'):
            # Encabezado de seccion. El bloque de Avanzadas empieza en ">A. MARCIALES AVANZADAS".
            if 'AVANZAD' in name.upper():
                cur_type = 'advanced'
            continue
        m = re.match(r'^(.*?)\s*\((\w+)\)\s*$', name)
        if not m:
            continue
        art_name, grade_label = m.group(1).strip(), m.group(2).strip()
        grade = GRADE_MAP.get(grade_label)
        if not grade:
            continue
        sid = slug(art_name)
        if sid not in arts:
            arts[sid] = {'name': art_name, 'type': cur_type, 'rows': {}}
            order.append(sid)
        ev, ef = g('E', row)
        deltas = {out: num(g(col, row)[0]) for col, out in ACC.items()}
        cm = num(g('G', row)[0])  # ya acumulado en el Excel
        special = clean_special(g('N', row)[0])  # col N = Especial (texto)
        arts[sid]['rows'][grade] = {'deltas': deltas, 'cm': cm, 'special': special,
                                    'damageBase': parse_damage_base(ef, ev)}

    # acumular por grado
    for sid, art in arts.items():
        seq = GRADE_ORDER[art['type']]
        acc = {out: 0 for out in ACC.values()}
        grades = {}
        special = {}
        for grade in seq:
            r = art['rows'].get(grade)
            if not r:
                continue
            for out in ACC.values():
                acc[out] += r['deltas'][out]
            entry = {k: acc[k] for k in acc}
            entry['cm'] = r['cm']  # directo (col G ya acumulada), NO re-acumular
            entry['damageBase'] = r['damageBase']
            grades[grade] = entry
            if r['special']:
                special[grade] = r['special']
        art['grades'] = grades
        art['special'] = special
        del art['rows']

    # emitir JS
    def jsval(v):
        if isinstance(v, dict):
            return '{ ' + ', '.join(f'{k}: {jsval(x)}' for k, x in v.items()) + ' }'
        if v is None:
            return 'null'
        if isinstance(v, str):
            return "'" + v.replace("'", "\\'") + "'"
        return str(v)

    lines = []
    lines.append('// AUTO-GENERADO por scripts/compendia/buildMartialArtCatalog.py — no editar a mano.')
    lines.append('// Fuente: Ficha Anima v8.7.0.xlsm, Tablas!D850:AC939. Valores ACUMULADOS por grado.')
    lines.append('// damageBase: { base, characteristic: "strength"|"power"|null, mult }. special/requirements')
    lines.append('// (texto informativo del manual) se enriquecen aparte; aqui van vacios.')
    lines.append('')
    lines.append('export const MARTIAL_ARTS = {')
    for sid in order:
        art = arts[sid]
        lines.append(f"  {sid}: {{")
        lines.append(f"    name: {jsval(art['name'])}, type: {jsval(art['type'])},")
        lines.append(f"    grades: {{")
        for grade, e in art['grades'].items():
            db = jsval(e['damageBase'])
            nums = ', '.join(f'{k}: {e[k]}' for k in ['cm', 'attack', 'block', 'dodge', 'turn',
                                                      'sturdiness', 'breakage', 'damageBonus',
                                                      'masterAttack', 'masterDefense'])
            lines.append(f"      {grade}: {{ {nums}, damageBase: {db} }},")
        lines.append(f"    }},")
        sp = art.get('special', {})
        if sp:
            sp_str = ', '.join(f'{gr}: {jsval(txt)}' for gr, txt in sp.items())
            lines.append(f"    special: {{ {sp_str} }}, requirements: {{}}")
        else:
            lines.append(f"    special: {{}}, requirements: {{}}")
        lines.append(f"  }},")
    lines.append('};')
    lines.append('')
    lines.append('export const MARTIAL_ART_IDS = [' + ', '.join(jsval(s) for s in order) + '];')
    lines.append('')
    lines.append('export const MARTIAL_ART_GRADES = {')
    lines.append("  basic: ['base', 'advanced', 'supreme'],")
    lines.append("  advanced: ['base', 'arcane']")
    lines.append('};')
    lines.append('')

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    print(f"Escrito {os.path.normpath(OUT)} — {len(order)} artes")


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    main()
