#!/bin/bash

set -e
set -o pipefail

# Reset the build directory
rm -rf build
mkdir -p build

# Get html file
cp src/svg-draw.html build/

# Get js file
# TODO(fede): check for typescript version and give an error
# if it is incorrect.
tsc src/svg-draw.ts --outFile build/svg-draw.js
