# Rewrite checker-go → checker2-go: Clean Architecture + Modular Monolith

## Background & Motivation

Rewrite codebase `checker-go` ke arsitektur **Clean Architecture + Modular Monolith** di `checker2-go`. Tujuan utama: **siap migrasi ke microservice** tanpa rewrite ulang.

### Tech Stack
| Component | Library |
|-----------|---------|
| HTTP Framework | Echo v4 |
| ORM | GORM |
| Database | SQLite |
| Logger | Logrus |
| Config | Viper |
| JWT | golang-jwt/jwt/v5 |
| Validator | go-playground/validator/v10 |
| Password | golang.org/x/crypto/bcrypt |

### Keputusan Arsitektur
| Keputusan | Pilihan |
|-----------|---------|
| GORM Tags | Tetap di entity (pragmatic) — tags hanya string, bukan import dependency |
| Go Module | `github.com/hidessh99/sub-cf-vpn/checker2-go` |
| Database | SQLite |
| Infra Layer | `internal/infrastructure/` |

---

## Fitur yang Ada (dari checker-go)

| Module | Fitur |
|--------|-------|
| **Auth** | Login, GetProfile, ChangePassword (JWT + bcrypt) |
| **Proxy** | CRUD, Import JSON, Public list, Grouped list, Health check cron, GeoIP lookup, TCP Checker |
| **Domain** | CRUD, Import JSON, Public list |
| **Bug** | CRUD, Import JSON, Public list |
| **Dashboard** | Aggregasi stats (count proxies, domains, bugs) |
| **System** | Health check endpoint |

---

## Masalah Arsitektur checker-go Saat Ini

| # | Problem | Impact |
|---|---------|--------|
| 1 | **Flat package structure** — Semua entity, repo, usecase di package yang sama | Sulit isolasi modul |
| 2 | **UseCase import DTO dari delivery layer** — `proxy_usecase.go` import `dto.CreateProxyRequest` | Violasi Dependency Rule |
| 3 | **Concrete logger coupling** — Semua layer langsung pakai `*logger.LogrusLogger` | Tidak bisa swap logger |
| 4 | **God Container** — `container.go` wire semua dependency di satu tempat | Single point of change |
| 5 | **Dashboard akses repo modul lain langsung** — Import `ProxyRepository`, `DomainRepository`, `BugRepository` | Tight coupling antar modul |
| 6 | **No context.Context** — Sebagian besar usecase method tidak terima context | Tidak bisa cancel/timeout |
| 7 | **Tests terpisah di `/test`** — Bukan co-located dengan module | Sulit maintain |
| 8 | **No module boundary** — Tidak ada contract/interface antar modul | Sulit pisah ke microservice |

---

## Arsitektur Baru

### Layer Diagram

```
+---------------------------------------------------+
|                   cmd/server                       |  Entry Point
+---------------------------------------------------+
|            internal/infrastructure                 |  Database, Logger, Server
+---------------------------------------------------+
|              internal/shared                       |  Shared Kernel
+---------+----------+----------+--------+----------+
|  auth   |  proxy   |domain_mgmt|  bug  |dashboard |  Modules
| +-----+ | +------+ | +------+ | +----+ | +------+ |
| |deliv| | |deliv | | |deliv | | |del | | |deliv | |
| +-----+ | +------+ | +------+ | +----+ | +------+ |
| |useca| | |usecase| | |usecase| | |uc | | |usecase| |
| +-----+ | +------+ | +------+ | +----+ | +------+ |
| |domain| | |domain | | |domain | | |dom| | |port  | |
| +-----+ | +------+ | +------+ | +----+ | +------+ |
| |repo  | | |repo+  | | |repo  | | |repo| |        |
| +-----+ | |adapter | | +------+ | +----+ |        |
|         | +------+ |          |        |          |
+---------+----------+----------+--------+----------+

Dependency Rule: Domain <- UseCase <- Delivery
                 Domain <- Adapters (Repository/Infrastructure)
```

### Module Communication Pattern

```
Dashboard Module --(port interface)--> Proxy Module
Dashboard Module --(port interface)--> Domain Module
Dashboard Module --(port interface)--> Bug Module

Dashboard mendefinisikan PORT (interface) sendiri.
Implementasi disediakan modul lain saat wiring di main.go.
Migrasi ke microservice: port diganti gRPC/HTTP client.
```

---

## Struktur Folder

