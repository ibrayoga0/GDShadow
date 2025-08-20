# Fitur Baru: Shadow Player untuk GDShadow

Bangun dan integrasikan **Shadow Player** (custom HTML5 video player) sebagai pengganti preview video bawaan Google Drive di **Admin Panel GDShadow**. Tidak ada opsi ubah resolusi; kualitas mengikuti sumber Google Drive via proxy.

---

## Tujuan
- Menyediakan player modern, simple, premium bertema gelap (“Shadow”).
- Menggantikan preview bawaan Google Drive di Admin Panel dengan Shadow Player.
- Merapikan struktur UI Admin menggunakan **shadcn/ui** agar lebih konsisten, scalable, dan mudah di-maintain.

---

## Ketentuan Desain & UX Shadow Player
- Tema: dominasi hitam/dark dengan aksen subtle; gunakan CSS variables (token) untuk warna, radius, spacing, dan elevation.
- Kontrol yang wajib ada: Play/Pause, Progress/Seek, Mute/Unmute, Fullscreen.
- Perilaku:
  - Auto-hide controls saat idle beberapa detik; muncul saat pointer bergerak/tap.
  - Keyboard shortcuts: Space (Play/Pause), ←/→ (Seek ±5s), F (Fullscreen), M (Mute).
  - Watermark kecil bertuliskan **“Shadow”** (semi-transparent) di sudut kanan bawah.
- Responsif:
  - Mobile: kontrol ringkas (ikon saja), volume bisa berupa toggle/mute.
  - Desktop: tampilkan timer (current/total), progress hover preview sederhana (tooltip waktu).
- Aksesibilitas:
  - ARIA labels untuk kontrol, fokus ring jelas, navigasi keyboard lengkap.
- State & Error:
  - State loading/buffering dengan indikator halus.
  - Error overlay (gagal load, CORS, 403/404, range unsupported) dengan pesan ramah.
- Tidak ada kontrol pemilihan resolusi (360p dsb). Kualitas mengikuti sumber asli.

---

## Integrasi Proxy GDShadow
- Gunakan URL proxy internal GDShadow untuk sumber video; pastikan:
  - Mendukung **HTTP Range Requests** untuk seek.
  - Header **CORS** benar untuk domain Admin.
  - MIME `Content-Type` akurat (mis. `video/mp4`).
- Fallback strategy:
  - Jika playback gagal via proxy, tampilkan error terarah dan opsi retry.
- Konfigurasi:
  - Tambahkan ENV/konstanta `PROXY_BASE_URL` yang dipakai Shadow Player.

---

## **SECTION BARU DI ADMIN PANEL**: Ubah Video GDrive → Shadow Player
Tambahkan alur & UI di Admin Panel untuk mengganti preview GDrive menjadi Shadow Player:

1. **Video Management**  
   - Tabel daftar video (judul, Drive ID, status Shadow Player, terakhir diputar, dll).
   - Aksi per item:
     - **Preview** (modal/sheet) yang menampilkan **Shadow Player**.
     - **Toggle “Use Shadow Player”** (aktif/nonaktif). Saat aktif, semua preview di Admin pakai Shadow Player.
     - **Copy Embed** (menyediakan kode/URL embed internal).
   - Aksi bulk:
     - **Enable/Disable Shadow Player** untuk banyak item.
     - **Apply as Default**: atur Shadow Player sebagai default preview global.
   - Filter/pencarian: berdasarkan judul, Drive ID, status.

2. **Video Detail**  
   - Panel informasi (judul, deskripsi singkat, Drive ID, proxy URL).
   - **Switch “Preview Engine”**: Google Drive Player ↔ Shadow Player.
   - Area **Preview** langsung merender engine terpilih (default: Shadow Player saat switch aktif).
   - Status koneksi (latency, support range), statistik singkat pemutaran terakhir.

3. **Settings → Player**  
   - **Default Preview Engine** (Global): pilih **Shadow Player** atau **Google Drive Player**.
   - Opsi watermark (show/hide), timeout auto-hide controls, langkah seek default.
   - Bidang konfigurasi `PROXY_BASE_URL` (read-only jika dari ENV), validasi dan health check.

