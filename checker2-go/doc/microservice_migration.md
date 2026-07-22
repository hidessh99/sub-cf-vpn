# Panduan Migrasi ke Microservices: checker2-go

Dokumen ini menjelaskan langkah demi langkah secara detail tentang bagaimana memigrasikan salah satu modul dari sistem **Modular Monolith** `checker2-go` ke **Microservices** yang independen.

---

## 1. Mengapa Migrasi di `checker2-go` Sangat Mudah?

Dalam monolit tradisional, kode antar-fitur biasanya sangat terikat satu sama lain (*tightly coupled*). Namun, project `checker2-go` dirancang dengan prinsip **Clean Architecture** dan **Modular Monolith**:
1. **Isolasi Modul:** Setiap modul di `internal/module/` terisolasi dan tidak boleh mengimpor modul lain secara langsung.
2. **Ports & Adapters:** Komunikasi antar-modul dilakukan melalui interface (Ports) yang dihubungkan (*wired*) di tingkat `main.go` menggunakan adapter.

Misalnya, modul `dashboard` membutuhkan data statistik dari modul `proxy`. Modul `dashboard` mendefinisikan interface (Port) bernama `StatsProvider`. Modul `proxy` memiliki adapter yang mengimplementasikan interface tersebut. Di `main.go`, adapter ini dimasukkan ke dalam `dashboard`. 

Dengan desain ini, memisahkan modul menjadi microservice hanya membutuhkan penggantian adapter lokal menjadi adapter jaringan (API/gRPC), tanpa mengubah logika bisnis di dalam modul itu sendiri.

---

## 2. Tahapan Migrasi Lengkap (Step-by-Step)

Mari kita ambil contoh memindahkan modul **`proxy`** menjadi microservice terpisah karena beban kerjanya tinggi (melakukan pengecekan kestabilan VPN proxy secara berkala).

### Tahap 1: Membuat Repositori Git Baru
Langkah pertama adalah menyiapkan rumah baru untuk microservice tersebut.
1. Buat repositori baru di GitHub/GitLab, misalnya bernama `checker-proxy-service`.
2. Lakukan inisialisasi modul Go baru di repositori tersebut:
   ```bash
   go mod init github.com/username/checker-proxy-service
   ```

### Tahap 2: Ekstraksi Kode Modul
1. Pindahkan folder `internal/module/proxy/` dari monolit ke repositori baru.
2. Salin utilitas independen dari folder `pkg/` yang dibutuhkan oleh modul proxy, seperti `pkg/ipvalidator/`.
3. Salin setup infrastruktur dasar dari folder `internal/infrastructure/` (seperti database SQLite/GORM connection, server initialization, config reader, dan logger).

### Tahap 3: Membuat Entrypoint (`main.go`) Baru di Service Baru
Di dalam repositori baru (`checker-proxy-service`), buat file `cmd/server/main.go` yang akan menjalankan HTTP server sendiri khusus untuk mengelola proxy.
```go
package main

import (
    "github.com/labstack/echo/v4"
    "github.com/username/checker-proxy-service/internal/infrastructure/database"
    "github.com/username/checker-proxy-service/internal/infrastructure/config"
    "github.com/username/checker-proxy-service/internal/module/proxy"
)

func main() {
    // 1. Load config & Logger
    cfg := config.LoadConfig()
    db := database.ConnectSQLite(cfg)
    
    // 2. Initialize Echo Server
    e := echo.New()
    
    // 3. Register Proxy Module
    proxy.RegisterModule(e, db, cfg)
    
    // 4. Start Server
    e.Start(":8081") // Berjalan di port tersendiri
}
```

### Tahap 4: Migrasi Database (Database-per-Service)
Salah satu aturan mutlak microservices adalah **tidak boleh berbagi database langsung** (*no shared database*).
1. Pisahkan tabel yang berhubungan dengan `proxy` (misalnya tabel `proxies`, `proxy_checks`, dsb.) dari database utama monolit.
2. Pindahkan data yang sudah ada ke database baru yang dikelola langsung oleh `checker-proxy-service`.
3. Mulai sekarang, monolit tidak boleh melakukan query SQL langsung ke tabel proxy, begitu pula sebaliknya.

### Tahap 5: Mengubah Komunikasi Lokal ke Komunikasi Jaringan
Di dalam monolit, modul `dashboard` awalnya memanggil data statistik secara lokal melalui memori:

