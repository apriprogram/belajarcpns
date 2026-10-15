"""
Muat bank soal SKD 2027 ke aplikasi (docs/BANK-SOAL-2027.md).
    python -I scripts/bank-soal/load.py            # dry-run: tampilkan rencana
    python -I scripts/bank-soal/load.py --apply    # HAPUS data lama + muat data baru

Langkah --apply:
 1. Validasi (validate.py) harus lolos tanpa ERROR.
 2. Hapus SEMUA paket (ikut terhapus: attempts, hasil, riwayat) dan SEMUA soal (ikut: opsi, jawaban latihan).
    Backup dulu: docker exec bisa-pns-db-1 pg_dump -U bisapns -d bisapns -Fc > backups/<nama>.dump
 3. Rapikan kategori TIU (tambah yang kurang, ubah "Figural/Logika" → "Figural – Serial").
 4. Unggah gambar figural (POST /api/admin/uploads), buat soal (status terbit), buat 10 paket, isi urutan
    TWK → TIU → TKP, lalu terbitkan. Peta ID ditulis ke data/bank-soal-2027/_loaded.json.
"""
import json, mimetypes, subprocess, sys, uuid, urllib.request, urllib.error, http.cookiejar
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data" / "bank-soal-2027"
API = "http://localhost:8080/api"
ADMIN = {"email": "admin@bisapns.id", "password": "Admin123!"}
DB = ["docker", "exec", "-i", "bisa-pns-db-1", "psql", "-U", "bisapns", "-d", "bisapns", "-v", "ON_ERROR_STOP=1", "-At"]
ORDER = {"TWK": 0, "TIU": 1, "TKP": 2}
CAT_ORDER = ["Nasionalisme", "Integritas", "Bela Negara", "Pilar Negara", "Bahasa Indonesia",
             "Verbal – Analogi", "Verbal – Silogisme", "Verbal – Analitis", "Numerik – Aritmatika", "Numerik – Deret Angka",
             "Numerik – Perbandingan Kuantitatif", "Numerik – Soal Cerita", "Figural – Analogi", "Figural – Ketidaksamaan", "Figural – Serial",
             "Pelayanan Publik", "Jejaring Kerja", "Sosial Budaya", "TIK", "Profesionalisme", "Anti Radikalisme"]
NEED_CATS = {"TIU": ["Verbal – Analogi", "Verbal – Silogisme", "Verbal – Analitis", "Numerik – Aritmatika", "Numerik – Deret Angka",
                     "Numerik – Perbandingan Kuantitatif", "Numerik – Soal Cerita", "Figural – Analogi", "Figural – Ketidaksamaan", "Figural – Serial"]}


class Api:
    def __init__(self):
        self.op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
        r = self.call("POST", "/auth/login", ADMIN)
        assert r.get("success"), r

    def call(self, m, p, body=None, raw=None, ctype="application/json"):
        data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
        req = urllib.request.Request(API + p, method=m, data=data, headers={"Content-Type": ctype} if data is not None else {})
        try:
            return json.loads(self.op.open(req, timeout=60).read() or b"{}")
        except urllib.error.HTTPError as e:
            try: return json.loads(e.read() or b"{}") | {"_status": e.code}
            except Exception: return {"success": False, "_status": e.code}

    def upload(self, path):
        b = uuid.uuid4().hex; ctype = mimetypes.guess_type(path.name)[0] or "image/png"
        body = (f"--{b}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"{path.name}\"\r\nContent-Type: {ctype}\r\n\r\n").encode() + path.read_bytes() + f"\r\n--{b}--\r\n".encode()
        r = self.call("POST", "/admin/uploads", raw=body, ctype=f"multipart/form-data; boundary={b}")
        assert r.get("success"), (path.name, r)
        return r["data"]["url"]


def sql(q):
    out = subprocess.run(DB + ["-c", q], capture_output=True, text=True, encoding="utf-8")
    if out.returncode: raise SystemExit(f"SQL gagal: {out.stderr}")
    return out.stdout.strip()


