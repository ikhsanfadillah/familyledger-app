# Panduan Sinkronisasi P2P FamilyLedger

FamilyLedger menggunakan teknologi **Peer-to-Peer (WebRTC)** untuk mensinkronkan data antar perangkat Anda secara langsung tanpa melalui server cloud. Ini menjaga privasi data keuangan Anda tetap berada di perangkat Anda sendiri.

## Cara Menggunakan

### 1. Persiapan
- Pastikan kedua perangkat terhubung ke internet (hanya untuk proses jabat tangan awal).
- Buka aplikasi FamilyLedger di kedua perangkat.

### 2. Menghubungkan Perangkat
1. Buka menu **Sinkron** (ikon putar) di navigasi bawah.
2. Di **Perangkat A**: Anda akan melihat QR Code.
3. Di **Perangkat B**: Klik tombol **"Scan QR Perangkat Lain"**.
4. Arahkan kamera Perangkat B ke QR Code di Perangkat A.
5. Tunggu hingga status berubah menjadi **Online** dan nama perangkat muncul di daftar "Perangkat Terhubung".

### 3. Sinkronisasi Otomatis & Latar Belakang
- **Auto-Sync**: Setelah terhubung sekali, perangkat akan mencoba terhubung kembali secara otomatis setiap kali aplikasi dibuka.
- **Background Trigger**: Berkat teknologi Progressive Web App (PWA), aplikasi akan mendapatkan sinyal sinkronisasi saat perangkat kembali online, memicu pengecekan data terbaru saat Anda membuka aplikasi.
- **Manual Sync**: Anda bisa menekan tombol **"Sinkron Sekarang"** kapan saja untuk memaksa pertukaran data.

## Resolusi Konflik
Jika Anda mengedit transaksi yang sama di dua perangkat berbeda secara bersamaan, FamilyLedger akan menggunakan prinsip **"Last-Write-Wins" (LWW)** — artinya perubahan dengan waktu simpan terakhir akan menjadi data yang valid.

## Keamanan & Privasi
- **No Cloud**: Data Anda tidak pernah disimpan di server kami.
- **End-to-End**: Data dikirim langsung antar perangkat melalui jalur terenkripsi WebRTC.
- **Peer ID**: ID unik perangkat Anda bersifat acak dan hanya digunakan untuk menghubungkan perangkat Anda sendiri.

## Troubleshooting
- **Gagal Terhubung?**: Pastikan Anda tidak menggunakan VPN atau Firewall yang sangat ketat karena WebRTC kadang terhambat oleh NAT.
- **Kamera tidak muncul?**: Pastikan Anda telah memberikan izin kamera pada browser Anda.
- **Data tidak update?**: Pastikan kedua perangkat sempat "Online" secara bersamaan di menu Sinkron minimal sekali untuk memulai pertukaran data awal.
