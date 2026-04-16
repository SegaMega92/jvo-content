#!/bin/bash
# Download Google Fonts for local use
# Run this once: bash scripts/download-fonts.sh

set -e

FONTS_DIR="$(dirname "$0")/../assets/fonts"
mkdir -p "$FONTS_DIR"

echo "Downloading Montserrat..."
curl -sL -o "$FONTS_DIR/Montserrat-Bold.ttf" \
  "https://github.com/JulietaUla/Montserrat/raw/master/fonts/ttf/Montserrat-Bold.ttf"
curl -sL -o "$FONTS_DIR/Montserrat-ExtraBold.ttf" \
  "https://github.com/JulietaUla/Montserrat/raw/master/fonts/ttf/Montserrat-ExtraBold.ttf"
curl -sL -o "$FONTS_DIR/Montserrat-Black.ttf" \
  "https://github.com/JulietaUla/Montserrat/raw/master/fonts/ttf/Montserrat-Black.ttf"

echo "Downloading Roboto..."
curl -sL -o "$FONTS_DIR/Roboto-Regular.ttf" \
  "https://github.com/googlefonts/roboto/raw/main/src/hinted/Roboto-Regular.ttf"
curl -sL -o "$FONTS_DIR/Roboto-Medium.ttf" \
  "https://github.com/googlefonts/roboto/raw/main/src/hinted/Roboto-Medium.ttf"
curl -sL -o "$FONTS_DIR/Roboto-Bold.ttf" \
  "https://github.com/googlefonts/roboto/raw/main/src/hinted/Roboto-Bold.ttf"

echo "Downloading Playfair Display..."
curl -sL -o "$FONTS_DIR/PlayfairDisplay-Bold.ttf" \
  "https://github.com/clauseggers/Playfair-Display/raw/master/fonts/PlayfairDisplay-Bold.ttf"
curl -sL -o "$FONTS_DIR/PlayfairDisplay-Black.ttf" \
  "https://github.com/clauseggers/Playfair-Display/raw/master/fonts/PlayfairDisplay-Black.ttf"

echo "Fonts downloaded to $FONTS_DIR"
ls -la "$FONTS_DIR"
