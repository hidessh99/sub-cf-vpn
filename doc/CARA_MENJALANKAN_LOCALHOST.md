# Panduan Menjalankan LuFeng VPN di Localhost

Dokumen ini berisi panduan lengkap untuk menjalankan proyek **LuFeng VPN (Cloudflare VPN Tunnel Config Generator)** di komputer lokal Anda menggunakan **Bun** maupun menggunakan **Docker**.

---

## 1. Prasyarat (Prerequisites)

Sebelum memulai, pastikan Anda telah menginstal salah satu atau kedua alat berikut sesuai metode yang ingin Anda gunakan:

### A. Menginstal Bun (Disarankan untuk Development)
Bun adalah *runtime* dan *package manager* JavaScript/TypeScript modern yang sangat cepat (pengganti Node.js dan npm).
- **Windows**:
  Buka terminal PowerShell dan jalankan perintah berikut:
  ```powershell
  powershell -c "irm bun.sh/install.ps1 | iex"
  ```
- **macOS / Linux**:
  ```bash
  curl -fsSL https://bun.sh/install | bash
  ```
- Verifikasi instalasi dengan menjalankan:
  ```bash
  bun --version
  ```

### B. Menginstal Docker (Disarankan untuk Pengujian ala Production)
- Unduh dan instal [Docker Desktop](https://www.docker.com/products/docker-desktop/) untuk Windows/macOS, atau instal Docker Engine di Linux.

---

## 2. Cara Menjalankan Menggunakan Bun (Tanpa Docker)

Metode ini sangat cocok saat Anda sedang mengembangkan aplikasi, mengubah tampilan, atau menambah fitur karena mendukung **Hot Module Replacement (HMR)** (layar browser otomatis diperbarui saat Anda menyimpan kode).

### Langkah 1: Instalasi Dependensi
Buka terminal di folder root proyek ini (`G:\cloudflare-vpn`), lalu jalankan:
```bash
bun install
```
*Perintah ini akan menginstal seluruh pustaka frontend dan backend secara otomatis dalam hitungan detik.*

### Langkah 2: Jalankan Development Server & API Checker
Backend Checker dideploy menggunakan **Hono** web framework yang super cepat dan hemat memori. Anda perlu menjalankan 2 layanan di terminal terpisah saat mode development lokal:

**Terminal 1 (Jalankan Web Frontend - Vite):**
```bash
bun dev
```

**Terminal 2 (Jalankan API Checker Service - Hono di port 4002):**
- **Mode Normal (Tanpa Auto-Reload)**:
  ```bash
  bun run checker
  ```
- **Mode Development (Dengan Auto-Reload jika kode diubah)**:
  Masuk ke subfolder `checker` lalu jalankan:
  ```bash
  cd checker
  bun run dev
  ```
*(Catatan: Tanpa menjalankan Terminal 2, fitur cek latensi di browser akan menampilkan status **DEAD** karena server checker belum aktif).*

### Langkah 3: Buka Browser
Setelah kedua layanan aktif, buka browser Anda dan akses:
👉 **http://localhost:5173**

---

## 3. Menjalankan Uji Coba & Pemeriksaan Tipe (TypeScript & Tests)

Backend Checker sekarang dilengkapi dengan *type-safety* TypeScript penuh dan test suite komprehensif menggunakan Bun test runner.

- **Memeriksa Error Tipe TypeScript**:
  ```bash
  cd checker
  bun x tsc --noEmit
  ```
- **Menjalankan Seluruh Integration & Unit Tests**:
  ```bash
  cd checker
  bun test
  ```
  *Bun akan mengeksekusi 48 tes untuk memastikan route Hono, authentikasi JWT, CRUD proxy/domain/bug, dan import parser berjalan dengan benar.*

---

## 4. Cara Menguji Hasil Build Production dengan Bun

Jika Anda ingin melihat bagaimana performa aplikasi setelah dikompilasi (sebelum diupload ke hosting atau server), Anda bisa membangunnya secara lokal dengan Bun:

1. **Kompilasi Aplikasi**:
   ```bash
   bun run build
   ```
   *Perintah ini akan menghasilkan folder `dist/` berisi file statis HTML, JS, dan CSS yang sudah dioptimalkan.*

2. **Jalankan Preview Server**:
   ```bash
   bun run preview
   ```
3. Buka browser dan akses alamat yang tertera di terminal (biasanya **http://localhost:4173**).

---

## 5. Cara Menjalankan Menggunakan Docker Compose (Paling Praktis)

Metode ini mensimulasikan persis bagaimana aplikasi akan berjalan di server production (menggunakan **Bun** di tahap kompilasi dan web server **Nginx Alpine** di tahap runtime).

### Langkah 1: Buka Terminal
Pastikan Docker Desktop Anda sudah aktif dan berjalan. Buka terminal di folder proyek ini.

### Langkah 2: Build & Jalankan Kontainer
Jalankan perintah berikut:
```bash
docker compose up -d --build
```
*Keterangan:*
- `-d`: Menjalankan kontainer di latar belakang (*detached mode*).
- `--build`: Memaksa Docker untuk membangun ulang image menggunakan konfigurasi terbaru di `Dockerfile`.

### Langkah 3: Buka Browser
Aplikasi sekarang dilayani oleh Nginx di dalam kontainer Docker. Buka browser dan akses:
👉 **http://localhost:4001**

### Cara Menghentikan Kontainer Docker
Untuk mematikan aplikasi Docker yang sedang berjalan, ketik:
```bash
docker compose down
```

---

## 6. Fitur Hono Backend yang Terpasang
Server backend di [checker](file:///g:/cloudflare-vpn/checker/) menggunakan arsitektur modern **Hono**:
- **Logger Middleware**: Melakukan logging otomatis setiap HTTP request/response yang masuk.
- **Compress Middleware**: Mengaktifkan kompresi Gzip/deflate untuk mempercepat transfer data payload berukuran besar (seperti proxy list).
- **Timeout Middleware**: Memberikan batas waktu pemrosesan request maksimal 30 detik untuk menghindari memory leak atau request gantung.
- **Global Error Handler & 404 Handler**: Format error response konsisten dalam skema JSON.
