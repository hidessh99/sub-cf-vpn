# Panduan Publish ke Cloudflare Pages + D1 Database

Dokumen ini menjelaskan langkah-langkah untuk mempublikasikan aplikasi VPN Checker & Admin Panel ke Cloudflare Pages secara full-stack menggunakan database D1.

---

## Prasyarat
Sebelum memulai, pastikan Anda sudah melakukan langkah-langkah berikut:
1. Memiliki akun Cloudflare.
2. Memasang Node.js/Bun dan `wrangler` CLI secara global:
   ```bash
   npm install -g wrangler
   # atau jika menggunakan bun
   bun add -g wrangler
   ```
3. Melakukan login ke akun Cloudflare Anda melalui CLI:
   ```bash
   wrangler login
   ```

---

## Langkah-Langkah Deployment

### Langkah 1: Buat Database Cloudflare D1
Jalankan perintah berikut di terminal Anda untuk membuat database D1 baru di Cloudflare:
```bash
wrangler d1 create checker-db
```

Output perintah ini akan menampilkan informasi seperti berikut:
```text
✅ Successfully created database 'checker-db'

[[d1_databases]]
binding = "DB"
database_name = "checker-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### Langkah 2: Salin `database_id` ke `wrangler.toml`
Buka file [wrangler.toml](file:///g:/cloudflare-vpn/wrangler.toml) di root project Anda, temukan blok konfigurasi database D1, dan ganti nilai `database_id` dengan ID database yang Anda dapatkan dari Langkah 1:

```toml
[[d1_databases]]
binding = "DB"
database_name = "checker-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" # Tempelkan ID database Anda di sini
```

### Langkah 3: Jalankan Migrasi Database ke Cloudflare D1
Kirimkan skema tabel database lokal ke database D1 Cloudflare di production (remote) agar tabel-tabel (`admins`, `proxies`, `domains`, `bugs`) terbuat secara otomatis:

```bash
# Push skema ke database Cloudflare D1
wrangler d1 migrations apply checker-db --remote
```
*Catatan: Jika Anda ingin mencobanya terlebih dahulu di server simulasi lokal, jalankan dengan bendera `--local`.*

### Langkah 4: Set Secret Token JWT di Cloudflare
Untuk alasan keamanan, JWT Secret Token tidak diletakkan dalam repositori. Set token rahasia tersebut langsung ke environment Cloudflare Pages Anda:

```bash
wrangler secret put JWT_SECRET
```
*Wrangler akan meminta Anda memasukkan nilai rahasia (secret value). Masukkan string acak yang kuat (misal: panjang minimal 32 karakter).*

### Langkah 5: Build Aset Frontend React
Sebelum melakukan deployment, lakukan kompilasi pada aset frontend agar siap di-serve secara statis oleh Cloudflare Pages:

```bash
# Menggunakan Bun
bun run build

# Menggunakan NPM
npm run build
```
Proses ini akan menghasilkan folder `./dist` yang siap didistribusikan.

### Langkah 6: Deploy Aplikasi ke Cloudflare Pages
Gunakan wrangler untuk mempublikasikan frontend beserta seluruh Hono API Pages Functions secara bersamaan:

```bash
wrangler pages deploy ./dist
```

Wrangler akan memproses unggahan file Anda dan memberikan URL publik aplikasi Anda setelah selesai (misal: `https://lufeng.pages.dev`).

---

## Verifikasi dan Konfigurasi Tambahan

### 1. Inisialisasi Admin Pertama
Pada saat deployment selesai dan Anda mengakses URL aplikasi pertama kali, middleware backend akan otomatis mendeteksi jika tabel `admins` kosong dan men-seed admin default dengan kredensial berikut (sesuai yang diatur pada `wrangler.toml`):
- **Username**: `admin`
- **Password**: `hidessh12345`

> [!IMPORTANT]
> **Sangat Disarankan**: Setelah berhasil masuk (login) pertama kali di admin panel, masuklah ke halaman **Settings** lalu ubah password admin Anda demi keamanan.

### 2. Import Data Awal
Karena database D1 Cloudflare dimulai dalam kondisi kosong:
- Masuk ke Admin Panel.
- Gunakan fitur **Import** pada menu **Proxies**, **Domains**, dan **Bugs** untuk mengunggah data konfigurasi dari file publik JSON Anda (`public/proxyip.json`, `public/domain.json`, `public/bug_list.json`).
