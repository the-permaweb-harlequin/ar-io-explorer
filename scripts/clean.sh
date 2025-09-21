#!/bin/bash

# Clean macOS resource fork files, excluding node_modules for performance
find . -name '._*' -type f -not -path './node_modules/*' -delete && echo '🧹 Cleaned macOS resource fork files'