```
[Dashboard Usecase] ---> (Lokal Interface: StatsProvider) ---> [Proxy Local Adapter] (Akses DB Lokal)
```

Karena modul proxy sudah dipindahkan, kita harus membuat **Network Adapter** baru di dalam monolit yang memanggil HTTP API atau gRPC ke `checker-proxy-service`:

```
[Dashboard Usecase] ---> (Lokal Interface: StatsProvider) ---> [Proxy HTTP Client Adapter]  ---(REST API/gRPC)---> [checker-proxy-service]
```

#### Contoh Implementasi HTTP Client Adapter di Monolit:
Buat adapter baru di monolit untuk menggantikan pemanggilan lokal:
```go
package adapter

import (
	"context"
	"encoding/json"
	"net/http"
)

type ProxyServiceClient struct {
	client  *http.Client
	baseURL string
}

func NewProxyServiceClient(baseURL string) *ProxyServiceClient {
	return &ProxyServiceClient{
		client:  &http.Client{},
		baseURL: baseURL,
	}
}

// Implementasikan method StatsProvider interface
func (c *ProxyServiceClient) GetProxyStats(ctx context.Context) (int64, int64, error) {
	resp, err := c.client.Get(c.baseURL + "/api/proxies/stats")
	if err != nil {
		return 0, 0, err
	}
	defer resp.Body.Close()

	var result struct {
		Active int64 `json:"active"`
		Total  int64 `json:"total"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return 0, 0, err
	}
	return result.Active, result.Total, nil
}
```

Kemudian di `main.go` milik monolit, ganti binding adapter yang lama dengan adapter HTTP client yang baru:
```go
// SEBELUMNYA:
// proxyStatsAdapter := proxy.NewStatsAdapter(proxyUseCase)

// SEKARANG:
proxyStatsAdapter := adapter.NewProxyServiceClient("http://localhost:8081")

// Masukkan ke dashboard usecase (Dashboard tidak menyadari bahwa data diambil lewat jaringan)
dashboardUseCase := dashboardUsecase.NewDashboardUseCase(proxyStatsAdapter, bugStatsAdapter)
```

### Tahap 6: Memasang API Gateway
Sebelum migrasi, client (misal: UI Frontend) menembak semua API ke satu port server monolit (misal `:8080`). Setelah modul `proxy` dipisah ke port `:8081`, kita membutuhkan **API Gateway** agar frontend tetap mengakses satu alamat yang sama.

Anda bisa menggunakan Nginx, Traefik, Kong, atau Cloudflare Workers.

#### Contoh Konfigurasi Nginx:
```nginx
server {
    listen 80;

    # Route untuk Autentikasi tetap ke Monolith
    location /api/auth {
        proxy_pass http://localhost:8080;
    }

    # Route untuk Proxy diarahkan ke Microservice Baru
    location /api/proxies {
        proxy_pass http://localhost:8081;
    }

    # Route default tetap ke Monolith
    location / {
        proxy_pass http://localhost:8080;
    }
}
```

---

## 3. Checklist Penting saat Migrasi

1. **Keamanan (Authentication & Authorization):**
   * Di dalam monolit, pengecekan JWT dilakukan di memory. Di microservices, Anda bisa melakukan verifikasi JWT di tingkat API Gateway sebelum request diteruskan ke microservice, atau membagikan JWT Secret Key ke microservice baru agar ia bisa memverifikasi token secara mandiri.
2. **Penanganan Kegagalan Jaringan (Circuit Breaker):**
   * Karena komunikasi kini lewat jaringan (HTTP/gRPC), ada risiko jaringan lambat atau terputus. Gunakan library *Circuit Breaker* (seperti `go-resiliency/breaker` atau `sony/gobreaker`) di client adapter monolit agar tidak membuat monolit ikut *crash* saat microservice proxy sedang mati.
3. **Observabilitas (Distributed Tracing):**
   * Gunakan Trace ID yang diteruskan dari API Gateway ke monolit dan microservice (menggunakan OpenTelemetry atau Jaeger) agar Anda mudah melacak alur request yang melewati beberapa server jika terjadi error.
4. **CI/CD Pipeline:**
   * Buat pipeline deployment terpisah antara monolit dan `checker-proxy-service` sehingga tim bisa melakukan deploy fitur proxy tanpa perlu men-deploy ulang server monolit.
