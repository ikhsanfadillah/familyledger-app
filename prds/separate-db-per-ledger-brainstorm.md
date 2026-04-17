# Brainstorming: Separating Database per Ledger

Saat ini, aplikasi `FamilyLedger` menggunakan satu database Dexie (`FamilyLedgerDB`) yang mencakup semua ledger. Pemisahan data antar ledger dilakukan menggunakan skop pada setiap tabel (menambahkan field `ledgerId`).

Ide baru yang Anda usulkan adalah: **Bagaimana jika kita benar-benar memisahkan database secara fisik per ledger? (Satu instance Dexie DB = Satu Ledger)**

Berikut adalah brainstorming, analisis kelebihan, dan kelemahan dari arsitektur *Multiple Databases* dibandingkan dengan arsitektur *Single Database* yang kita pakai sekarang.

---

## 1. Pendekatan Saat Ini (Single Database dengan `ledgerId`)

### Konsep
Satu database bernama `FamilyLedgerDB`. Setiap tabel (`transactions`, `budgets`, `categories`) memiliki field `ledgerId`. 

### Kelebihan
- **Mudah di-manage**: Hanya satu instance koneksi database di seluruh aplikasi.
- **Migrasi Mudah**: Kalau ada perubahan schema (misal nambah kolom `photoUrl`), kita cuma perlu migrasi satu database (via `db.version(x).upgrade(...)`).
- **Global Queries**: Jika suatu saat butuh fitur "Lihat semua pengeluaran dari SEMUA ledger saya" atau "Global Search", query-nya sangat mudah.

### Kekurangan
- **Risiko Keamanan Data**: Meskipun dienkripsi, semua data tercampur dalam satu wadah. Jika query salah tanpa filter `ledgerId`, data bisa bocor antar ledger.
- **Isolasi P2P Yjs Agak Rumit**: Yjs harus melakukan sync ke tabel Dexie secara spesifik berdasarkan ID.
- **Performa Skala Besar**: Jika tabel transaksi sangat besar (ratusan ribu), query bisa sedikit melambat dibanding jika data dipecah.

---

## 2. Pendekatan Baru (Multiple Databases - Satu DB per Ledger)

### Konsep
Aplikasi akan membuat satu instance Dexie untuk setiap ledger secara dinamis.
- Database Induk: `FamilyLedger_Core` (Hanya berisi tabel `ledgers` dan info User/Device).
- Database Ledger 1: `LedgerDB_XYZ` (Berisi `transactions`, `budgets`, `categories` khusus ledger Private).
- Database Ledger 2: `LedgerDB_ABC` (Berisi data khusus ledger Office).

### Kelebihan (Pros)
1. **Isolasi Total (True Tenant Isolation)**
   Data benar-benar terpisah secara fisik di IndexedDB. Tidak ada kemungkinan bug kode secara tidak sengaja menampilkan transaksi "Office" di ledger "Private", karena instance DB-nya berbeda.
2. **Hapus Ledger Bersih & Cepat**
   Untuk menghapus atau keluar dari sebuah ledger, kita hanya perlu memanggil `Dexie.delete('LedgerDB_ABC')`. Seluruh transaksi, anggaran, dll akan musnah tanpa harus menjalankan `bulkDelete()`.
3. **Lebih Pas dengan `Y.Doc` (Yjs)**
   Karena 1 `Y.Doc` mewakili 1 Ledger, sinkronisasi `y-indexeddb` bisa langsung sejajar dengan arsitektur ini.
4. **Performa Individual Maksimal**
   Karena tabel lebih kecil (hanya menampung transaksi 1 ledger), query menjadi sangat cepat dan index lebih efisien.

### Kekurangan (Cons)
1. **Manajemen Koneksi Sulit (State Management)**
   Aplikasi harus membuka dan menutup koneksi Dexie DB secara dinamis saat user mengganti (switch) ledger. Tidak bisa menggunakan statik `export const db = new Dexie()`.
2. **Migrasi Schema Menantang**
   Jika kita merilis versi baru dengan schema baru, kita harus meloop seluruh database ledger yang ada di perangkat dan menjalankan `upgrade` satu-per-satu.
3. **Cross-Ledger Query Susah**
   Tidak mungkin melakukan query atau filter gabungan dari dua ledger sekaligus secara efisien tanpa menarik datanya ke memori satu per satu.
4. **Limitasi IndexedDB Connection**
   Membuka terlalu banyak instance database IndexedDB secara bersamaan (jika user punya banyak ledger) bisa memakan memori browser atau ditahan oleh browser limits.

---

## Kesimpulan & Rekomendasi

### Apakah kita perlu memisahkan database per ledger?
- **Jika privasi, enkripsi, dan isolasi Yjs adalah prioritas mutlak nomor 1**, memisahkan database adalah ide yang brilian (Multiple Databases).
- **Jika kita butuh development yang cepat, kemudahan maintain schema, dan mungkin butuh fitur "Net Worth Gabungan" di masa depan**, bertahan di Single Database dengan filter `ledgerId` adalah opsi terbaik.

### Opini / Rekomendasi Implementasi
Karena kita sudah menggunakan **Yjs per Ledger (`y-webrtc`)** dan **Enkripsi Master Key**, arsitektur **Multiple Databases** sebenarnya sangat *make sense*. 
Kita bisa membuat arsitekturnya menjadi:
1. **`CoreDB`**: Menyimpan PIN, Master Key, dan daftar `Ledgers` yang user ikuti. (Di-load saat aplikasi pertama buka).
2. **`LedgerDB(ledger.id)`**: Dibuat dinamis saat user "Unlock" & memilih ledger. Berisi khusus data ledger tersebut.

### Next Step (Jika setuju dengan Multiple DB)
1. Buat class `LedgerDB extends Dexie` yang bersifat instanced.
2. Update `ledgerStore` untuk menyimpan referensi instance `activeDb` yang sedang terbuka.
3. Refactor `queries.ts` agar mengambil database dari `ledgerStore.activeDb` daripada import statis.

Bagaimana menurut Anda? Apakah ingin kita rombak ke **Multiple Database per Ledger**?
