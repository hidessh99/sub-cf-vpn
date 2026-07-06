# Panduan Menjalankan LuFeng VPN di Localhost

Dokumen ini berisi panduan lengkap untuk menjalankan proyek **LuFeng VPN (Cloudflare VPN Tunnel Config Generator)** di komputer lokal Anda menggunakan **Bun** (pengganti Node.js/npm) maupun menggunakan **Docker**.

---

## 1. Prasyarat (Prerequisites)

Sebelum memulai, pastikan Anda telah menginstal salah satu atau kedua alat berikut sesuai metode yang ingin Anda gunakan:

### A. Menginstal Bun (Disarankan untuk Development)
Bun adalah *runtime* dan *package manager* JavaScript/TypeScript yang jauh lebih cepat daripada Node.js dan npm.
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
Buka terminal di folder proyek ini (`G:\cloudflare-vpn`), lalu jalankan:
```bash
bun install
```
*Perintah ini akan menginstal seluruh pustaka yang dibutuhkan dalam hitungan detik.*

### Langkah 2: Jalankan Development Server & API Checker
Karena aplikasi ini memiliki layanan mandiri pengecek latensi proxy (*Self-Hosted API Checker*), Anda perlu menjalankan 2 layanan di terminal terpisah saat mode development lokal:

**Terminal 1 (Jalankan Web Frontend):**
```bash
bun dev
```

**Terminal 2 (Jalankan API Checker Service di port 4002):**
```bash
bun run checker
```
*(Catatan: Tanpa menjalankan Terminal 2, fitur cek latensi di browser akan menampilkan status **DEAD** karena server checker belum aktif).*

### Langkah 3: Buka Browser
Setelah kedua perintah dijalankan, buka browser Anda dan akses:
👉 **http://localhost:5173**

---

## 3. Cara Menguji Hasil Build Production dengan Bun

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

## 4. Cara Menjalankan Menggunakan Docker Compose (Paling Praktis)

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

## 5. Konfigurasi Variabel Lingkungan (Opsional)

Aplikasi ini mendukung *12-Factor App methodology*. Anda dapat mengubah konfigurasi bawaan dengan membuat file `.env.local` di folder root proyek (untuk penggunaan Bun) atau mengatur `args` di `docker-compose.yml` (untuk penggunaan Docker).

Contoh isi file `.env.local`:
```env
VITE_WEB_NAME="LuFeng VPN Pro"
VITE_PROXY_LIST_URL="/proxyip.json"
VITE_API_CHECK_URL="https://proxyip-check.bexcodex.xyz/"
```
Setelah menyimpan file `.env.local`, restart server `bun dev` atau rebuild Docker Anda agar konfigurasi baru diterapkan.
