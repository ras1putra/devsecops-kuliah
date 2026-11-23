# Provenance sumber SQL

Kedua berkas SQL berikut disalin byte-for-byte dari bundle dosen yang diunduh ke
scratch workspace `.amp/in/axon-sales-retrieval/` di root folder Tugas. Berkas
sumber asli dipertahankan tanpa koreksi; bila ada SQL yang perlu diperbaiki,
koreksinya dicatat terpisah dari berkas ini.

| Berkas | Sumber yang disebutkan dalam materi | SHA-256 |
| --- | --- | --- |
| `Axon sales - Mysql Database.sql` | Header dump menyebut MySQLTutorial, MySQL Sample Database `classicmodels`, versi 3.1: <http://www.mysqltutorial.org/mysql-sample-database.aspx> | `94cdaf7167f74f3c08d30d78774ad5345e15c009e23abfc0f1125f278533a10c` |
| `Axon SQL.sql` | README bundle mengaitkan analisis Axon Sales Report dengan <https://github.com/Pratikkatad/Axon-Sales-Report> | `6b5278bac9f37db273c85d8cf9f2adb24a7058320ac1587537c4e9d1059f50c7` |

Pemeriksaan hash dan ukuran byte terhadap sumber bundle dilakukan setelah
penyalinan; keduanya cocok. File analisis menomori 26 query mandiri (nomor 1–26)
dan dua stored procedure (nomor 27–28). Angka ini dicatat apa adanya karena
berbeda dari penyebutan “28 query + 2 procedure”.
