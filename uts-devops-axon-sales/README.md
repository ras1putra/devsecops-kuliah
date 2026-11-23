# Axon Sales Dashboard

Dashboard penjualan interaktif berbasis **Next.js 16** dan database **MySQL (`classicmodels`)**, dilengkapi dengan containerization Docker (Development & Production) serta pipeline CI/CD otomatis ke server VPS via GitHub Actions.

---

## 1. Persyaratan Sistem
- **Docker** dan **Docker Compose** (v2+)
- **Node.js 24+** dan **npm** (opsional untuk run/test di host lokal)

---

## 2. Menjalankan di Lingkungan Development

Mode development menggunakan [Dockerfile.dev](Dockerfile.dev) dan [docker-compose.dev.yml](docker-compose.dev.yml). Mode ini mendukung *hot-reloading* kode lokal dan otomatis menginisialisasi database saat container pertama kali dinyalakan.

### Langkah-langkah:
1. Pastikan file `.env` sudah ada (dapat disalin dari `.env.example`):
   ```bash
   cp .env.example .env
   ```
2. Jalankan Docker Compose Dev:
   ```bash
   docker compose -f docker-compose.dev.yml up --build -d
   ```
3. Akses dashboard di browser:
   👉 **`http://localhost:3000`**

> **Catatan Inisialisasi DB di Dev:**
> Service `app` akan otomatis mengeksekusi `scripts/init-db.mjs` begitu container MySQL berstatus *healthy*. Script ini bersifat *idempotent* (hanya meng-import dump SQL jika tabel belum ada).

Untuk mematikan container:
```bash
docker compose -f docker-compose.dev.yml down
```

---

## 3. Menjalankan di Lingkungan Production (App + Nginx + Monitoring)

Mode production menggunakan [docker-compose.prod.yml](docker-compose.prod.yml) dengan arsitektur **Single Entrypoint** via **Nginx Reverse Proxy**. Semua layanan (Next.js, MySQL, Prometheus, Grafana, dan MySQL Exporter) terintegrasi dalam 1 file compose:

- **Nginx Reverse Proxy**: Mengatur lalu lintas pada 1 port publik (`${PORT}`, default `3126`).
- **Next.js App**: Berjalan di container terisolasi ([Dockerfile.prod](Dockerfile.prod), non-root user `nextjs` UID 1001).
- **Database MySQL**: Database relasional dengan skema `classicmodels`.
- **mysqld-exporter**: Mengekspos metrik performa MySQL internal (`:9104`).
- **Node Exporter**: Memantau kesehatan OS/host VPS (CPU, RAM, Disk, Load) via socket host (`:9100`).
- **cAdvisor**: Memantau konsumsi resource per-container Docker secara real-time (`:8080`).
- **Prometheus**: Mengumpulkan metrik secara internal dari semua exporter. Port 9090 terisolasi di jaringan internal Docker demi keamanan.
- **Grafana**: Visualisasi metrik terintegrasi langsung via subpath `/grafana/` dengan dashboard auto-provisioned.
- **Loki & Fluent Bit**: Aggregator & log shipper tersentralisasi untuk mengumpulkan log container secara real-time.


### Langkah-langkah:
1. Jalankan Docker Compose Prod:
   ```bash
   docker compose -f docker-compose.prod.yml up --build -d
   ```
2. **Inisialisasi Database (Manual 1x Saat Pertama Kali Deploy)**:
   Di mode production, database tidak diinisialisasi otomatis untuk menghindari modifikasi data tanpa sengaja. Jalankan perintah berikut untuk mengisi database pertama kali:
   ```bash
   docker compose -f docker-compose.prod.yml exec -T mysql mysql -uroot -p${DB_PASSWORD} classicmodels < database/init.sql
   ```
