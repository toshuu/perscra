#!/bin/bash
npx --yes puppeteer browsers install chrome || true
chmod -R 755 /opt/render/.cache/puppeteer
