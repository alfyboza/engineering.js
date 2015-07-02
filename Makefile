SOURCES := $(wildcard lib/*.js)
TESTS   := $(wildcard test/*.test.js)
ALL     := $(SOURCES) $(TESTS)

all: lint test

clean:
	rm -rf coverage

coverage: $(SOURCES) $(TESTS)
	npm run coverage -- $(TESTS)
	@touch $@

coveralls: coverage
	cat ./coverage/lcov.info | npm run coveralls

lint:
	npm run lint -- $(ALL)

test: $(SOURCES)
	npm test -- $(TESTS)

watch:
	npm run watch -- $(ALL)

.PHONY: all clean coveralls lint watch
