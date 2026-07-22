---
name: go-backend-clean-arch
description: "Comprehensive guide for Go Clean Architecture, Echo v4 web framework, GORM ORM, concurrent proxy checking, and idiomatic Go backend development."
risk: safe
source: community
date_added: "2026-07-22"
---

# Go Backend Clean Architecture & Best Practices Guide

Guide for developing high-performance, maintainable Go microservices using Clean Architecture (Hexagonal / Ports & Adapters), Echo v4, GORM, and Go concurrency primitives.

## 1. Clean Architecture Layers

1. **Domain (Entities / Value Objects)**:
   - Define pure domain structs and interface contracts in `internal/module/<name>/domain/`.
   - Free from external dependencies (no Echo, no GORM tags if possible, or isolated).

2. **Ports (Interface Contracts)**:
   - Define repository and usecase interfaces in `internal/module/<name>/port/`.
   - Dependency inversion: Use-cases depend on abstractions, not concrete DB implementations.

3. **Usecase (Business Logic)**:
   - Business logic in `internal/module/<name>/usecase/`.
   - Handles transactions, validations, orchestration, and calls repository ports.

4. **Delivery / Handlers (HTTP / Echo)**:
   - Request decoding, DTO validation, and response mapping in `internal/module/<name>/delivery/`.
   - Never place database queries directly inside delivery handlers.

5. **Infrastructure (Database, Server, Logger)**:
   - GORM repositories in `internal/module/<name>/repository/`.
   - Echo server setup, middlewares, Viper config, Logrus logger in `internal/infrastructure/`.

## 2. Go Concurrency & Safety Rules

- **Context Propagation**: Always pass `context.Context` from Echo request (`c.Request().Context()`) down to Usecase and Repository functions.
- **Goroutine Leak Prevention**: Always ensure worker pools or goroutines launched in background handle context cancellation / timeouts and clean up channels/waitgroups properly.
- **Mutex Protection**: Protect shared state (e.g. status maps, counters) using `sync.RWMutex` or atomic operations.

## 3. GORM & Database Performance

- **Prepared Statements**: Use prepared statements and explicit field selection to avoid `SELECT *` where possible.
- **Prepared Transactions**: Wrap multi-step mutations in `db.Transaction(func(tx *gorm.DB) error { ... })`.
- **CGO-Free SQLite**: Prefer CGO-free drivers (`github.com/glebarez/sqlite`) for easy cross-compilation and Docker Alpine builds.

## 4. Error Handling & Validation

- **Structured Errors**: Use custom app error types (`pkg/apperror`) to map domain errors to HTTP status codes cleanly (`ErrNotFound` -> 404, `ErrInvalidInput` -> 400).
- **Validation**: Use `validator/v10` on incoming DTO structs before processing in usecase.
