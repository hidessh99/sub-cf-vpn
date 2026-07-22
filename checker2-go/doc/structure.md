# Panduan Struktur Project: checker2-go

Dokumen ini dibuat khusus untuk membantu pemula memahami bagaimana struktur kode di dalam project **`checker2-go`** disusun. Project ini menggunakan kombinasi dua pola arsitektur modern: **Modular Monolith** dan **Clean Architecture** (juga dikenal sebagai *Hexagonal Architecture* / *Ports & Adapters*).

---

## 1. Konsep Utama: Modular Monolith & Clean Architecture

### Apa itu Modular Monolith?
Dalam arsitektur monolitik biasa, semua kode sering kali tercampur menjadi satu sehingga sulit dipisahkan. Dalam **Modular Monolith**, kita membagi aplikasi menjadi beberapa modul bisnis yang **terisolasi secara ketat** (seperti `auth`, `proxy`, `bug`, dll.). Setiap modul memiliki database dan logikanya sendiri. Hal ini memudahkan kita jika suatu saat ingin memindahkan salah satu modul menjadi *microservice* terpisah.

### Apa itu Clean Architecture?
Clean Architecture membagi kode berdasarkan tanggung jawabnya (separation of concerns) dengan aturan arah ketergantungan yang ketat (**Dependency Rule**):
> **Aturan Utama:** Ketergantungan kode hanya boleh mengalir ke dalam. Bagian luar (framework, database, HTTP) boleh mengetahui bagian dalam (business logic), tetapi bagian dalam **tidak boleh tahu sama sekali** tentang detail bagian luar.

```
+-------------------------------------------------------+
|  Delivery / Presentation (HTTP, Echo, Controllers)   |  <-- Paling Luar
|       +-----------------------------------------------+
|       |  Use Cases (Aturan Bisnis / Workflow)         |
|       |       +---------------------------------------+
|       |       |  Domain / Entities (Model & Interface)|  <-- Paling Dalam (Inti)
|       |       +---------------------------------------+
|       +-----------------------------------------------+
+-------------------------------------------------------+
```

---

## 2. Struktur Folder & File

Berikut adalah visualisasi struktur direktori di dalam `checker2-go`:

```
checker2-go/
├── cmd/
│   └── server/
│       └── main.go                 # Bootstrapper (titik masuk utama & wiring modul)
├── internal/
│   ├── infrastructure/             # Layer Platform (Framework, DB, Config, dll.)
│   │   ├── config/                 # Parser file konfigurasi (JSON)
│   │   ├── database/               # Koneksi database (GORM & SQLite)
│   │   ├── logger/                 # Implementasi pencatatan log sistem
│   │   └── server/                 # Inisialisasi HTTP server (Echo)
│   ├── shared/                     # Kernel Bersama (kode yang boleh dipakai semua modul)
│   │   ├── dto/                    # Format standar response API
│   │   ├── middleware/             # Middleware global (Rate limiter, auth filter)
│   │   └── port/                   # Interface yang digunakan bersama (contoh: Logger)
│   └── module/                     # Modul Bisnis (Mandiri & Terisolasi)
│       ├── auth/                   # Modul autentikasi admin & ganti password
│       ├── bug/                    # Modul pengelolaan Host/SNI Bug
│       ├── dashboard/              # Modul statistik & summary
│       ├── domain_mgmt/            # Modul pengelolaan Domain Cloudflare
│       └── proxy/                  # Modul proxy tester & geoip lookup
├── pkg/                            # Library umum (tidak terikat logika bisnis project)
│   ├── apperror/                   # Custom error handler standar
│   ├── ipvalidator/                # Validasi IP Address (Public vs Private)
│   ├── jwt/                        # Helper untuk JSON Web Token (generate & parse)
│   └── password/                   # Helper hashing password (bcrypt)
├── test/                           # Berisi file-file unit & integration test
├── doc/                            # Folder dokumentasi (file ini)
├── go.mod                          # Definisi modul Go dan dependencies
└── config.json                     # Konfigurasi aplikasi (database, port, JWT secret)
```

---

## 3. Anatomi Detail Sebuah Modul Bisnis

Jika kita membuka salah satu modul di `internal/module/`, misalnya `auth`, kita akan melihat struktur sub-folder berikut:

```
internal/module/auth/
├── delivery/
│   ├── dto.go        # Request & Response khusus untuk HTTP layer
│   ├── handler.go    # HTTP Controller (membaca request, memanggil usecase)
│   ├── middleware.go # Middleware khusus modul (misal: verifikasi token JWT)
│   └── route.go      # Registrasi endpoint router URL
├── domain/
│   ├── admin.go      # Entity/Model data admin dan interface repository
├── repository/
│   └── admin_repo.go # Implementasi query database (SQL/GORM)
├── usecase/
│   └── auth_uc.go    # Logika bisnis autentikasi (login, ubah password)
└── module.go         # Tempat inisialisasi dan penghubung (wiring) seluruh layer di atas
```

### Penjelasan Lapisan Modul:

1. **`domain/` (Inti Aplikasi)**
   * **Isi:** Definisi struct data (Entity) dan interface (kontrak kerja).
   * **Aturan:** Tidak boleh mengimpor library HTTP atau Database (seperti Echo atau GORM). Hanya murni tipe data Go.
   * **Contoh:** `domain/admin.go` mendefinisikan struct `Admin` dan interface `AdminRepository` (menyatakan fungsi apa saja yang harus dimiliki database, seperti `FindByUsername`).

