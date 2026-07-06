# 🚀 LuFeng VPN - Cloudflare VPN Tunnel Config Generator

<div align="center">

![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)
![Nginx](https://img.shields.io/badge/nginx-%23009639.svg?style=for-the-badge&logo=nginx&logoColor=white)

**Aplikasi Web Modern, Super Cepat, & Dinamis untuk Membuat Konfigurasi VLESS, Trojan, dan Shadowsocks melalui Cloudflare CDN/WebSocket Tunnel.**

</div>

---

## ✨ Fitur Unggulan

- ⚡ **Dukungan Protokol Lengkap**: Generate tautan konfigurasi **VLESS**, **Trojan**, dan **Shadowsocks (SS)** dengan mudah dan presisi.
- 🌐 **Cloudflare Tunnel Ready**: Mendukung kustomisasi port HTTP (80/8080/8880/dll) maupun HTTPS TLS (443/2052/2083/dll), *Wildcard Subdomain*, SNI, dan kustom path WebSocket/HTTPUpgrade.
- 🔄 **100% Konfigurasi Dinamis Tanpa Rebuild**:
  - Daftar **Domain** (`domain.json`), **Bug Host** (`bug_list.json`), dan **Proxy IP** (`proxyip.json`) dimuat secara dinamis saat *runtime*.
  - Anda dapat mengubah atau menambah daftar domain dan bug host langsung di VPS Anda tanpa perlu mengompilasi ulang kode aplikasi atau mem-build ulang image Docker!
- 📡 **Live Latency & Status Checker**: Mengecek status aktif/mati (*active/dead*) serta latensi dari setiap proxy secara *real-time* dengan antrean *concurrency* yang teroptimasi agar browser tidak *freeze*.
- 📲 **QR Code & Clash YAML Generator**: Buat kode QR secara instan untuk di-scan dari HP (V2RayNG / Shadowrocket) serta dukungan ekspor format konfigurasi Clash/Meta.
- 🎨 **UI/UX Premium & Responsive**: Desain *dark mode* bergaya kaca (*glassmorphism*) yang interaktif, animasi halus, dilengkapi dengan *Toast notifications*.
- 🐳 **12-Factor App & Docker Ready**: Didesain menggunakan arsitektur *multi-stage Docker build* yang sangat ringan (**Nginx Alpine**, port aman unprivileged `4001`) serta mendukung integrasi CI/CD GitHub Actions.

---

## 🛠️ Teknologi yang Digunakan

| Komponen | Teknologi / Library | Keterangan |
| :--- | :--- | :--- |
| **Runtime & Package Manager** | **Bun (`oven/bun:1`)** | Pengganti Node.js/npm yang memberikan kecepatan kompilasi dan instalasi maksimal. |
| **Frontend Core** | **React 18 + TypeScript** | Membangun antarmuka SPA (*Single Page Application*) dengan kepastian tipe data. |
| **Build Tool** | **Vite** | Dev server dengan *Hot Module Replacement* (HMR) super cepat & bundler produksi teroptimasi. |
| **Styling** | **Tailwind CSS + Vanilla CSS** | Desain modern, responsif, dan kaya animasi mikro. |
| **Web Server Kontainer** | **Nginx Alpine Slim** | Web server ringan (< 15 MB) untuk menyajikan aset statis dengan kompresi Gzip di dalam Docker. |
| **CI/CD Pipeline** | **GitHub Actions** | Otomatisasi *build* dan *push* image Docker multi-arsitektur (`amd64` & `arm64`). |

---

## 📂 Struktur Codebase

Berikut adalah gambaran arsitektur folder dan fungsi setiap komponen penting di dalam repository ini:

```text
├── 📁 doc/
│   └── 📄 CARA_MENJALANKAN_LOCALHOST.md # Panduan lengkap menjalankan di localhost (Bun & Docker)
├── 📁 public/
│   ├── 📄 proxyip.json                  # Daftar cadangan/default IP Proxy Cloudflare
│   ├── 📄 domain.json                   # Daftar domain (disajikan sebagai aset statis oleh Nginx)
│   └── 📄 bug_list.json                 # Daftar bug host (disajikan sebagai aset statis oleh Nginx)
├── 📁 src/
│   ├── 📁 components/
│   │   ├── 📄 Layout.tsx                # Kerangka utama tampilan web (Header, Navigation, Footer)
│   │   └── 📄 Toast.tsx                 # Komponen notifikasi pop-up (sukses salin link, error, dll.)
│   ├── 📁 pages/
│   │   └── 📄 Generator.tsx             # 🔥 Logika inti aplikasi (State, Filter, Checker, & Form UI)
│   ├── 📁 utils/
│   │   ├── 📄 common.ts                 # Fungsi bantuan utilitas (Copy clipboard, generate UUID)
│   │   ├── 📄 config.ts                 # Konfigurasi sistem & pemuatan environment variables (VITE_*)
│   │   └── 📄 generators.ts             # 🔥 Algoritma pembentuk link VLESS, Trojan, SS, dan Clash
│   ├── 📄 App.tsx                       # Root komponen React & penanggung jawab rute halaman
│   ├── 📄 index.css                     # Sistem desain, Tailwind directives, & animasi mikro kustom
│   ├── 📄 index.tsx                     # Titik masuk utama (Entry point) rendering DOM Vite
│   └── 📄 types.ts                      # Definisi tipe data TypeScript (ProxyItem, Status, dll.)
├── 📄 .github/workflows/docker.yml      # Alur kerja CI/CD GitHub Actions untuk build Docker otomatis
├── 📄 Dockerfile                        # Konfigurasi Multi-Stage Build Docker (Stage 1: Bun, Stage 2: Nginx)
├── 📄 docker-compose.yml                # Konfigurasi orkestrasi kontainer & pemetaan volume dinamis
├── 📄 nginx.conf                        # Konfigurasi Nginx produksi (Gzip, SPA Routing, Port 4001)
├── 📄 domain.json                       # ⚡ File sumber daftar domain dinamis yang bisa diedit langsung
├── 📄 bug_list.json                     # ⚡ File sumber daftar bug host dinamis yang bisa diedit langsung
├── 📄 proxyip.json                      # ⚡ File sumber daftar IP proxy dinamis yang bisa diedit langsung
├── 📄 package.json                      # Daftar dependensi & skrip eksekusi Bun
├── 📄 tsconfig.json                     # Konfigurasi kompilator TypeScript (berisi dukungan @types/bun)
└── 📄 vite.config.ts                    # Konfigurasi Vite & plugin React
```

---

## 🚀 Cara Menjalankan Aplikasi

Anda dapat menjalankan aplikasi ini dengan 2 metode utama. Untuk panduan yang lebih mendalam, silakan baca [doc/CARA_MENJALANKAN_LOCALHOST.md](doc/CARA_MENJALANKAN_LOCALHOST.md).

### 1. Menggunakan Docker Compose (Sangat Disarankan untuk VPS / Production)

Metode ini menjalankan aplikasi di dalam kontainer terisolasi dengan **Nginx** di port internal `4001` (aman dari bentrok port 80/443 di VPS Anda):

```bash
# 1. Clone repository ini
git clone https://github.com/hidessh99/sub-cf-vpn.git
cd sub-cf-vpn

# 2. Build dan jalankan di background (Detached Mode)
docker compose up -d --build
```
Aplikasi langsung dapat diakses melalui browser di: 👉 **http://localhost:4001** (atau `http://IP_VPS_ANDA:4001`).

> [!TIP]
> **Cara Mengedit Domain & Bug Host Tanpa Rebuild Kontainer:**  
> Berkat fitur *Volume Mapping* di `docker-compose.yml`, Anda cukup mengedit file `domain.json`, `bug_list.json`, atau `proxyip.json` di folder root VPS Anda menggunakan text editor (misal: `nano domain.json`). Setelah disimpan, pengunjung web cukup **me-refresh browser** dan daftar domain/bug baru akan langsung muncul!

### 2. Menggunakan Bun (Untuk Development Lokal / Modifikasi Kode)

Jika Anda ingin mengubah tampilan atau mengembangkan fitur dengan fitur *Live Reload*:

```bash
# 1. Instal dependensi dengan Bun
bun install

# 2. Jalankan server development & API Checker (di 2 terminal terpisah)
bun dev
bun run checker
```
*(Aplikasi web di `http://localhost:5173`, dan API checker mandiri di port `4002`).*

---

## ⚙️ Kustomisasi Environment Variables (12-Factor App)

Aplikasi ini mendukung kustomisasi melalui *Environment Variables* saat proses kompilasi/build. Anda dapat mengaturnya melalui file `.env.local` atau argumen build di Docker:

| Nama Variabel | Nilai Default | Deskripsi |
| :--- | :--- | :--- |
| `VITE_WEB_NAME` | `"LuFeng VPN"` | Nama aplikasi web yang ditampilkan di UI. |
| `VITE_PROXY_LIST_URL` | `"/proxyip.json"` | URL atau path lokasi file JSON daftar IP proxy Cloudflare. |
| `VITE_DOMAIN_LIST_URL` | `"/domain.json"` | URL atau path lokasi file JSON daftar domain penanda. |
| `VITE_BUG_LIST_URL` | `"/bug_list.json"` | URL atau path lokasi file JSON daftar Bug Host / SNI. |
| `VITE_API_CHECK_URL` | `"/api/check?ips="` | Endpoint API internal (self-hosted Bun checker) atau eksternal untuk mengecek latensi & status hidup proxy. |
| `VITE_PATH_TEMPLATE` | `"/{ip}-{port}"` | Format template path WebSocket/HTTPUpgrade yang dihasilkan. |

---

## 🔒 Keamanan & Arsitektur Port Kontainer

- **Unprivileged Port 4001**: Kontainer Docker dikonfigurasi untuk mendengarkan pada port **4001** (bukan port standar 80). Hal ini mencegah terjadinya bentrok port dengan web server reverse proxy (seperti Nginx, Apache, Caddy, atau Traefik) yang berjalan di VPS utama Anda.
- **Reverse Proxy Ready**: Anda dapat dengan mudah mengarahkan domain Anda (misal via Nginx Proxy Manager atau Cloudflare Tunnel) langsung ke target `http://127.0.0.1:4001`.

---

## 📄 Lisensi

Proyek ini didistribusikan di bawah lisensi **MIT**. Silakan digunakan, dimodifikasi, dan dikembangkan secara bebas.

<div align="center">
  <p>Dibuat dengan ❤️ oleh <b>HideSSH</b></p>
</div>
