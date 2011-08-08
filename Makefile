
.PHONY: all test
all: select-target

test:
	@for test in tests/*; do echo run test: $$test; $$test; done
