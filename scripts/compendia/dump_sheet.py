"""Utilidad de volcado de hojas del Excel oficial de Anima (lee .xlsm con stdlib).
Uso: python scripts/compendia/dump_sheet.py <sheetN.xml> [rowStart] [rowEnd] [COL,COL,...]
Imprime, por celda no vacía: valor cacheado y, entre [corchetes], la FÓRMULA si la tiene.
Ej: python scripts/compendia/dump_sheet.py sheet9.xml 1 120
    python scripts/compendia/dump_sheet.py sheet17.xml 1 60 A,B,C,D
"""
import sys, zipfile, re
import xml.etree.ElementTree as ET

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
XLSM = r"D:\rol\anima\fichas\Ficha Anima v8.7.0.xlsm"
NS = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'


def q(t):
    return NS + t


def colnum(c):
    n = 0
    for ch in c:
        n = n * 26 + (ord(ch) - 64)
    return n


def main():
    sheet = sys.argv[1] if len(sys.argv) > 1 else 'sheet9.xml'
    r0 = int(sys.argv[2]) if len(sys.argv) > 2 else 1
    r1 = int(sys.argv[3]) if len(sys.argv) > 3 else 200
    cols = set(sys.argv[4].split(',')) if len(sys.argv) > 4 else None
    z = zipfile.ZipFile(XLSM)
    sst = []
    for si in ET.fromstring(z.read('xl/sharedStrings.xml')).findall(q('si')):
        sst.append(''.join((t.text or '') for t in si.iter(q('t'))))
    rows = {}
    for row in ET.fromstring(z.read('xl/worksheets/' + sheet)).find(q('sheetData')).findall(q('row')):
        for c in row.findall(q('c')):
            m = re.match(r'([A-Z]+)(\d+)', c.get('r'))
            col, rr = m.group(1), int(m.group(2))
            if rr < r0 or rr > r1:
                continue
            if cols and col not in cols:
                continue
            t = c.get('t')
            v = c.find(q('v'))
            f = c.find(q('f'))
            iss = c.find(q('is'))
            val = None
            if v is not None:
                val = v.text
                if t == 's':
                    try:
                        val = sst[int(val)]
                    except (ValueError, IndexError):
                        pass
            elif iss is not None:
                val = ''.join((tt.text or '') for tt in iss.iter(q('t')))
            fml = '=' + f.text if (f is not None and f.text) else None
            if val is None and fml is None:
                continue
            rows.setdefault(rr, []).append((colnum(col), col, val, fml))
    for rr in sorted(rows):
        parts = []
        for _, col, val, fml in sorted(rows[rr]):
            s = f"{col}={val}" if val is not None else col
            if fml:
                s += f" [{fml}]"
            parts.append(s)
        print(f"r{rr}: " + ' | '.join(parts))


if __name__ == '__main__':
    main()
