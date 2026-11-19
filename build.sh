#!/bin/sh
# Собирает index.html из модулей в src/ (models.js генерируется из Blender: tools/)
cd "$(dirname "$0")" && { sed '/^<script>$/q' src/head.html; [ -f src/models.js ] && cat src/models.js; cat src/1-engine.js src/2-world.js src/3-game.js src/4-puzzles.js src/5-story.js src/6-scenes.js; } > index.html && echo "index.html собран ($(wc -c < index.html) байт)"
