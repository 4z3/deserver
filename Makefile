
.PHONY: all test publish publish-force
all: select-target

test:
	@for test in tests/*; do \
		if test -f $$test && test -x $$test; then \
			echo run test: $$test; \
			$$test; \
		fi; \
	done
	@echo 'Congratulations!  All the tests passed. :-D'

publish: version := $(shell tools/read-version < package.json)
publish:
	tools/is-clean-working-directory
	git tag $(force) v$(version)
	git push --tags origin master
	npm publish $(force)

publish-force: force := --force
publish-force: publish
