#!/bin/bash
# Quick test script for the infographic service
# Usage: bash test.sh [image_path]

set -e

API_URL="${API_URL:-http://localhost:3000}"
OUTPUT_DIR="output"
mkdir -p "$OUTPUT_DIR"

IMAGE_PATH="${1:-}"

# If no image provided, create a simple test image using ImageMagick or use the TS test
if [ -z "$IMAGE_PATH" ]; then
  echo "No image path provided, running TypeScript test with generated image..."
  npx ts-node src/test.ts
  exit 0
fi

echo "Testing with image: $IMAGE_PATH"
echo "API: $API_URL"
echo ""

# Test fashion-model
echo "--- fashion-model ---"
curl -s -X POST "$API_URL/api/generate" \
  -F "image=@$IMAGE_PATH" \
  -F "template=fashion-model" \
  -F "title=БЕЛАЯ РУБАШКА" \
  -F "subtitle=Хлопок 100%" \
  -F 'features=[{"icon":"cotton","text":"Натуральный хлопок"},{"icon":"scissors","text":"Свободный крой"},{"icon":"wash","text":"Машинная стирка"}]' \
  -o "$OUTPUT_DIR/fashion-model-result.png" \
  -w "HTTP %{http_code} | %{size_download} bytes | %{time_total}s\n"

# Test product-features
echo "--- product-features ---"
curl -s -X POST "$API_URL/api/generate" \
  -F "image=@$IMAGE_PATH" \
  -F "template=product-features" \
  -F "title=ТОВАР ПРЕМИУМ" \
  -F "subtitle=Лучшее качество" \
  -F 'features=[{"icon":"safety","text":"Безопасно"},{"icon":"eco","text":"Экологично"},{"icon":"star","text":"Качество"},{"icon":"delivery","text":"Доставка"}]' \
  -F "accentColor=#c4956a" \
  -o "$OUTPUT_DIR/product-features-result.png" \
  -w "HTTP %{http_code} | %{size_download} bytes | %{time_total}s\n"

# Test minimal-clean
echo "--- minimal-clean ---"
curl -s -X POST "$API_URL/api/generate" \
  -F "image=@$IMAGE_PATH" \
  -F "template=minimal-clean" \
  -F "title=Кожаная сумка" \
  -F "subtitle=Премиум" \
  -F 'features=[{"icon":"star","text":"Качество"},{"icon":"eco","text":"Натуральная кожа"}]' \
  -o "$OUTPUT_DIR/minimal-clean-result.png" \
  -w "HTTP %{http_code} | %{size_download} bytes | %{time_total}s\n"

echo ""
echo "Results saved to $OUTPUT_DIR/"
ls -la "$OUTPUT_DIR/"*.png 2>/dev/null || echo "No output files found"
