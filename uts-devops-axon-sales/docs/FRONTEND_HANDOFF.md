# Handoff Axon Sales: Next.js dan MySQL

## Arsitektur dan konfigurasi

Browser memanggil API Next.js. Hanya server Next.js yang membuka koneksi ke
MySQL; `src/lib/sales-repository.ts` memakai `server-only` dan `mysql2`. Browser
tidak terhubung langsung ke database.

`.env.example` menyediakan `DATA_SOURCE=demo` dan `DATABASE_URL=`. Sumber yang
diterima adalah `demo` atau `mysql`; bila tidak diatur, aplikasi memakai `demo`.
Mode MySQL memerlukan URL `mysql:` untuk database `classicmodels`. Kegagalan
koneksi menghasilkan error; aplikasi tidak beralih diam-diam ke demo. Simpan
nilai lokal di `.env.local`, jangan commit atau menambahkan `DATABASE_URL` ke
`NEXT_PUBLIC_*`.

Setelah mengubah `DATABASE_URL` atau `DATA_SOURCE`, restart server Next.js; pool
mempertahankan koneksi pertamanya dan tidak membaca ulang perubahan environment
secara otomatis.

## API dan kontrak data

- `GET /api/sales`: `200` dengan
  `{ source: "demo" | "mysql", sales: Sale[] }`; bila data tidak tersedia,
  `503` dengan pesan umum `error` dan `source` bila konfigurasi valid. Detail
  koneksi tidak dikirim ke browser.
- `GET /api/health`: `200` jika siap, `503` jika belum. JSON readiness berisi
  `ready`, `database` (`not_required`, `connected`, `misconfigured`, atau
  `unavailable`) dan `source` bila diketahui.
- Halaman memakai `/api/sales`, menampilkan sumber data, serta menyediakan status
  loading dan error dengan retry.

`Sale` didefinisikan di `src/lib/dashboard-data.ts` dan bentuk ini tidak berubah:

| Properti | Tipe | Makna/format |
| --- | --- | --- |
| `id` | `string` | Nomor order untuk MySQL; ID transaksi untuk demo |
| `customer` | `string` | Nama pelanggan |
| `product` | `string` | Ringkasan produk yang dipesan |
| `date` | `string` | Tanggal ISO `YYYY-MM-DD` |
| `amount` | `number` | Jumlah order; mata uang tidak diasumsikan untuk MySQL |
| `status` | `SaleStatus` | `completed`, `processing`, atau `cancelled` |
| `channel` | `string` | Kanal demo atau negara pelanggan untuk MySQL |

Backend membaca satu baris per order, bukan per detail order. `amount` dihitung
dengan `SUM(quantityOrdered * priceEach)` dari DECIMAL tanpa `ROUND()` dan
dikonversi ke number sesuai kontrak bersama. Status sumber `Shipped`/`Resolved`
menjadi `completed`, `Cancelled` menjadi `cancelled`, dan status lainnya menjadi
`processing`. Untuk MySQL, `channel` berasal dari `customers.country`; tampilkan
sebagai negara, bukan sebagai kanal penjualan.

Ringkasan produk memakai `GROUP_CONCAT` dengan `group_concat_max_len=8192` pada
query. Ringkasan terpanjang dalam dump yang diuji adalah 498 karakter; nilai ini
berada di bawah batas bawaan MySQL 1.024 karakter. Pool dibatasi hingga 5 koneksi
dengan antrean maksimum 10, timeout koneksi 3 detik, timeout readiness 3 detik,
dan timeout query penjualan 5 detik.

Nilai demo adalah Rupiah. Nilai MySQL adalah angka dalam dataset; jangan beri
format atau label IDR/USD pada nilai MySQL tanpa bukti mata uang dari sumber.

Filter dan ringkasan mengikuti aturan dashboard: filter berlaku ke KPI, grafik,
dan tabel; omzet tidak menghitung transaksi `cancelled`, sedangkan jumlah
transaksi mencakup semua status.

## MySQL lokal dan impor yang aman

Dump asli dan query analisis dosen disimpan byte-for-byte di `database/source/`.
Dump berisi `DROP TABLE IF EXISTS`, jadi `database/setup.mjs` hanya mengizinkan
URL MySQL loopback ke `/classicmodels` dan memastikan database kosong (tanpa
tabel/view) sebelum impor. Jika database berisi objek, script berhenti sebelum
menjalankan dump. Jangan arahkan ke server/database bersama.

Gunakan container dan volume baru untuk pengujian; ikat port host hanya ke
`127.0.0.1`, buat database kosong bernama `classicmodels`, lalu isi `.env.local`:

```dotenv
DATA_SOURCE=mysql
DATABASE_URL=mysql://<user>:<password>@127.0.0.1:<port>/classicmodels
```

Setelah MySQL siap, `npm run db:setup` membaca `.env.local`, memeriksa bahwa
schema kosong, lalu menjalankan dump dosen. Script tidak membersihkan database
yang terisi dan tidak menghapus objek bila terjadi kegagalan. Untuk mengulang
impor, buat container/volume disposable lain. Mode demo tidak perlu database
atau `db:setup`.

## Pembagian tanggung jawab dan keamanan

- **Developer:** menyiapkan database lokal disposable dan `.env.local`, menjaga
  pemetaan query MySQL ke `Sale`, serta menguji API dan error handling.
- **DevSecOps:** menyediakan MySQL deployment, kredensial berhak minimum,
  jaringan privat aplikasi-database, volume persisten, backup, dan uji
  pemulihan. Jangan masukkan kredensial ke image, log, browser, atau repository.
- `DATABASE_URL` hanya untuk server. Keamanan tidak bergantung pada UI.

## Runtime dan verifikasi

Prasyarat README: Node.js `20.9+` dan npm. Runtime memakai Next.js `16.3.8`,
React/React DOM `19.3.0`, serta `mysql2`. Script yang tersedia: `dev`, `start`,
`build`, `lint`, `typecheck`, `test`, `db:setup`.

Perintah pemeriksaan: `npm test`, `npm run lint`, `npm run typecheck`, dan
`npm run build`; mode produksi setelah build memakai `npm start`. Test mencakup
pemilihan source, pemetaan DECIMAL/status, repository, route API, error aman,
dan logika dashboard. Jalankan integrasi terhadap database disposable sebelum
menyatakan koneksi MySQL siap.

Catatan eksekusi query analisis asli, error yang ditemukan, query koreksi
terpisah, dan angka yang diverifikasi tersedia di
`database/verification/ANALYSIS.md`.
