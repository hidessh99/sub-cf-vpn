.PHONY: build run dev test lint docker-build docker-run clean

build:
	go build -o server ./cmd/server

run:
	go run ./cmd/server

dev:
	go run ./cmd/server

test:
	go test -v ./...

lint:
	golangci-lint run

docker-build:
	docker build -t cloudflare-vpn-checker2-go .

docker-run:
	docker run -d -p 4002:4002 -v $$(pwd)/data:/app/data --name cf-checker2-go cloudflare-vpn-checker2-go

clean:
	rm -f server
