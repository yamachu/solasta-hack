.PHONY: build deploy

build:
	$(MAKE) -C functions production

deploy: build
	npx firebase deploy --only functions
