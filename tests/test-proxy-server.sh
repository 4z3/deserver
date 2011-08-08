#! /bin/sh

fe_port=1337; fe_url="http://127.0.0.1:$fe_port"
be_port=1338; be_url="http://127.0.0.1:$be_port"

run_tests() {
  p_content="{\"baseURL\":\"$be_url\"}"
  p_type='application/vnd.deserver.proxy-v0+json'

  begin 'PUT /p (nonexistent proxy resource)'
    PUT "$fe_url/p" "$p_content" "$p_type"
    assert status_code 201
    assert content ''
  end

  f=tests/data/foo.txt
  begin "GET /p/$f"
    GET "$fe_url/p/$f" "$p_content" "$p_type"
    assert status_code 200
    assert content "`cat $f`"
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
  atexit="${atexit+$atexit;}kill -n 0 $! && kill $!"
  trap "$atexit" EXIT INT
  while ! curl -s -X HEAD "$fe_url"; do
    sleep 0.05
  done

  echo 'front-end server seems online'

  # backend server
  python2 -m SimpleHTTPServer $be_port &
  atexit="${atexit+$atexit;}kill -n 0 $! && kill $!"
  trap "$atexit" EXIT INT
  while ! curl -s -X GET "$be_url" >/dev/null; do
    sleep 0.05
  done

  echo 'back-end server seems online'
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
  curl --connect-timeout 1 -vsS "$@" 1>$temp1 2>$temp2
  test_status_code="`filter_status_code < $temp2`"
  test_content="`cat $temp1`"
}

PUT() {
  PUT_url="$1"; shift
  _curl -X PUT ${2+-H "content-type: $2"} --data-binary "$1" "$PUT_url"
}
GET() {
  _curl -X GET "$1"
}
DELETE() {
  _curl -X DELETE "$1"
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