3. **Akses Layanan (Semua Lewat Port 3126)**:
   - 👉 **Web Dashboard**: `http://localhost:3126/` (atau `http://axon-kelompok-1.my.id/`)
   - 👉 **Grafana Monitoring**: `http://localhost:3126/grafana/`
     - Default login: user `admin`, password `admin`
     - Dashboard siap pakai: **`Axon Sales Dashboard - System & HTTP Monitoring`** (bisa dibuka langsung di `http://localhost:3126/grafana/d/axon-sales-monitoring`)
     - Datasource Prometheus & panel otomatis terpasang tanpa setup manual.


Untuk mematikan:
```bash
docker compose -f docker-compose.prod.yml down
```


---

## 4. CI/CD & Otomatisasi Deploy ke VPS (GitHub Actions)

Alur deployment dikonfigurasi di [.github/workflows/deploy.yml](.github/workflows/deploy.yml).

### Alur Kerja (Workflow):
1. **Continuous Integration (CI)**: Otomatis berjalan setiap kali ada `git push` ke branch `main`. Menjalankan:
   - `npm run lint` (ESLint)
   - `npm run typecheck` (TypeScript check)
   - `npm test` (Unit test)
2. **Continuous Deployment (CD)**: Berjalan **secara manual** (*workflow_dispatch*) untuk keamanan rilis. Ketika tombol **"Run workflow"** ditekan di tab Actions GitHub:
   - GitHub Actions login via SSH ke VPS.
   - Menjalankan `git pull origin main`.
   - Menjalankan `docker compose -f docker-compose.prod.yml up --build -d`.

### GitHub Secrets yang Dibutuhkan:
Atur rahasia berikut di menu **Settings → Secrets and variables → Actions**:
- `VPS_HOST`: IP publik VPS Anda (contoh: `204.44.67.85`)
- `VPS_USERNAME`: Username login SSH VPS (contoh: `root`)
- `VPS_SSH_KEY`: Private Key SSH untuk login ke VPS

---

## 5. Pengujian & Linting Lokal

```bash
npm test          # Menjalankan unit test (Vitest)
npm run lint      # Pemeriksaan linter ESLint
npm run typecheck # Pemeriksaan tipe data TypeScript
npm run build     # Uji coba build Next.js standalone
```

## 6. Sumber data dan pemetaan MySQL

Di host lokal, `DATA_SOURCE` menerima `demo` atau `mysql` dan default ke `demo`.
Untuk memakai MySQL, siapkan database `classicmodels` kosong lalu isi
`.env.local`:

```dotenv
DATA_SOURCE=mysql
DATABASE_URL=mysql://axon:<password-url-encoded>@127.0.0.1:3306/classicmodels
```

Jalankan `npm run db:setup` sebelum `npm run dev`. Script hanya menerima URL
loopback untuk `/classicmodels` dan menolak database yang sudah memiliki tabel
atau view. Dump dosen berisi `DROP TABLE IF EXISTS`; gunakan database/volume
disposable, bukan database bersama. Untuk mengulang impor, buat database kosong
yang baru.

Di Docker Compose, service aplikasi menggunakan `DATA_SOURCE=mysql` dan
`DATABASE_URL` menuju service `mysql`; konfigurasi host/user/password/database
berasal dari variabel `DB_*` di `.env`. Kredensial dengan karakter khusus harus
di-URL-encode jika disusun sebagai URL koneksi.

Backend membaca satu `Sale` per order dari `orders`, menggabungkan nama produk
per order, mempertahankan jumlah DECIMAL tanpa `ROUND()`, dan memetakan status
`Shipped`/`Resolved` ke `completed`, `Cancelled` ke `cancelled`, serta status
lainnya ke `processing`. `channel` pada data MySQL adalah negara pelanggan,
bukan kanal penjualan. Nilai dalam dump tidak menyatakan mata uang; UI tidak
memformatnya sebagai IDR atau USD.

SQL sumber dan hash provenance ada di `database/source/README.md`. Hasil
verifikasi dump, analisis, dan perbedaan SQL koreksi ada di
`database/verification/ANALYSIS.md`; SQL asli tidak diubah.
