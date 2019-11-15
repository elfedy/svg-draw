#!/bin/bash

set -e
set -o pipefail

# Reset the build directory
rm -rf build
mkdir -p build

# Get html file
cp src/svg-draw.html build/

# Get js file
cp src/svg-draw.js build/
