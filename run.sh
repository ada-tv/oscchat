#!/bin/sh

xdg-open ./index.html
echo "Running bridge"

./ws2osc.py
echo "Quitting"