4. **Audit & Telemetri (opsional)**  
   - Log event play/pause/seek/error (hanya ringkas, anon).
   - Tampilkan ringkasan di Admin (grafik mini atau count).

---

## Refactor & Struktur Ulang Admin dengan **shadcn/ui**
- **Layout**:
  - Sidebar navigasi (Sections: Dashboard, Video Management, Settings).
  - Header/topbar (breadcrumbs, search, user menu).
  - Gunakan komponen shadcn/ui (Button, Card, Dialog, Drawer/Sheet, Tooltip, Toast, Tabs, Data Table, Skeleton, Command).
- **Halaman**:
  - **Video Management**: DataTable dengan pagination, sort, filter, bulk actions; row actions via DropdownMenu.
  - **Video Detail**: Tabs (Overview, Preview, Logs). Preview tab memuat Shadow Player.
  - **Settings**: Form terstruktur (Card/Accordion), tombol Save dengan feedback Toast.
- **Guidelines**:
  - Ikuti konsistensi spacing, radius, typography; gunakan token Tailwind/shadcn.
  - Empty state yang informatif, loading skeletons, error boundary.

---

## Arsitektur & Implementasi
- Bahasa: TypeScript untuk Admin. Modul terpisah: `player/core`, `player/ui`, `player/hooks`.
- **Core Player API**:
  - Public methods: `play`, `pause`, `seek(seconds|percent)`, `mute`, `unmute`, `toggleFullscreen`.
  - Events: `onPlay`, `onPause`, `onTimeUpdate`, `onDuration`, `onEnded`, `onError`, `onBuffer`.
  - Props: `src` (wajib via proxy), `poster` (opsional), `autoplay` (opsional), `muted` (opsional).
- **UI Player Layer**:
  - Kontrol custom (ikon, tooltip), progress bar dengan drag/keyboard.
  - Auto-hide controller + deteksi pointer activity.
  - Watermark “Shadow”.
- **Kinerja**:
  - `preload="metadata"`, hindari eager loading berat.
  - Throttle event `timeupdate` jika perlu.
- **Keamanan**:
  - Validasi input URL (hanya domain proxy yang diizinkan).
  - Cegah XSS pada metadata yang ditampilkan.

---

## Dokumentasi & DevEx
- Update README/Wiki:
  - Cara enable Shadow Player di Admin (global & per video).
  - Penjelasan variabel lingkungan & health check proxy.
  - Panduan embed internal (tanpa contoh kode, cukup deskripsi langkah/opsi).
- Catatan kompatibilitas browser & keterbatasan (tanpa pilihan resolusi).
- Troubleshooting (CORS, range, MIME, 403/429 dari Google).

---

## QA Checklist (Acceptance Criteria)
- [ ] Shadow Player tampil dengan tema gelap premium; kontrol berfungsi penuh (play/pause, seek, mute, fullscreen).
- [ ] Controls auto-hide saat idle, kembali saat interaksi.
- [ ] Keyboard shortcuts bekerja, fokus ring & ARIA label tersedia.
- [ ] Preview di **Video Detail** dan **Video Management → Preview** default menggunakan Shadow Player saat diaktifkan.
- [ ] **Settings → Player** mampu set **Default Preview Engine** global ke Shadow Player.
- [ ] Tabel Video menampilkan status “Shadow Player: On/Off”, mendukung bulk enable/disable.
- [ ] Playback via proxy mendukung seek (range requests) dan memuat tanpa error CORS.
- [ ] Error state ditampilkan jelas saat sumber gagal.
- [ ] Layout Admin di-refactor memakai shadcn/ui dengan DataTable, Dialog/Sheet, Toast, Breadcrumbs.
- [ ] Dokumentasi Admin diperbarui.

---

## Deliverables
- Implementasi Shadow Player (core + UI) terintegrasi ke Admin.
- Halaman Admin yang diperbarui (Video Management, Video Detail, Settings → Player).
- Konfigurasi proxy & health check.
- Dokumentasi Admin/README/Wiki yang relevan.