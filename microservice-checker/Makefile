.PHONY: lint test build clean docker-build docker-up docker-down docker-logs

lint:
	cd bug-service && golangci-lint run
	cd domain-service && golangci-lint run
	cd proxy-service && golangci-lint run

test:
	cd bug-service && go test -v ./...
	cd domain-service && go test -v ./...
	cd proxy-service && go test -v ./...

build:
	cd bug-service && go build ./...
	cd domain-service && go build ./...
	cd proxy-service && go build ./...

docker-build:
	docker compose build

docker-up:
	docker compose up -d

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f

