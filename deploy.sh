#!/usr/bin/env bash

set -e # halt script on error
set -x

npm run build
cp app/CNAME static/CNAME

cd static/
git init
git add .
git commit -S -m "deploy"
git push git@github.com:hotosm/osm-analytics.git master:gh-pages --force
rm -rf .git
cd ..