```
checker2-go/
├── cmd/
│   └── server/
│       └── main.go                        # Entry point, bootstrap semua module
│
├── internal/
│   ├── shared/                            # SHARED KERNEL
│   │   ├── port/
│   │   │   └── logger.go                 # Logger interface (abstraksi)
│   │   ├── dto/
│   │   │   └── response.go              # APIResponse, PaginatedResponse
│   │   └── middleware/
│   │       ├── logger.go                 # Request logger middleware
│   │       ├── security.go              # Security headers
│   │       └── ratelimiter.go           # Rate limiter
│   │
│   ├── module/                            # BUSINESS MODULES
│   │   ├── auth/
│   │   │   ├── domain/
│   │   │   │   ├── entity.go            # Admin entity (GORM tags)
│   │   │   │   └── repository.go        # AdminRepository interface
│   │   │   ├── port/
│   │   │   │   └── auth_port.go         # AuthService interface (untuk modul lain)
│   │   │   ├── usecase/
│   │   │   │   ├── auth_usecase.go      # AuthUseCase interface + impl
│   │   │   │   └── auth_usecase_test.go
│   │   │   ├── repository/
│   │   │   │   └── admin_gorm.go        # GORM implementation
│   │   │   ├── delivery/
│   │   │   │   ├── handler.go           # HTTP handlers
│   │   │   │   ├── dto.go              # Request/Response DTOs
│   │   │   │   ├── middleware.go        # RequireAuth, OptionalAuth
│   │   │   │   └── route.go            # Route registration
│   │   │   └── module.go               # Module bootstrap + Wire
│   │   │
│   │   ├── proxy/
│   │   │   ├── domain/
│   │   │   │   ├── entity.go            # Proxy entity + CheckResult (GORM tags)
│   │   │   │   ├── repository.go        # ProxyRepository interface
│   │   │   │   └── service.go           # ProxyChecker, GeoIPService port interfaces
│   │   │   ├── port/
│   │   │   │   └── proxy_port.go        # ProxyCounter port (untuk Dashboard)
│   │   │   ├── usecase/
│   │   │   │   ├── proxy_usecase.go     # ProxyUseCase interface + impl
│   │   │   │   ├── health_checker.go    # Health check cycle logic (SRP)
│   │   │   │   └── proxy_usecase_test.go
│   │   │   ├── repository/
│   │   │   │   └── proxy_gorm.go        # GORM implementation
│   │   │   ├── adapter/
│   │   │   │   ├── checker.go           # TCP checker (impl ProxyChecker)
│   │   │   │   └── geoip.go            # GeoIP HTTP client (impl GeoIPService)
│   │   │   ├── delivery/
│   │   │   │   ├── handler.go           # HTTP handlers
│   │   │   │   ├── dto.go              # Request/Response DTOs
│   │   │   │   └── route.go
│   │   │   └── module.go
│   │   │
│   │   ├── domain_mgmt/                  # "domain_mgmt" karena "domain" conflict nama
│   │   │   ├── domain/
│   │   │   │   ├── entity.go            # DomainEntry entity (GORM tags)
│   │   │   │   └── repository.go        # DomainRepository interface
│   │   │   ├── port/
│   │   │   │   └── domain_port.go       # DomainCounter port (untuk Dashboard)
│   │   │   ├── usecase/
│   │   │   │   ├── domain_usecase.go    # DomainUseCase interface + impl
│   │   │   │   └── domain_usecase_test.go
│   │   │   ├── repository/
│   │   │   │   └── domain_gorm.go       # GORM implementation
│   │   │   ├── delivery/
│   │   │   │   ├── handler.go
│   │   │   │   ├── dto.go
│   │   │   │   └── route.go
│   │   │   └── module.go
│   │   │
│   │   ├── bug/
│   │   │   ├── domain/
│   │   │   │   ├── entity.go            # Bug entity (GORM tags)
│   │   │   │   └── repository.go        # BugRepository interface
│   │   │   ├── port/
│   │   │   │   └── bug_port.go          # BugCounter port (untuk Dashboard)
│   │   │   ├── usecase/
│   │   │   │   ├── bug_usecase.go       # BugUseCase interface + impl
│   │   │   │   └── bug_usecase_test.go
│   │   │   ├── repository/
│   │   │   │   └── bug_gorm.go          # GORM implementation
│   │   │   ├── delivery/
│   │   │   │   ├── handler.go
│   │   │   │   ├── dto.go
│   │   │   │   └── route.go
│   │   │   └── module.go
│   │   │
│   │   └── dashboard/
│   │       ├── port/
│   │       │   └── stats_port.go        # StatsProvider interface
│   │       ├── usecase/
│   │       │   └── dashboard_usecase.go # DashboardUseCase interface + impl
│   │       ├── delivery/
│   │       │   ├── handler.go
│   │       │   └── route.go
│   │       └── module.go
│   │
│   └── infrastructure/                    # INFRASTRUCTURE LAYER
│       ├── database/
│       │   ├── sqlite.go                 # SQLite + GORM init
│       │   └── seeder.go                # Database seeder
│       ├── logger/
│       │   └── logrus.go                # Logrus implements shared.Logger
│       ├── config/
│       │   └── config.go                # Viper config loading
│       └── server/
│           └── echo.go                  # Echo setup + error handler + graceful shutdown
│
├── pkg/                                   # PUBLIC UTILITIES
│   ├── apperror/
│   │   └── errors.go                     # AppError type
│   ├── ipvalidator/
│   │   ├── validator.go
│   │   └── validator_test.go
│   ├── jwt/
│   │   ├── jwt.go
│   │   └── jwt_test.go
│   └── password/
│       ├── password.go
│       └── password_test.go
│
├── config.json
├── config.example.json
├── Dockerfile
├── Makefile
├── .air.toml
├── .golangci.yml
├── go.mod
└── README.md
```

