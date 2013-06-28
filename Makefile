MOCHA_OPTS=
REPORTER = tap

check: test

test: test-unit

test-unit:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		$(MOCHA_OPTS)

test-cov:
	@rm -rf lib-cov
	@jscoverage lib lib-cov
	@PLUGIN_COV=1 $(MAKE) test REPORTER=html-cov > coverage.html

generate-cert:
	@rm -f key.pem
	@rm -f cert.pem
	@openssl req -new -x509 -nodes -out .cert.pem -keyout .key.pem
	@mv .key.pem custom/key.pem
	@mv .cert.pem custom/cert.pem
	@echo
	@echo
	@echo "************************"
	@echo "Completed successfully"
	@echo "************************"

db-migrate:
	@node script/migrate.js

account-reset:
	@ripple account reset

.PHONY: test test-unit generate-cert db-migrate account-reset
