# Cloudflare VPN Checker (Modular Monolith + Clean Architecture)

Rewrite version of the Go backend (`checker-go`) utilizing **Modular Monolith** and **Clean Architecture** patterns, designed to make microservice migration trivial.

## Project Structure

```
checker2-go/
├── cmd/
│   └── server/
│       └── main.go                        # Application bootstrapper & module wiring
├── internal/
│   ├── shared/                            # Shared Kernel (common code)
│   │   ├── port/                          # Shared ports (e.g. Logger interface)
│   │   ├── dto/                           # API DTO contracts
│   │   └── middleware/                    # Global middlewares (Logger, RateLimiter, Security)
│   ├── module/                            # Domain Modules (Fully isolated)
│   │   ├── auth/                          # Authentication Module
│   │   ├── proxy/                         # Proxy health checking and lookup Module
│   │   ├── domain_mgmt/                   # Domain management Module
│   │   ├── bug/                           # Host/SNI Bug list Module
│   │   └── dashboard/                     # Statistics dashboard Module
│   └── infrastructure/                    # Platform layers (Config, GORM/SQLite, Echo Server)
└── pkg/                                   # Domain-agnostic utilities (jwt, password, ipvalidator)
```

## Architecture Principles

### 1. Dependency Rule
Dependency flows inward: `Delivery -> UseCase -> Domain`.
The core business logic (`domain` and `usecase`) has zero knowledge of GORM, Echo, HTTP, or any external framework.

### 2. High Cohesion & Low Coupling (Isolate Modules)
Each module under `internal/module/` is entirely self-contained. A module should not import code from another module directly unless it is via defined port interfaces.

### 3. Ports & Adapters Communication
When `Dashboard` needs statistics from `Proxy`, `Domain`, and `Bug`, it does **not** import their repositories or usecases. Instead, the `Dashboard` defines a `StatsProvider` port interface, and the other modules satisfy it. Wiring is completed in `main.go` using a `statsAdapter`.

This means migrating any module to a microservice requires zero changes to the business logic; you only swap the in-process adapter with an HTTP/gRPC client adapter.

## Setup & Running

1. **Prerequisites**: Go 1.24+ installed on your system.
2. **Configuration**: Copy `config.example.json` to `config.json` and adjust the variables.
3. **Running Local Server**:
   ```bash
   go run ./cmd/server
   ```
4. **Running Unit Tests**:
   ```bash
   go test ./... -v
   ```

## Development Commands (Makefile)

- `make build`: Compile server binary
- `make dev`: Run dev server
- `make test`: Run all unit tests
- `make lint`: Run golangci-lint analysis
- `make docker-build`: Package the service as a Docker container

## Microservice Migration Guide

When a module (e.g. `Proxy`) needs to be scaled independently as a microservice:
1. Move the `internal/module/proxy/` directory to a new Git repository.
2. Implement an HTTP or gRPC client implementation of `StatsProvider` in the monolith.
3. Replace the monolith's local database reference with API calls or pub/sub events.
4. Set up an API gateway at the front to route proxy check traffic to the new service.
