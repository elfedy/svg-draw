#!/bin/bash

set -e
set -o pipefail

echo Starting build...

echo Checking build dependencies...
# TODO(Fede): check for typescript version and give an error
# if it is incorrect.
if command -v tsc >/dev/null 2>&1; then
  echo Typescript is already installed.
else
  echo Did not find Typescript
  echo Installing...
  npm install -g typescript
fi

# Reset the build directory
rm -rf build
mkdir -p build

# Get html file
echo Copying .html files...
cp src/svg-draw.html build/index.html
echo .html Files copied successfully

# Get images
echo Copying .images
cp src/*.svg build/
cp src/*.png build/

# Get js file

echo Compiling .ts files...
tsc src/svg-draw.ts --outFile build/svg-draw.js
echo .ts Files compiled successfully
