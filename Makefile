
.PHONY: all test
all: select-target

test:
	@for test in tests/*; do \
		if test -f $$test && test -x $$test; then \
			echo run test: $$test; \
			$$test; \
		fi; \
	done
	@echo 'Congratulations!  All the tests passed. :-D'
