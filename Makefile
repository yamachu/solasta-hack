.PHONY: build deploy

build:
	$(MAKE) -C functions production

deploy:
	npx firebase deploy --only functions

setSolainvEnv: OUTGOING_TOKEN=
setSolainvEnv: OAUTH_TOKEN=
setSolainvEnv:
	@([ "$(OUTGOING_TOKEN)" ] && [ "$(OAUTH_TOKEN)" ]) && npx firebase functions:config:set solainv.slack.outgoing_token=$(OUTGOING_TOKEN) solainv.slack.oauth_token=$(OAUTH_TOKEN)|| (echo "OUTGOING_TOKEN and OAUTH_TOKEN must be set"; exit 1)
