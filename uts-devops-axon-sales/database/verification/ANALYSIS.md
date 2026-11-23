# Verifikasi dump dan query analisis dosen

## Lingkungan

- MySQL `8.4.11` dalam container disposable lokal
  `axon-sales-classicmodels-disposable-20261006`.
- Database: `classicmodels`; dump diimpor hanya setelah database kosong
  dikonfirmasi. Port container hanya terikat ke `127.0.0.1:13306`.
- Query analisis dijalankan satu kali tanpa perubahan dan satu kali dari salinan
  koreksi. SQL sumber di `database/source/` tetap byte-for-byte sama dengan file
  dosen; log masing-masing ada di direktori ini.

## Angka dari database

Query langsung pada database yang diimpor memberi hasil berikut:

| Pemeriksaan | Hasil |
| --- | ---: |
| Tabel pada dump | 8 |
| Order | 326 |
| Baris `orderdetails` | 2.996 |
| `SUM(quantityOrdered * priceEach)` untuk semua order | 9.604.190,61 |
| Status setelah pemetaan | 307 completed, 13 processing, 6 cancelled |

Jumlah transaksi adalah jumlah order, bukan jumlah baris detail. Nilai total
dicatat apa adanya dari DECIMAL MySQL. Tidak ada mata uang atau kurs yang
disimpulkan dari nilainya.

## Ringkasan produk

Batas `@@session.group_concat_max_len` bawaan pada server ini adalah 1.024
karakter. Ringkasan produk terpanjang dari seluruh 326 order adalah 498
karakter. Query backend menetapkan batas query-scoped 8.192 dengan optimizer
hint `SET_VAR(group_concat_max_len=8192)`. Pengukuran ulang dengan hint tetap
menghasilkan ringkasan maksimum 498 karakter dan `SHOW WARNINGS` tidak
melaporkan hint yang diabaikan. Jadi nilai dari dump ini tidak terpotong.

## Eksekusi SQL analisis asli

File analisis memberi nomor 26 query mandiri (1–26) dan dua stored procedure
(27–28), bukan 28 query ditambah dua procedure. Seluruh file asli tetap
dijalankan terhadap database disposable. Log mentah: `analysis-run.log`.

Eksekusi asli menghasilkan enam error sintaks/objek:

1. Baris 41 dan 42 merujuk `Orderdetails`, sedangkan nama tabel di dump adalah
   `orderdetails` dan server membedakan kapitalisasi nama tabel.
2. Baris 101 merujuk `productLines`, sedangkan nama tabel di dump adalah
   `productlines`.
3. Baris 320 memulai komentar untuk procedure 28 dengan tab sebelum `--`.
   Klien MySQL tidak mengenali komentar dan mencoba menjalankan teks `delimiter`
   sebagai SQL. Ini menghasilkan error pada delimiter pembuka (baris 320) dan
   delimiter penutup (baris 332).
4. Karena procedure 28 gagal dibuat, pemanggilannya di baris 335 gagal dengan
   `PROCEDURE classicmodels.Product_Details does not exist`.

## Koreksi dan hasil

`analysis-corrected.sql` adalah salinan eksekusi terpisah. Koreksinya hanya
mengubah kapitalisasi dua nama tabel agar sama dengan dump dan menghapus tab di
depan komentar delimiter procedure 28. Isi query, rumus, parameter, dan logika
bisnis lainnya tidak diubah. Seluruh analisis dan kedua procedure berhasil
dijalankan; log: `analysis-corrected-run.log`, tanpa baris error SQL.

Procedure 27 menghasilkan baris per `productLine` untuk pelanggan
`Euro+ Shopping Channel`, bukan satu angka total order. Procedure 28 untuk
`S18_3232` menghasilkan 53 order dan `276.84`; rumus `/ 1000` dan pembulatan
dua desimal tersebut berasal dari SQL dosen dan sengaja tidak diubah.
