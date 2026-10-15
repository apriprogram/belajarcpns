"""
Gabungkan bagian soal per paket → data/bank-soal-2027/paket-NN.json.
Bagian: data/bank-soal-2027/parts/pNN-twk.json, pNN-tiu.json, pNN-tkp.json  ({"paket": N, "questions": [...]})
Soal figural tetap di figural/figural.json (digabung saat validasi/muat).
    python -I scripts/bank-soal/merge.py [--paket 1,2]
"""
import json, sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
DATA = Path(__file__).resolve().parents[2] / "data" / "bank-soal-2027"
FOCUS = {
    1: "Pola soal CPNS 2024 tingkat dasar: cocok untuk tryout pertama.",
    2: "Pola soal CPNS 2024 dengan porsi soal cerita dan silogisme lebih banyak.",
    3: "Pola soal CPNS 2024 tingkat menengah; studi kasus TWK dan TKP pelayanan publik.",
    4: "Pola soal CPNS 2024 tingkat menengah; latihan manajemen waktu 100 menit.",
    5: "Pola soal CPNS 2024 tingkat menengah–sulit; evaluasi kesiapan sebelum paket prediksi.",
    6: "Prediksi CPNS 2027: soal HOTS, digitalisasi layanan, dan nilai BerAKHLAK.",
    7: "Prediksi CPNS 2027: TKP teknologi & keamanan data, TIU analitis kontekstual.",
    8: "Prediksi CPNS 2027: wawasan kebangsaan terkini, moderasi beragama, dan anti radikalisme.",
    9: "Prediksi CPNS 2027 tingkat sulit: kombinasi aturan figural dan soal cerita bertingkat.",
    10: "Prediksi CPNS 2027 tingkat sulit: simulasi akhir menyerupai hari H.",
}


def main():
    only = None
    if "--paket" in sys.argv: only = {int(x) for x in sys.argv[sys.argv.index("--paket") + 1].split(",")}
    for n in range(1, 11):
        if only and n not in only: continue
        qs = []
        for part in ("twk", "tiu", "tkp"):
            f = DATA / "parts" / f"p{n:02d}-{part}.json"
            if f.exists():
                d = json.loads(f.read_text(encoding="utf-8")); qs += d.get("questions", [])
        if not qs: continue
        out = {"paket": n, "title": f"Tryout SKD CPNS 2027 #{n}",
               "description": f"Simulasi SKD lengkap 110 soal (30 TWK, 35 TIU, 45 TKP) dalam 100 menit. {FOCUS[n]}",
               "questions": qs}
        (DATA / f"paket-{n:02d}.json").write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"paket-{n:02d}.json: {len(qs)} soal teks")


if __name__ == "__main__":
    main()