---

## Detail Per Module

### Shared Kernel (internal/shared/)

**shared/port/logger.go** — Abstract logger interface:
```go
type Logger interface {
    Debug(msg string, context string)
    Info(msg string, context string)
    Warn(msg string, context string)
    Error(msg string, err error, context string)
}
```

**shared/dto/response.go** — Common API response types:
- APIResponse: standard { success, message, data, error }
- PaginatedResponse: response dengan pagination
- PaginationInfo: { page, limit, total, totalPages }

**shared/middleware/** — Middleware non-auth yang dipakai global:
- logger.go: Request/response logging
- security.go: Security headers
- ratelimiter.go: IP-based rate limiter dengan sync.Map

---

### Auth Module (internal/module/auth/)

**domain/entity.go** — Admin entity dengan GORM tags
**domain/repository.go** — AdminRepository interface dengan context.Context
**port/auth_port.go** — TokenVerifier interface untuk modul lain
**usecase/auth_usecase.go** — Login, GetProfile, ChangePassword
**delivery/middleware.go** — RequireAuth, OptionalAuth (auth-specific)
**module.go** — Wire internal dependencies, expose Handler + Middleware

---

### Proxy Module (internal/module/proxy/)

**domain/service.go** — Port interfaces: ProxyChecker, GeoIPService
**port/proxy_port.go** — ProxyCounter port untuk Dashboard
**usecase/proxy_usecase.go** — CRUD, Import, Public list, GeoIP lookup
**usecase/health_checker.go** — Health check cycle (extracted, SRP)
**adapter/checker.go** — TCP dial checker implements ProxyChecker
**adapter/geoip.go** — HTTP GeoIP client implements GeoIPService
**module.go** — Wire + expose Handler, UseCase, Counter

---

### Domain Management Module (internal/module/domain_mgmt/)

**port/domain_port.go** — DomainCounter port untuk Dashboard
**usecase/domain_usecase.go** — GetAll, Create, Delete, Import, PublicList
**module.go** — Wire + expose Handler, Counter

---

### Bug Module (internal/module/bug/)

Pattern identik dengan domain_mgmt.
**port/bug_port.go** — BugCounter port untuk Dashboard

---

### Dashboard Module (internal/module/dashboard/)

**port/stats_port.go** — StatsProvider interface (TIDAK import modul lain):
```go
type StatsProvider interface {
    ProxyCount(ctx context.Context) (int64, error)
    DomainCount(ctx context.Context) (int64, error)
    BugCount(ctx context.Context) (int64, error)
}
```

Di main.go, StatsProvider di-wire dari Counter ports modul lain.

---

### Infrastructure (internal/infrastructure/)

**config/config.go** — Viper config loading
**database/sqlite.go** — GORM SQLite init (WAL, foreign keys, auto-migrate)
**database/seeder.go** — Seed admin + import JSON data
**logger/logrus.go** — Logrus implements shared.Logger interface
**server/echo.go** — Echo setup, error handler, CORS, graceful shutdown

---

## Wiring di main.go

```go
func main() {
    // 1. Infrastructure
    log := logger.InitLogger()
    cfg := config.LoadConfig(...)
    db  := database.InitDatabase(...)
    database.SeedDatabase(db, cfg, log)

    // 2. Modules
    authMod      := auth.New(db, cfg, log)
    proxyMod     := proxy.New(db, cfg, log)
    domainMod    := domain_mgmt.New(db, cfg, log)
    bugMod       := bug.New(db, cfg, log)

    // 3. Dashboard (wire ports dari module lain)
    statsAdapter := dashboard.NewStatsAdapter(
        proxyMod.Counter, domainMod.Counter, bugMod.Counter,
    )
    dashboardMod := dashboard.New(statsAdapter, log)

    // 4. Echo Server + Routes
    e := server.NewEcho(cfg, log)
    authMod.RegisterRoutes(e)
    proxyMod.RegisterRoutes(e)
    domainMod.RegisterRoutes(e)
    bugMod.RegisterRoutes(e)
    dashboardMod.RegisterRoutes(e)

    // 5. Background: Health check cron
    proxyMod.StartHealthCron(ctx, &wg)

    // 6. Start + Graceful shutdown
    server.Start(e, cfg, log)
}
```

---

## Key Improvements

| # | Improvement | Benefit |
|---|-------------|---------|
| 1 | Module boundaries — setiap module self-contained | Mudah extract ke microservice |
| 2 | Logger interface — shared.Logger port | Swap Logrus ke Zap tanpa ubah logic |
| 3 | No DTO in UseCase — usecase pakai domain entity | Clean dependency rule |
| 4 | Context propagation — semua method terima ctx | Proper cancellation & timeout |
| 5 | Module ports — Dashboard pakai interface | Loose coupling antar module |
| 6 | Co-located tests — test di samping kode | Mudah maintain |
| 7 | Module registration — tiap module register sendiri | Plug-and-play modules |
| 8 | Health checker extracted — file terpisah | SRP, mudah test |
| 9 | Centralized error handler — Echo HTTPErrorHandler | Consistent error responses |
| 10 | Auth middleware di auth module | Auth concern terisolasi |

---

## API Routes (Backward Compatible)

| Method | Path | Module | Auth |
|--------|------|--------|------|
| GET | /health | system | No |
| GET | / | system | No |
| POST | /api/v1/auth/login | auth | No (rate limited) |
| GET | /api/v1/auth/me | auth | Yes |
| PUT | /api/v1/auth/password | auth | Yes |
| GET | /api/v1/proxies | proxy | Yes |
| POST | /api/v1/proxies | proxy | Yes |
| PUT | /api/v1/proxies/:id | proxy | Yes |
| DELETE | /api/v1/proxies/:id | proxy | Yes |
| DELETE | /api/v1/proxies | proxy | Yes |
| POST | /api/v1/proxies/import | proxy | Yes |
| POST | /api/v1/proxies/sync-health | proxy | Yes |
| GET | /api/v1/proxies/geoip | proxy | Yes |
| GET | /api/v1/domains | domain_mgmt | Yes |
| POST | /api/v1/domains | domain_mgmt | Yes |
| DELETE | /api/v1/domains/:id | domain_mgmt | Yes |
| POST | /api/v1/domains/import | domain_mgmt | Yes |
| GET | /api/v1/bugs | bug | Yes |
| POST | /api/v1/bugs | bug | Yes |
| DELETE | /api/v1/bugs/:id | bug | Yes |
| POST | /api/v1/bugs/import | bug | Yes |
| GET | /api/v1/dashboard/stats | dashboard | Yes |
| GET | /api/v1/public/proxies | proxy | No |
| GET | /api/v1/public/proxies/grouped | proxy | No |
| GET | /api/v1/public/domains | domain_mgmt | No |
| GET | /api/v1/public/bugs | bug | No |
| GET | /api/check/:ips | proxy | No (rate limited) |
| GET | /api/check | proxy | No (rate limited) |

---

## Microservice Migration Path

| Step | Action |
|------|--------|
| 1 | Extract module folder ke repo terpisah |
| 2 | Module port/ interface diganti implementasi gRPC/HTTP client |
| 3 | Tambah API Gateway di depan |
| 4 | Database per service |
| 5 | Event bus untuk async cross-module communication |

HANYA port implementasi yang berubah saat migrasi. Domain, UseCase, dan Delivery layer tetap sama.

---

## Verification Plan

### Automated Tests
```bash
go test ./... -v -count=1
go test ./internal/module/auth/... -v
go test ./internal/module/proxy/... -v
go test ./internal/module/domain_mgmt/... -v
go test ./internal/module/bug/... -v
go test ./pkg/... -v
golangci-lint run ./...
go build -o server.exe ./cmd/server
```

### Manual Verification
- Start server dan test semua API endpoints
- Verify backward compatibility dengan frontend
- Test graceful shutdown (Ctrl+C)
- Test health check cron cycle
- Test rate limiter pada login dan checker endpoints
