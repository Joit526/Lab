#!/bin/bash

set -e

echo "Checking project files..."

test -f index.html
test -f style.css
test -f game.js
test -f Dockerfile

echo "Checking HTML connections..."

grep -q "style.css" index.html
grep -q "game.js" index.html

echo "All tests passed!"
