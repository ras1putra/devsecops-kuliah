# Panduan Demo CI/CD + SAST + DAST

Ringkas untuk presentasi: alur pipeline, demo ubah HTML, cara baca hasil SAST/DAST.

## 1. Alur Pipeline

```
git push (main)
   │
   ▼
CI job — "Run Quality & Test Checks"  (otomatis)
   ├── Lint (eslint)
   ├── Typecheck (tsc)
   ├── Unit test (38 test)
   ├── SAST — Semgrep scan → artifact "sast-results"
   └── Build & push image ke GHCR (ghcr.io/andirayka/uts-devops/app:latest)
   │
   ▼
Deploy job — "Deploy to Production VPS"  (otomatis setelah CI hijau)
   └── SSH ke VPS: git pull → docker compose pull → up -d → apply schema users
   │
   ▼
DAST — "OWASP ZAP Baseline Scan"  (manual / terjadwal Senin 06:00)
   └── Scan http://204.44.67.85:3126 → artifact "zap-dast-report"
```

Hasil akhir: http://204.44.67.85:3126 (login: `test@axon.com` / `password123`)

## 2. Demo Live — Ubah HTML

1. Edit teks di `src/app/login/page.tsx` (contoh: "Masuk untuk melihat dashboard" → ganti apa saja)
2. Commit & push:
   ```bash
   git add -A && git commit -m "demo: ubah teks login" && git push
   ```
3. Buka GitHub → tab **Actions** → workflow **CI & Deployment Pipeline** (run teratas):
   - Job `Run Quality & Test Checks` → semua step hijau (lint → test → SAST → build image)
   - Job `Deploy to Production VPS` → hijau setelah CI selesai
4. Tunggu ±4 menit, refresh http://204.44.67.85:3126/login — perubahan muncul (VPS menarik image baru dari GHCR)
5. Bukti SAST: di run page bagian bawah → **Artifacts** → `sast-results` (isi `semgrep-results.json`)

## 3. Cara Baca Hasil SAST (`semgrep-results.json`)

Download dari: Actions → run → Artifacts → **sast-results**.

Struktur JSON — yang penting hanya `results[]`, tiap temuan berisi:

| Field | Arti |
|-------|------|
| `check_id` | Nama rule yang kena (mis. `github-actions-mutable-action-tag`) |
| `path` + `start.line` | Lokasi file & baris |
| `extra.severity` | WARNING / ERROR / INFO |
| `extra.message` | Penjelasan + saran perbaikan |
| `extra.metadata` | Kategori CWE + OWASP |

Command cepat:
```bash
jq -r '.results[] | "\(.extra.severity) | \(.check_id) | \(.path):\(.start.line)"' semgrep-results.json
```

Isi laporan saat ini: **12 temuan, semua WARNING** —
- 9 × `github-actions-mutable-action-tag` → action pakai tag (`@v4`), rawan supply-chain; fix: pin ke commit SHA
- 2 × `request-host-used` + 1 × `possible-nginx-h2c-smuggling` → nginx pakai `$http_host`; fix: ganti `$host`
- 1 × `node_username` di `src/lib/auth-storage.ts` → **false positive** (variabel `USER_KEY` dikira hardcoded username)

Poin bicara: SAST menemukan masalah nyata (supply chain + nginx), ada false positive, tidak ada CRITICAL/HIGH.

## 4. Cara Baca Hasil DAST (`report_html.html`)

Download dari: Actions → **DAST Security Scan** → run terakhir → Artifacts → **zap-dast-report** → buka `report_html.html` di browser (atau `file:///Users/ghalyabr/Downloads/zap-dast-report/report_html.html`).

Isi report:
- **Summary** — hitungan alert per level: High / Medium / Low / Informational (contoh run terakhir: 7 WARN, 63 PASS, 0 FAIL)
- **Alert Detail** — tiap alert: Risk, Confidence, URL, Deskripsi, **Solution**, Reference
- Warna: merah = High, oranye = Medium, kuning = Low, biru = Informational

Temuan contoh & artinya:
| Alert | Arti |
|-------|------|
| `Cross-Origin-Embedder-Policy Header Missing [90004]` | Header keamanan COEP belum diset |
| `Sec-Fetch-Dest Header is Missing [90005]` | Browser modern kirim header ini; server tidak memvalidasi |
| `robots.txt / sitemap.xml 404` | Info saja, bukan celah |
| `Modern Web Application [10109]` | Info — ZAP mendeteksi ini aplikasi modern (Next.js) |

Alternatif: `report_json.json` (data mentah) dan `report_md.md` (versi teks).

Catatan: ZAP **Baseline** = passive scan (spider + cek header/cookie/config), tidak menyerang aplikasi. Active scan (XSS/SQLi) = ZAP Full Scan, belum diaktifkan.

## 5. FAQ Singkat (antisipasi pertanyaan)

- **Kenapa SAST non-blocking (`|| true`)?** Agar findings tampil dulu sebagai baseline; bisa dijadikan blocking kapan saja dengan menghapus `|| true` dan menambah `--error`.
- **Kenapa DAST manual, tidak otomatis tiap push?** Scan butuh aplikasi live; dijalankan setelah deploy stabil + terjadwal mingguan (Senin 06:00).
- **Kenapa ada 404 robots.txt di DAST?** Aplikasi belum menyediakan file itu — dilaporkan sebagai informasi, bukan error aplikasi.
- **Di mana bukti semua?** GitHub → Actions → run hijau + artifacts (`sast-results`, `zap-dast-report`).
