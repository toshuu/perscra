#!/bin/bash
export PUPPETEER_SKIP_DOWNLOAD=true
npm install puppeteer
npx --yes puppeteer browsers install chrome || true
