# 📘 Checker Service - Unit Test Suite Documentation

Dokumen ini ditulis sebagai panduan teknis bagi developer mendatang (*onboarding guide*) untuk memahami arsitektur, skenario, dan fungsionalitas dari unit test yang berada pada folder [checker/test](file:///g:/cloudflare-vpn/checker/test).

---

## 🏗️ Filosofi Desain Pengujian

Unit test pada layanan `checker` dirancang menggunakan prinsip **Clean Architecture & Dependency Injection**. 
*   **Tanpa Side Effects**: Pengujian tidak menyentuh database SQLite asli yang berada di disk (`admin.db`) ataupun melakukan panggilan HTTP luar secara aktual (GeoIP API dibypass).
*   **In-Memory Mocks**: Kami menggunakan pola *Fake/Mock Repository* yang mengimplementasikan interface repositori menggunakan array JavaScript sederhana. Hal ini menjamin unit test berjalan super cepat (< 3 detik untuk 41 skenario) dan deterministik.

---

## 🛠️ 1. Mock Repositories (`mocks.ts`)
Berkas [mocks.ts](file:///g:/cloudflare-vpn/checker/test/mocks.ts) menyediakan data-store tiruan (*mock storage*) untuk menggantikan database SQLite.

Setiap kelas mock mengimplementasikan kontrak interface yang didefinisikan pada [interfaces.ts](file:///g:/cloudflare-vpn/checker/src/repositories/interfaces.ts):
*   `MockAdminRepository` → `IAdminRepository`
*   `MockBugRepository` → `IBugRepository`
*   `MockDomainRepository` → `IDomainRepository`
*   `MockProxyRepository` → `IProxyRepository`

---

## 🔐 2. Authentication Test Suite (`auth.test.ts`)
Berkas [auth.test.ts](file:///g:/cloudflare-vpn/checker/test/auth.test.ts) memvalidasi alur keamanan, otentikasi admin, dan manajemen kredensial pada `AuthUseCase`.

### Skenario Pengujian:
1.  **`login` - Login Berhasil**:
    *   *Deskripsi*: Memastikan admin dengan kredensial yang tepat (`username` dan `password` cocok) dapat masuk dan menerima token JWT yang valid serta data profil (tanpa hash password).
    *   *Ekspektasi*: Mengembalikan JWT token dan info admin dengan ID `1`.
2.  **`login` - Username Salah**:
    *   *Deskripsi*: Menguji percobaan login dengan username yang tidak terdaftar.
    *   *Ekspektasi*: Melempar `UnauthorizedError` dengan pesan `"Invalid username or password"`.
3.  **`login` - Password Salah**:
    *   *Deskripsi*: Menguji percobaan login dengan username terdaftar namun password tidak cocok.
    *   *Ekspektasi*: Melempar `UnauthorizedError` dengan pesan `"Invalid username or password"`.
4.  **`getProfile` - Pengambilan Profil Sukses**:
    *   *Deskripsi*: Memvalidasi pengambilan profil admin berdasarkan ID yang valid. Memastikan hash password **tidak diikutsertakan** dalam nilai kembalian demi keamanan.
    *   *Ekspektasi*: Profil berhasil dikembalikan dan properti `password` bernilai `undefined`.
5.  **`getProfile` - ID Admin Tidak Ditemukan**:
    *   *Deskripsi*: Memasukkan ID admin acak yang tidak ada dalam mock database.
    *   *Ekspektasi*: Melempar `NotFoundError` dengan pesan `"Admin not found"`.
6.  **`changePassword` - Penggantian Password Berhasil**:
    *   *Deskripsi*: Menguji alur penggantian password dengan memberikan kata sandi lama yang valid dan kata sandi baru.
    *   *Ekspektasi*: Sukses tanpa error, dan jika dicoba login menggunakan password baru, proses autentikasi berhasil.
7.  **`changePassword` - Password Lama Salah**:
    *   *Deskripsi*: Mencoba mengganti password dengan memasukkan kata sandi saat ini yang salah.
    *   *Ekspektasi*: Melempar `ValidationError` dengan pesan `"Incorrect current password"`.
8.  **`changePassword` - Admin Tidak Terdaftar**:
    *   *Deskripsi*: Melakukan operasi ganti password pada ID admin yang tidak valid.
    *   *Ekspektasi*: Melempar `NotFoundError` dengan pesan `"Admin not found"`.

---

## 📡 3. Proxy Management Test Suite (`proxy.test.ts`)
Berkas [proxy.test.ts](file:///g:/cloudflare-vpn/checker/test/proxy.test.ts) menguji siklus hidup data Proxy Cloudflare (VLESS/Trojan/Shadowsocks) pada `ProxyUseCase`.

### Skenario Pengujian:
1.  **`createProxy` - Pembuatan Berhasil**:
    *   *Deskripsi*: Membuat entri proxy baru dengan parameter lengkap (IP, Port, Latency, Country, AS Organization).
    *   *Ekspektasi*: Properti data tersimpan dengan benar, ID bertambah secara otomatis, dan total data di mock database bernilai `1`.
2.  **`createProxy` - IP Kosong**:
    *   *Deskripsi*: Validasi input ketika kolom IP bernilai string kosong.
    *   *Ekspektasi*: Melempar `ValidationError` dengan pesan `"IP field is required"`.
3.  **`getAllProxies` - Paginasi**:
    *   *Deskripsi*: Memastikan pagination (halaman & limit) bekerja dengan membagi 3 data proxy tiruan.
    *   *Ekspektasi*: Halaman 1 dengan limit 2 menghasilkan 2 data (total 3), halaman 2 menghasilkan sisa 1 data.
4.  **`getAllProxies` - Filter Status Aktif/Mati**:
    *   *Deskripsi*: Memisahkan data proxy yang aktif (`is_active: true`) dan mati (`is_active: false`).
    *   *Ekspektasi*: Filter `is_active: true` mengembalikan 2 data, filter `is_active: false` mengembalikan 1 data.
5.  **`getAllProxies` - Filter Negara**:
    *   *Deskripsi*: Menyaring proxy berdasarkan kode negara (misalnya `"ID"`).
    *   *Ekspektasi*: Hanya mengembalikan proxy yang memiliki properti `country: "ID"`.
6.  **`getAllProxies` - Pencarian Teks (Search)**:
    *   *Deskripsi*: Melakukan query pencarian teks parsial pada IP, proxy, negara, atau organisasi ASN.
    *   *Ekspektasi*: Pencarian `"3.3.3"` mengembalikan entri proxy yang sesuai.
7.  **`updateProxy` - Pembaruan Berhasil**:
    *   *Deskripsi*: Memperbarui properti proxy (misal mengubah nilai `latency` dan mematikan status `is_active`).
    *   *Ekspektasi*: Properti yang diubah berhasil diperbarui, sedangkan properti lain (seperti `ip`) tetap tidak berubah.
8.  **`updateProxy` - Proxy Tidak Ditemukan**:
    *   *Deskripsi*: Melakukan update pada ID proxy yang tidak terdaftar.
    *   *Ekspektasi*: Melempar `NotFoundError` dengan pesan `"Proxy not found"`.
9.  **`deleteProxy` - Penghapusan Berhasil**:
    *   *Deskripsi*: Menghapus proxy berdasarkan ID yang valid.
    *   *Ekspektasi*: Jumlah data pada mock berkurang, dan pencarian ID tersebut mengembalikan `null`.
10. **`deleteProxy` - Proxy Tidak Ditemukan**:
    *   *Deskripsi*: Mencoba menghapus ID proxy yang tidak valid.
    *   *Ekspektasi*: Melempar `NotFoundError` dengan pesan `"Proxy not found"`.
11. **`importFromJSON` - Impor Massal Sukses**:
    *   *Deskripsi*: Mengimpor array objek JSON proxy secara massal.
    *   *Ekspektasi*: Seluruh objek diimpor dengan benar dan mengembalikan jumlah data yang berhasil diimpor.
12. **`importFromJSON` - Format Bukan Array**:
    *   *Deskripsi*: Menyediakan format objek tunggal atau tipe lain alih-alih array untuk impor massal.
    *   *Ekspektasi*: Melempar `ValidationError` dengan pesan `"Import data must be a JSON array"`.
13. **`importFromJSON` - Item Kehilangan Kolom IP**:
    *   *Deskripsi*: Menguji validitas data impor jika salah satu item dalam array tidak memiliki properti `ip`.
    *   *Ekspektasi*: Melempar `ValidationError` dengan pesan `"Missing required field 'ip' in import items"`.
14. **`getPublicProxyList` - Filter Data Publik**:
    *   *Deskripsi*: Memastikan endpoint publik hanya mengekspos proxy yang berstatus **aktif** (`is_active: true`).
    *   *Ekspektasi*: Proxy yang mati tidak masuk dalam daftar publik.
15. **`getPublicProxyListGrouped` - Pengelompokan Negara**:
    *   *Deskripsi*: Memastikan format keluaran terkelompok berdasarkan kode negara (kapital) untuk digunakan oleh generator vpn frontend.
    *   *Ekspektasi*: Menghasilkan struktur `{ "US": ["proxy1:443", "proxy3:443"] }`.

---

## 🌐 4. Domain Management Test Suite (`domain.test.ts`)
Berkas [domain.test.ts](file:///g:/cloudflare-vpn/checker/test/domain.test.ts) memvalidasi pengelolaan wildcard subdomain Cloudflare pada `DomainUseCase`.

### Skenario Pengujian:
1.  **`createDomain` - Pembuatan Berhasil**:
    *   *Deskripsi*: Menambah domain penanda baru ke database.
    *   *Ekspektasi*: Data tersimpan dan ID bertambah secara berurutan.
2.  **`createDomain` - Normalisasi Input**:
    *   *Deskripsi*: Memastikan input domain dibersihkan dari spasi berlebih (*trimming*) dan diubah menjadi huruf kecil (*lowercasing*).
    *   *Ekspektasi*: Input `"  CF-vPN.Net  "` otomatis tersimpan sebagai `"cf-vpn.net"`.
3.  **`createDomain` - Domain Kosong**:
    *   *Deskripsi*: Menguji pencegahan input domain bernilai kosong.
    *   *Ekspektasi*: Melempar `ValidationError` dengan pesan `"Domain name is required"`.
4.  **`createDomain` - Duplikasi Domain**:
    *   *Deskripsi*: Menguji pencegahan pendaftaran domain yang sudah terdaftar sebelumnya.
    *   *Ekspektasi*: Melempar `ValidationError` dengan pesan `"Domain 'cloudflare.com' already exists"`.
5.  **`getAllDomains` - Pengurutan Data**:
    *   *Deskripsi*: Memastikan pengambilan daftar domain diurutkan dari yang terbaru (ID terbesar).
    *   *Ekspektasi*: Mengembalikan list domain dengan urutan indeks terbalik dari urutan pembuatan.
6.  **`deleteDomain` - Penghapusan Berhasil**:
    *   *Deskripsi*: Menghapus domain berdasarkan ID.
    *   *Ekspektasi*: Entri terhapus dari mock database.
7.  **`importFromJSON` - Impor Massal & Deduplikasi**:
    *   *Deskripsi*: Mengimpor daftar domain berbentuk array of string, sekaligus menguji deteksi duplikasi saat impor.
    *   *Ekspektasi*: Jika diinput `["abc.com", "xyz.net", "  ABC.COM  "]`, data yang masuk hanya 2 domain unik.
8.  **`importFromJSON` - Validasi Format**:
    *   *Deskripsi*: Menguji input impor yang bukan berupa array.
    *   *Ekspektasi*: Melempar `ValidationError` dengan pesan `"Import data must be a JSON array of strings"`.
9.  **`getPublicDomainList` - Daftar Publik**:
    *   *Deskripsi*: Memastikan data dikembalikan dalam bentuk array string sederhana `string[]` agar kompatibel dengan pembaca konfigurasi statis frontend yang lama.
    *   *Ekspektasi*: Mengembalikan `["one.com", "two.net"]`.

---

## 🐛 5. Bug Hostname Test Suite (`bug.test.ts`)
Berkas [bug.test.ts](file:///g:/cloudflare-vpn/checker/test/bug.test.ts) memvalidasi pengelolaan SNI / Bug Host untuk CDN Cloudflare pada `BugUseCase`.

### Skenario Pengujian:
1.  **`createBug` - Pembuatan Berhasil**:
    *   *Deskripsi*: Mendaftarkan bug host baru.
    *   *Ekspektasi*: Data tersimpan dan ID bertambah secara berurutan.
2.  **`createBug` - Normalisasi Input**:
    *   *Deskripsi*: Memastikan input bug di-trim dan di-lowercase.
    *   *Ekspektasi*: Input `"  BUG-HOST.id  "` disimpan sebagai `"bug-host.id"`.
3.  **`createBug` - Hostname Kosong**:
    *   *Deskripsi*: Menguji pencegahan input bug hostname bernilai kosong.
    *   *Ekspektasi*: Melempar `ValidationError` dengan pesan `"Hostname is required"`.
4.  **`createBug` - Duplikasi Bug Host**:
    *   *Deskripsi*: Menguji pencegahan pendaftaran bug host yang sudah ada.
    *   *Ekspektasi*: Melempar `ValidationError` dengan pesan `"Bug hostname 'bug.com' already exists"`.
5.  **`getAllBugs` - Pengurutan Data**:
    *   *Deskripsi*: Memastikan pengambilan daftar bug host diurutkan dari yang terbaru (ID terbesar).
    *   *Ekspektasi*: Mengembalikan list bugs dengan urutan indeks terbalik.
6.  **`deleteBug` - Penghapusan Berhasil**:
    *   *Deskripsi*: Menghapus bug host berdasarkan ID.
    *   *Ekspektasi*: Entri terhapus dari database.
7.  **`importFromJSON` - Impor Massal & Deduplikasi**:
    *   *Deskripsi*: Mengimpor daftar bug host berbentuk array of string, sekaligus deduplikasi.
    *   *Ekspektasi*: Mengabaikan duplikasi teks dan hanya mengimpor item unik.
8.  **`importFromJSON` - Validasi Format**:
    *   *Deskripsi*: Menguji input impor yang bukan berupa array.
    *   *Ekspektasi*: Melempar `ValidationError` dengan pesan `"Import data must be a JSON array of strings"`.
9.  **`getPublicBugList` - Daftar Publik**:
    *   *Deskripsi*: Memastikan output dikonversi menjadi array string sederhana `string[]` untuk sinkronisasi generator frontend.
    *   *Ekspektasi*: Mengembalikan `["line.me", "whatsapp.net"]`.

---

## 🏃 Cara Menjalankan Test Suite
Untuk menjalankan seluruh skenario pengujian di atas, buka terminal dan ketik perintah berikut:
```bash
cd checker
bun test
```
Jika ingin menjalankan tes tertentu secara spesifik (misalnya hanya tes otentikasi):
```bash
bun test test/auth.test.ts
```
