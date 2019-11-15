#!/bin/bash

set -e
set -o pipefail

rm -rf build
mkdir -p build
cp src/svg-draw.html build/
cp src/svg-draw.js build/