def load_packages():
    sys.path.insert(0, str(Path(__file__).parent))
    import validate
    pk = validate.load_all()
    for n in pk:
        pk[n]["questions"].sort(key=lambda q: (ORDER[q["subtest"]], CAT_ORDER.index(q["category"]), q.get("id", "")))
    return pk


def main():
    apply = "--apply" in sys.argv
    v = subprocess.run([sys.executable, "-I", str(Path(__file__).parent / "validate.py"), "--no-dup"], capture_output=True, text=True, encoding="utf-8")
    print(v.stdout[-1500:])
    if v.returncode:
        raise SystemExit("Validasi gagal — perbaiki data dulu.")
    pk = load_packages()
    total = sum(len(p["questions"]) for p in pk.values())
    print(f"Rencana: {len(pk)} paket, {total} soal. Data lama: " + sql("select count(*) from questions") + " soal, " + sql("select count(*) from exam_packages") + " paket, " + sql("select count(*) from attempts") + " attempt.")
    if not apply:
        print("Dry-run. Jalankan dengan --apply untuk menghapus data lama dan memuat data baru."); return

    api = Api()
    # 2. hapus data lama (cascade: attempts, results, package_questions, opsi, jawaban)
    print("Menghapus data lama…")
    sql("BEGIN; DELETE FROM exam_packages; DELETE FROM questions; COMMIT;")
    # 3. kategori
    sql("UPDATE categories SET name='Figural – Serial' WHERE code='TIU' AND name='Figural/Logika'")
    cats = {}
    for row in sql("select id, code, name from categories where parent_id is not null").splitlines():
        i, code, name = row.split("|", 2); cats[(code, name)] = int(i)
    for code, names in NEED_CATS.items():
        for name in names:
            if (code, name) not in cats:
                r = api.call("POST", "/admin/categories", {"code": code, "name": name}); assert r.get("success"), r
                cats[(code, name)] = r["data"]["id"]; print("  kategori baru:", code, name)
    # 4. gambar → soal → paket
    loaded = {"packages": []}
    img_cache = {}
    for n in sorted(pk):
        p = pk[n]; ids = []
        for q in p["questions"]:
            img = ""
            if q.get("image"):
                path = DATA / q["image"]
                if path not in img_cache: img_cache[path] = api.upload(path)
                img = img_cache[path]
            payload = {"subtest": q["subtest"], "category_id": cats[(q["subtest"], q["category"])], "body": q["body"].strip(),
                       "image_url": img, "difficulty": q["difficulty"], "explanation": q["explanation"].strip(), "status": "terbit",
                       "options": [{"label": o["label"], "body": o["body"], "weight": int(o["weight"])} for o in q["options"]]}
            r = api.call("POST", "/admin/questions", payload)
            if not r.get("success"): raise SystemExit(f"Gagal membuat soal {q.get('id')}: {r}")
            ids.append(r["data"]["id"])
        r = api.call("POST", "/admin/packages", {"title": p["title"], "description": p["description"], "duration_minutes": 100,
                                                  "shuffle_questions": False, "shuffle_options": False,  # opsi figural "Gambar A–E" harus sesuai label di gambar
                                                  "pass_twk": 65, "pass_tiu": 80, "pass_tkp": 166, "pass_total": 0})
        if not r.get("success"): raise SystemExit(f"Gagal membuat paket {n}: {r}")
        pid = r["data"]["id"]
        r = api.call("PUT", f"/admin/packages/{pid}/questions", {"question_ids": ids}); assert r.get("success"), r
        r = api.call("PATCH", f"/admin/packages/{pid}/status", {"status": "terbit"}); assert r.get("success"), r
        loaded["packages"].append({"paket": n, "id": pid, "title": p["title"], "questions": len(ids)})
        print(f"  paket {n:2d}: {p['title']} — {len(ids)} soal, terbit")
    (DATA / "_loaded.json").write_text(json.dumps(loaded, ensure_ascii=False, indent=1), encoding="utf-8")
    print("Selesai:", sql("select count(*) from questions"), "soal,", sql("select count(*) from exam_packages"), "paket.")


if __name__ == "__main__":
    main()
