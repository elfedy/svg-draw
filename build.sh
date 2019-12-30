#!/bin/bash

set -e
set -o pipefail

echo Starting build...
# Reset the build directory
rm -rf build
mkdir -p build

# Get html file
echo Copying .html files...
cp src/svg-draw.html build/
echo .html Files copied successfully

# Get js file
# TODO(Fede): check for typescript version and give an error
# if it is incorrect.
echo Compiling .ts files...
tsc src/svg-draw.ts --outFile build/svg-draw.js
echo .ts Files compiled successfully
