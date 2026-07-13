.PHONY: build run dev test docker-build docker-run clean

build:
	go build -o server ./cmd/server

run:
	go run ./cmd/server

dev:
	go run ./cmd/server

test:
	go test -v ./...

docker-build:
	docker build -t cloudflare-vpn-checker-go .

docker-run:
	docker run -d -p 4002:4002 -v $$(pwd)/data:/app/data --name cf-checker-go cloudflare-vpn-checker-go

clean:
	rm -f server
