#!/bin/sh
# Собирает index.html из модулей в src/
cd "$(dirname "$0")" && cat src/head.html src/1-engine.js src/2-world.js src/3-game.js src/4-puzzles.js src/5-scenes.js > index.html && echo "index.html собран"
