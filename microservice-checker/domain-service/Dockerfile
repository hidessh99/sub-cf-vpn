# Build Stage
FROM golang:1.26-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build binary
ENV CGO_ENABLED=0
RUN go build -ldflags="-w -s" -o server ./cmd/server

# Runtime Stage
FROM alpine:latest

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app

# Copy compiled binary and configuration
COPY --from=builder /app/server .
COPY --from=builder /app/config*.json ./

# Create volume mount directory for SQLite persistence
RUN mkdir -p /app/data

EXPOSE 8082

VOLUME ["/app/data"]

CMD ["./server"]
