#!/bin/zsh
set -x
git fetch origin && git checkout ${1:-origin/main} && npm install --no-save && npm run build && npm run preview