# PROMPT: Upgrade Website Menjadi Platform Streaming Video Premium

Lakukan **upgrade besar** pada website saat ini (sistem login admin + manajemen proxy video) menjadi **website streaming video** dengan tampilan premium, elegan, dan konsisten. Gunakan nuansa warna **Black + Indigo/Purple + Blue** (dark premium).

---

## 1) Autentikasi & Akses
- Tetap gunakan **login admin** seperti sekarang.
- Tidak ada fitur **register user** untuk publik, khusus admin saja.
- Halaman **publik** (homepage streaming, detail video) dapat diakses tanpa login.
- Halaman **admin panel** tetap membutuhkan login.

---

## 2) Sumber & Pemutar Video
- Video diambil dari **Google Drive** melalui sistem proxy yang sudah ada.
- Pemutaran video memiliki 2 opsi:
  - **Proxy Player (default dan rekomendasi)**.
  - **Google Drive Player (embed)** sebagai pilihan alternatif.
- Pastikan video dapat dimainkan langsung di halaman detail.

---

## 3) Desain & UI/UX Global
- Tema warna: kombinasi **hitam pekat** dengan aksen **indigo/purple/blue** untuk nuansa premium.
- Semua halaman konsisten dengan gaya **dark premium**.
- Gunakan tampilan **card-based** untuk video dengan **thumbnail/poster besar**.
- Komponen visual:
  - Card dengan sudut bulat halus, shadow elegan.
  - Hover/active state memakai aksen indigo/purple/blue.
  - Tampilan **responsif** untuk desktop & mobile.
- Tipografi modern, sederhana, fokus pada konten video.

---

## 4) Halaman Publik
### 4.1 Homepage
- Berisi beberapa section:
  - **Video Terbaru** (urut berdasarkan upload terbaru).
  - **Video Viral** (berdasarkan jumlah views tertinggi dalam periode tertentu).
  - **Video Populer** (berdasarkan jumlah download tertinggi).
- Setiap section menampilkan **deretan video** dalam bentuk grid atau carousel.

### 4.2 Halaman Detail Video
- Bagian atas menampilkan **video player** (Proxy Player default, opsi untuk ganti ke GDrive Player).
- Informasi lengkap:
  - Judul, deskripsi, tanggal unggah, jumlah views, jumlah download.
  - Background/poster video sebagai header (opsional, bisa otomatis dari Google Drive).
- Tombol aksi:
  - **Download Video** → pilihan via proxy atau via Google Drive.
  - Setiap klik download akan menambah counter download.
- Bagian bawah halaman:
  - **Kolom komentar (Disqus)** yang aktif jika sudah diset di admin panel.

---

## 5) Admin Panel
### Dashboard
- Ringkasan informasi:
  - Total video, total views, total downloads.
  - Top 5 video dengan download tertinggi.
  - Log singkat aktivitas download terbaru.
- Grafik ringkas untuk tren views/downloads (opsional).

### Video Management
- Daftar semua video dalam bentuk tabel/list:
  - Menampilkan thumbnail, judul, views, downloads, dan aksi edit/hapus.
- Form untuk **menambahkan atau mengedit video**:
  - Input judul, deskripsi, link file Google Drive, pilihan player (proxy/gdrive).
  - Opsi untuk menambahkan poster/gambar background video (opsional).
  - Jika poster kosong, gunakan gambar default atau otomatis dari Google Drive.
- Fitur **preview video** sebelum disimpan/publikasi.

### Pengaturan
- Setting umum:
  - Nama brand/website.
  - Default pilihan player (proxy/gdrive).
- Setting komentar:
  - Input untuk kode Disqus atau ID shortname.
  - Tombol test untuk memastikan komentar tampil.

---

## 6) Fitur Tracking
- **Views** dihitung otomatis saat video ditonton.
- **Downloads** dihitung otomatis setiap kali tombol download ditekan.
- Data views dan downloads ditampilkan di admin dashboard untuk memudahkan monitoring.

---

## 7) Konsistensi & Aksesibilitas
- Semua halaman memiliki desain yang konsisten, modern, dan premium.
- Gunakan loading skeleton saat data belum muncul.
- Sediakan state kosong (empty state) yang rapi jika belum ada video.
- Pastikan navigasi jelas dan mobile-friendly.

---

## 8) Kriteria Hasil Akhir
- Homepage menampilkan **Video Terbaru, Viral, Populer** dalam UI premium.
- Halaman detail video memutar video dengan player default (proxy) dan bisa switch ke GDrive.
- Tombol download berfungsi dan counter download bertambah.
- Disqus komentar tampil sesuai pengaturan admin.
- Admin Panel berfungsi penuh: dashboard, manajemen video, dan pengaturan.
- Semua tampilan konsisten dengan tema **Black + Indigo/Purple + Blue**.