# Build Stage
FROM golang:1.23-alpine AS builder

# Install build dependencies for cgo (required by go-sqlite3)
RUN apk add --no-cache gcc musl-dev

WORKDIR /app

# Copy dependency files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build with cgo enabled
ENV CGO_ENABLED=1
RUN go build -ldflags="-w -s" -o server ./cmd/server

# Runtime Stage
FROM alpine:latest

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app

# Copy compiled binary
COPY --from=builder /app/server .

# Copy config files
COPY --from=builder /app/config.json .
COPY --from=builder /app/config.example.json .

# Create volume mount directory for SQLite persistence
RUN mkdir -p /app/data

EXPOSE 4002

VOLUME ["/app/data"]

CMD ["./server"]
