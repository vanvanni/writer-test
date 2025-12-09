.PHONY: build

build:
	docker buildx build . -t vanvanni/write-test:latest
