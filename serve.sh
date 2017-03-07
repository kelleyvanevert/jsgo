#!/bin/sh

if (lsof -i tcp:8004 -t); then
  kill -9 $(lsof -i tcp:8004 -t);
fi

python -m SimpleHTTPServer 8004 > /dev/null 2>&1 &
