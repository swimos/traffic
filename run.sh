#!/bin/sh
set -xe 
cd ui
npm install
npm run compile && npm run bundle
mkdir -p ../server/ui
cp -rf index.html dist ../server/ui/
cd ../server
./gradlew clean run

