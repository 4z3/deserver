    If affection lead a man to favor the less worthy in desert, let
    him do it, without depraving or disabling the better deserver.
    -- The Essays by Bacon, Sir Francis

# Quick Start Guide

    git clone https://github.com/4z3/deserver
    node deserver &
    f=/bin/bash
    t="`file -ib $f`"
    curl -X PUT --data-binary @$f -H "Content-Type:$t" http://127.0.0.1:1337$f
    curl http://127.0.0.1:1337$f > $f # yay^_^
    curl -X DELETE http://127.0.0.1:1337$f

# STDOUT

On startup the server annources itself using the following format:

    "Deserving HTTP -> on %s port %u\n", hostname, port

Each HTTP-request is reported using the following format:

    "%s %s %u\n", method, url, statusCode

