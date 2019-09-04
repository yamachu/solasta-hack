.PHONY: build deploy

build:
	$(MAKE) -C functions production

deploy:
	npx firebase deploy --only functions
