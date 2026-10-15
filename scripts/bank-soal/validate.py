"""
Validasi bank soal SKD 2027 (docs/BANK-SOAL-2027.md).
    python -I scripts/bank-soal/validate.py [--paket 1,2] [--no-dup] [--text-only] [--subtest TIU]
Cek: skema, sebaran kategori per paket, aturan bobot, kunci numerik (verify.expr), sebaran huruf kunci,
gambar figural ada, dan duplikat (persis & mirip) lintas seluruh paket. Exit 1 bila ada ERROR.
"""
import json, math, re, sys
from collections import Counter, defaultdict
from fractions import Fraction
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data" / "bank-soal-2027"

DIST = {
    ("TWK", "Nasionalisme"): 6, ("TWK", "Integritas"): 6, ("TWK", "Bela Negara"): 6, ("TWK", "Pilar Negara"): 7, ("TWK", "Bahasa Indonesia"): 5,
    ("TIU", "Verbal – Analogi"): 4, ("TIU", "Verbal – Silogisme"): 4, ("TIU", "Verbal – Analitis"): 4,
    ("TIU", "Numerik – Aritmatika"): 4, ("TIU", "Numerik – Deret Angka"): 4, ("TIU", "Numerik – Perbandingan Kuantitatif"): 3, ("TIU", "Numerik – Soal Cerita"): 4,
    ("TIU", "Figural – Analogi"): 3, ("TIU", "Figural – Ketidaksamaan"): 2, ("TIU", "Figural – Serial"): 3,
    ("TKP", "Pelayanan Publik"): 8, ("TKP", "Jejaring Kerja"): 8, ("TKP", "Sosial Budaya"): 8, ("TKP", "TIK"): 7, ("TKP", "Profesionalisme"): 7, ("TKP", "Anti Radikalisme"): 7,
}
NUMERIK = {"Numerik – Aritmatika", "Numerik – Deret Angka", "Numerik – Perbandingan Kuantitatif", "Numerik – Soal Cerita"}
FIGURAL = {"Figural – Analogi", "Figural – Ketidaksamaan", "Figural – Serial"}
LABELS = ["A", "B", "C", "D", "E"]
TEXT_ONLY = "--text-only" in sys.argv   # abaikan soal figural (dipakai penulis soal teks)
SUBTEST = sys.argv[sys.argv.index("--subtest") + 1].upper() if "--subtest" in sys.argv else None  # cek satu subtes saja

errors, warns = [], []
def err(qid, msg): errors.append(f"{qid}: {msg}")
def warn(qid, msg): warns.append(f"{qid}: {msg}")


def load_all(only=None):
    pk = {}
    for f in sorted(DATA.glob("paket-*.json")):
        d = json.loads(f.read_text(encoding="utf-8")); n = int(d.get("paket") or re.search(r"(\d+)", f.stem).group(1))
        if only and n not in only: continue
        pk[n] = {"title": d.get("title"), "description": d.get("description"), "questions": list(d.get("questions") or []), "file": f.name}
    fig = DATA / "figural" / "figural.json"
    if fig.exists() and not TEXT_ONLY:
        for q in json.loads(fig.read_text(encoding="utf-8")).get("questions", []):
            n = int(q.get("paket"))
            if only and n not in only: continue
            pk.setdefault(n, {"title": None, "description": None, "questions": [], "file": "-"})["questions"].append(q)
    return pk