2. **`usecase/` (Logika Bisnis)**
   * **Isi:** Alur kerja aplikasi (workflow). Di sinilah tempat aturan bisnis ditulis.
   * **Contoh:** Proses Login. Usecase akan:
     1. Memanggil repository untuk mencari admin berdasarkan username.
     2. Memverifikasi kecocokan password menggunakan pkg `password`.
     3. Membuat token JWT jika password cocok.
   * **Aturan:** Hanya berinteraksi dengan interface (abstraction), tidak peduli database-nya memakai SQLite, MySQL, atau PostgreSQL.

3. **`repository/` (Akses Data)**
   * **Isi:** Implementasi nyata dari interface yang didefinisikan di `domain/`. Biasanya menggunakan ORM seperti GORM untuk melakukan query SQL ke database SQLite/MySQL.
   * **Hubungan:** Layer ini menjembatani logika bisnis dengan database fisik.

4. **`delivery/` (Pintu Masuk HTTP)**
   * **Isi:** Pengendali HTTP (HTTP Handler / Controller). Di sinilah Echo Framework digunakan.
   * **Tanggung Jawab:**
     * Menerima request HTTP dari client.
     * Melakukan binding JSON ke struct request ([dto.go](file:///g:/cloudflare-vpn/checker2-go/internal/module/auth/delivery/dto.go)).
     * Memvalidasi input (seperti memastikan email valid, password tidak kosong).
     * Memanggil fungsi di layer `usecase`.
     * Mengembalikan response HTTP (JSON, status code 200, 400, 500, dll.).

5. **`module.go` (Dependency Wiring)**
   * **Fungsi:** Sebagai perekat. File ini bertugas membuat instance dari `repository`, memasukkannya ke `usecase`, memasukkan `usecase` ke `delivery` (handler), dan mendaftarkan route URL ke HTTP Server.

---

## 4. Alur Jalannya Request (Request Flow)

Bagaimana sebuah data mengalir dari browser/client hingga disimpan ke database? Mari kita ikuti alurnya saat admin melakukan **Login**:

```mermaid
sequenceDiagram
    actor Client
    participant Delivery as Delivery (Handler)
    participant Usecase as Usecase (Business Logic)
    participant Repo as Repository (Database Access)
    database DB as SQLite Database

    Client->>Delivery: HTTP POST /api/auth/login (JSON Body)
    Note over Delivery: 1. Bind JSON ke struct<br/>2. Validasi input (c.Validate)
    
    Delivery->>Usecase: Panggil Login(ctx, username, password)
    
    Usecase->>Repo: Panggil FindByUsername(ctx, username)
    Repo->>DB: Query: SELECT * FROM admins WHERE username = ...
    DB-->>Repo: Data Admin (hashed password)
    Repo-->>Usecase: Return Admin Entity
    
    Note over Usecase: 3. Cek password (bcrypt.Compare)<br/>4. Generate JWT Token
    
    Usecase-->>Delivery: Return Token & Admin Data
    Note over Delivery: 5. Bungkus response ke APIResponse DTO
    Delivery-->>Client: HTTP 200 OK (JSON Token)
```

---

## 5. Konsep Penting Go yang Digunakan

Sebagai pemula, ada beberapa fitur bahasa Go yang sering digunakan dalam project ini:

### A. Interface (Port) & Abstraksi
Interface digunakan untuk decoupling (memutuskan ketergantungan langsung).
* Contoh: Usecase membutuhkan cara untuk mencari admin di database. Kita membuat interface `AdminRepository` di layer `domain`.
* Manfaatnya: Saat menulis unit test untuk Usecase, kita bisa membuat "mock repository" (database palsu) dengan mudah tanpa harus menyalakan database asli.

### B. Struct Tags (Tag pada Struct)
Go menggunakan backtick (`` ` ``) untuk menambahkan metadata pada field struct. Contoh pada [dto.go](file:///g:/cloudflare-vpn/checker2-go/internal/module/auth/delivery/dto.go):
```go
type LoginRequest struct {
	Username string `json:"username" validate:"required"`
	Password string `json:"password" validate:"required"`
}
```
* **`json:"username"`**: Digunakan oleh serializer JSON (`c.Bind`) untuk memetakan field JSON `username` ke field struct Go `Username`.
* **`validate:"required"`**: Digunakan oleh library `go-playground/validator` untuk memastikan field tersebut tidak boleh kosong/nil saat divalidasi dengan `c.Validate()`.

### C. Dependency Injection (DI) secara Manual
Project ini tidak menggunakan framework DI (seperti Wire atau Dig), melainkan melakukan inisialisasi secara manual di file `main.go`. Ini sangat bagus untuk belajar karena alur pembuatan objek terlihat jelas.
* Contoh alur pembuatan objek di [main.go](file:///g:/cloudflare-vpn/checker2-go/cmd/server/main.go):
  ```go
  adminRepo := repository.NewAdminRepository(db)
  authUseCase := usecase.NewAuthUseCase(adminRepo, tokenProvider, hashProvider)
  authHandler := delivery.NewAuthHandler(authUseCase, logger)
  ```

---

## 6. Tips untuk Mempelajari Project Ini
1. **Mulai dari `cmd/server/main.go`**: Lihat bagaimana konfigurasi dibaca, database dihubungkan, dan modul-modul di-inisialisasi.
2. **Telusuri Satu Modul Saja**: Pilih modul `auth` karena ukurannya paling kecil dan sederhana. Pahami alur kodenya mulai dari `route.go` -> `handler.go` -> `usecase` -> `repository` -> `domain`.
3. **Pelajari Folder `pkg/`**: Bagian ini berisi utilitas independen. Anda bisa menyalin folder di dalam `pkg/` dan menggunakannya langsung di project Go lain karena mereka tidak memiliki dependensi ke modul internal aplikasi ini.
