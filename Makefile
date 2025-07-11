.PHONY: build
build:
	@VERSION=$(shell jq -r '.version' package.json); \
	docker buildx build --platform linux/arm64,linux/amd64 \
		-t tkgling/r2_backup:latest-1.2.18 \
		-t tkgling/r2_backup:$$VERSION-1.2.18 . --push