def num(s):
    """Ambil nilai numerik dari teks opsi (mis. 'Rp12.500', '3/4', '45 menit', '12,5%')."""
    if isinstance(s, (int, float, Fraction)): return Fraction(s).limit_denominator(10**6)
    t = str(s).strip().lower().replace("rp", "").replace("−", "-")
    m = re.fullmatch(r"\s*(-?\d+)\s*/\s*(\d+)\s*", t)
    if m: return Fraction(int(m.group(1)), int(m.group(2)))
    t = re.sub(r"[a-z%°²³\s]+$", "", t).strip()
    t = re.sub(r"^[a-z\s:=]+", "", t).strip()
    if re.fullmatch(r"-?\d{1,3}(\.\d{3})+(,\d+)?", t): t = t.replace(".", "").replace(",", ".")
    elif re.fullmatch(r"-?\d+,\d+", t): t = t.replace(",", ".")
    try: return Fraction(t).limit_denominator(10**6)
    except Exception: pass
    # fallback: bilangan pertama di teks (mis. '120 km/jam', 'Rp12.500,00/bulan')
    m = re.search(r"-?\d+(?:[.,]\d+)*", str(s).replace("−", "-"))
    if not m: return None
    tok = m.group(0)
    if re.fullmatch(r"-?\d{1,3}(\.\d{3})+(,\d+)?", tok): tok = tok.replace(".", "").replace(",", ".")
    elif re.fullmatch(r"-?\d+,\d+", tok): tok = tok.replace(",", ".")
    try: return Fraction(tok).limit_denominator(10**6)
    except Exception: return None


def safe_eval(expr):
    env = {"__builtins__": {}, "math": math, "Fraction": Fraction, "abs": abs, "round": round, "min": min, "max": max,
           "sum": sum, "range": range, "len": len, "int": int, "float": float, "str": str, "pow": pow, "sorted": sorted, "list": list}
    return eval(expr, env, {})


def check_q(q, n):
    qid = q.get("id") or f"P{n:02d}-?"
    for k in ("subtest", "category", "difficulty", "body", "options", "explanation"):
        if not q.get(k): err(qid, f"field '{k}' kosong")
    st, cat = q.get("subtest"), q.get("category")
    if (st, cat) not in DIST: err(qid, f"kategori tidak dikenal: {st}/{cat}")
    if q.get("difficulty") not in ("mudah", "sedang", "sulit"): err(qid, f"difficulty '{q.get('difficulty')}'")
    if q.get("basis") not in ("pola-2024", "prediksi-2027"): warn(qid, f"basis '{q.get('basis')}'")
    if len(str(q.get("body", "")).strip()) < 15 and cat not in FIGURAL: err(qid, "teks soal terlalu pendek")
    if len(str(q.get("explanation", "")).strip()) < 20: warn(qid, "pembahasan terlalu pendek")
    opts = q.get("options") or []
    if len(opts) != 5: err(qid, f"jumlah opsi {len(opts)} (harus 5)"); return None
    if [o.get("label") for o in opts] != LABELS: err(qid, "label opsi harus A–E berurutan")
    bodies = [str(o.get("body", "")).strip() for o in opts]
    if any(not b for b in bodies): err(qid, "ada opsi kosong")
    if len(set(b.lower() for b in bodies)) != 5: err(qid, "ada opsi kembar")
    w = [o.get("weight") for o in opts]
    key = None
    if st in ("TWK", "TIU"):
        if sorted(w) != [0, 0, 0, 0, 5]: err(qid, f"bobot TWK/TIU harus satu 5 sisanya 0, dapat {w}")
        else: key = LABELS[w.index(5)]
    elif st == "TKP":
        if sorted(w) != [1, 2, 3, 4, 5]: err(qid, f"bobot TKP harus permutasi 1..5, dapat {w}")
        else: key = LABELS[w.index(5)]
    if cat in FIGURAL:
        img = q.get("image")
        if not img or not (DATA / img).exists(): err(qid, f"gambar tidak ada: {img}")
    elif q.get("image"):
        if not (DATA / q["image"]).exists(): err(qid, f"gambar tidak ada: {q['image']}")
    if cat in NUMERIK and key:
        v = q.get("verify")
        if not v or not v.get("expr"): err(qid, "soal numerik wajib punya verify.expr")
        else:
            try:
                got = safe_eval(v["expr"])
            except Exception as e:
                err(qid, f"verify.expr error: {e}"); got = None
            kb = bodies[LABELS.index(key)]
            if got is not None:
                if isinstance(got, str):
                    if got.strip().lower() != kb.lower(): err(qid, f"verify '{got}' ≠ kunci '{kb}'")
                else:
                    a, b = num(got), num(kb)
                    if a is None or b is None or abs(float(a) - float(b)) > 1e-6 * max(1, abs(float(b))):
                        # kunci bisa berupa teks yang memuat angka (mis. '120 km/jam')
                        if b is None or a is None or abs(float(a) - float(b)) > 1e-6 * max(1, abs(float(b))):
                            err(qid, f"verify={got} ≠ kunci '{kb}'")
                # pastikan tidak ada opsi lain yang bernilai sama
                if not isinstance(got, str):
                    same = [LABELS[i] for i, bd in enumerate(bodies) if num(bd) is not None and a is not None and abs(float(num(bd)) - float(a)) < 1e-9]
                    if len(same) > 1: err(qid, f"lebih dari satu opsi bernilai {got}: {same}")
    return key


