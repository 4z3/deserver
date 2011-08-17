#! /bin/sh

export host=127.0.0.1
export port=1337
export handler=file

url=http://$host:$port/

run_tests() {
  content='Hello, world!'
  content_type='text/plain-zzz'

  begin 'GET nonexistent'
    GET
    assert status_code 404
    assert content ''
  end

  begin 'DELETE nonexistent'
    DELETE
    assert status_code 404
    assert content ''
  end

  begin 'PUT nonexistent'
    PUT "$content" "$content_type"
    assert status_code 201
    assert content ''
  end

  begin 'PUT existent'
    PUT "$content" "$content_type"
    assert status_code 405
    assert content ''
  end

  begin 'GET existent'
    GET
    assert status_code 200
    assert content "$content"
  end

  begin 'DELETE existent'
    DELETE
    assert status_code 200
    assert content ''
  end

  begin 'GET nonexistent (again)'
    GET
    assert status_code 404
    assert content ''
  end

  begin 'DELETE nonexistent (again)'
    GET
    assert status_code 404
    assert content ''
  end
}

set -euf

readlink="`readlink -f "$0"`"
dirname="`dirname "$readlink"`"

cd "$dirname/.."

temp1="`mktemp`"
temp2="`mktemp`"
atexit="${atexit+$atexit;}rm -f $temp1 $temp2"
trap "$atexit" EXIT INT


start_server() {
  node . &
  atexit="${atexit+$atexit;}kill -0 $! && kill $!"
  trap "$atexit" EXIT INT

  while ! curl -s -X HEAD $url; do
    sleep 0.05
  done
  echo 'server seems online'
}

filter_status_code() {
  sed -rn '
    /^</{
      s:[[:space:]]+: :g
      s:^< HTTP/[0-9]+\.[0-9]+ ([0-9]+) .*:\1:p
    }
  '
}

_curl() {
  curl --connect-timeout 1 -vsS "$@" $url 1>$temp1 2>$temp2
  test_status_code="`filter_status_code < $temp2`"
  test_content="`cat $temp1`"
}

PUT() {
  _curl -X PUT ${2+-H "content-type: $2"} --data-binary "$1"
}
GET() {
  _curl -X GET
}
DELETE() {
  _curl -X DELETE
}

begin() {
  test_name="$1"
}
end() {
  if test -n "${test_errors-}"; then
    test_total_errors="${test_total_errors+$test_total_errors}
$test_errors}"
    echo "$test_name: fail
`echo "$test_errors" | sed '1!s/^/  /'`"
  else
    echo "$test_name: [1;32mok[m"
  fi
  unset test_errors
  unset test_name
  unset test_content
  unset test_status_code
  unset test_result
};
assert() {
  eval "assert_value=\"\${test_$1}\""
  if test "$assert_value" != "$2"; then
    test_errors="${test_errors+$test_errors
}$1: \"[1;31m$assert_value[m\" != \"$2\""
  fi
}

set +e
start_server
run_tests
test_total_error_count="`echo -n "${test_total_errors-}" | wc -l`"
if test "$test_total_error_count" -gt 0; then
  exit 23
fi