def norm(s): return re.sub(r"\s+", " ", re.sub(r"[^\w\s]", " ", str(s).lower())).strip()
def shingles(s, k=3):
    w = norm(s).split(); return {" ".join(w[i:i + k]) for i in range(max(0, len(w) - k + 1))}


def main():
    only = None
    if "--paket" in sys.argv: only = {int(x) for x in sys.argv[sys.argv.index("--paket") + 1].split(",")}
    pk = load_all(only)
    if not pk: print("Tidak ada data."); sys.exit(1)
    allq = []
    for n in sorted(pk):
        qs = pk[n]["questions"]
        if SUBTEST: qs = [q for q in qs if q.get("subtest") == SUBTEST]
        keys = Counter(); cnt = Counter(); diff = Counter(); basis = Counter()
        if not pk[n]["title"]: err(f"paket {n}", "title kosong / file paket belum ada")
        ids = Counter(q.get("id") for q in qs)
        for i, c in ids.items():
            if c > 1: err(f"paket {n}", f"id kembar {i}")
        for q in qs:
            k = check_q(q, n); cnt[(q.get("subtest"), q.get("category"))] += 1; diff[q.get("difficulty")] += 1; basis[q.get("basis")] += 1
            if k and q.get("subtest") in ("TWK", "TIU"): keys[k] += 1
            allq.append((n, q))
        for kc, need in DIST.items():
            if TEXT_ONLY and kc[1] in FIGURAL: continue
            if SUBTEST and kc[0] != SUBTEST: continue
            if cnt[kc] != need: err(f"paket {n}", f"{kc[0]}/{kc[1]}: {cnt[kc]} (harus {need})")
        tot = sum(keys.values()) or 1
        for L in LABELS:
            if keys[L] / tot > 0.32: warn(f"paket {n}", f"kunci '{L}' terlalu sering ({keys[L]}/{tot})")
        print(f"paket {n:2d}: {len(qs):3d} soal | kunci {dict(sorted(keys.items()))} | {dict(diff)} | {dict(basis)}")
    if "--no-dup" not in sys.argv:
        seen = {}
        for n, q in allq:
            k = norm(q.get("body", "")) + "|" + norm(" ".join(o.get("body", "") for o in q.get("options", [])))
            if q.get("category") in FIGURAL: continue
            if k in seen: err(q.get("id"), f"duplikat persis dengan {seen[k]}")
            seen[k] = q.get("id")
        sh = [(q.get("id"), shingles(q.get("body", "")), q.get("category")) for n, q in allq if q.get("category") not in FIGURAL]
        for i in range(len(sh)):
            a_id, a, a_cat = sh[i]
            if len(a) < 6: continue
            for j in range(i + 1, len(sh)):
                b_id, b, b_cat = sh[j]
                if a_cat != b_cat or len(b) < 6: continue
                inter = len(a & b)
                if inter and inter / len(a | b) > 0.55: warn(a_id, f"mirip dengan {b_id} (Jaccard {inter / len(a | b):.2f})")
    print(f"\nTotal soal: {len(allq)} | ERROR: {len(errors)} | PERINGATAN: {len(warns)}")
    for e in errors[:200]: print("ERROR  ", e)
    for w in warns[:200]: print("WARN   ", w)
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
