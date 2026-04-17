import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

async function createTestImage(): Promise<Buffer> {
  const overlay = await sharp({
    create: { width: 300, height: 500, channels: 4, background: { r: 90, g: 120, b: 170, alpha: 255 } },
  }).png().toBuffer();

  return sharp({
    create: { width: 800, height: 600, channels: 3, background: { r: 200, g: 180, b: 160 } },
  })
    .composite([{ input: overlay, top: 50, left: 250 }])
    .jpeg({ quality: 90 })
    .toBuffer();
}

const exampleLayout = {
  canvas: {
    width: 900,
    height: 1200,
    background: '#f5eedb',
  },
  elements: [
    // Заголовок — большой прямоугольник сверху-слева
    {
      type: 'rect',
      x: 60,
      y: 100,
      width: 520,
      height: 200,
      color: 'rgba(220, 199, 170, 0.6)',
      label: 'title',
      zIndex: 2,
    },
    // Преимущество №1 — бейдж сверху
    {
      type: 'rect',
      x: 60,
      y: 40,
      width: 240,
      height: 45,
      color: '#dcc7aa',
      label: 'advantage-1',
      zIndex: 5,
    },
    // Преимущество №2 — бейдж снизу справа
    {
      type: 'rect',
      x: 620,
      y: 1080,
      width: 260,
      height: 45,
      color: '#dcc7aa',
      label: 'advantage-2',
      zIndex: 5,
    },
    // Изображение товара — справа
    {
      type: 'image',
      x: 300,
      y: 80,
      width: 580,
      height: 1040,
      zIndex: 3,
    },
    // 3 мелких блока внизу слева (характеристики)
    {
      type: 'rect',
      x: 60,
      y: 420,
      width: 220,
      height: 30,
      color: 'rgba(0, 0, 0, 0.08)',
      label: 'feature-1',
      zIndex: 2,
    },
    {
      type: 'rect',
      x: 60,
      y: 460,
      width: 200,
      height: 30,
      color: 'rgba(0, 0, 0, 0.08)',
      label: 'feature-2',
      zIndex: 2,
    },
    {
      type: 'rect',
      x: 60,
      y: 500,
      width: 180,
      height: 30,
      color: 'rgba(0, 0, 0, 0.08)',
      label: 'feature-3',
      zIndex: 2,
    },
  ],
};

async function main() {
  console.log(`Testing layout renderer at ${BASE_URL}\n`);

  // Health check
  try {
    const health = await fetch(`${BASE_URL}/health`);
    console.log('Health:', await health.json());
  } catch {
    console.error('Service not available. Start with: npm run dev');
    process.exit(1);
  }

  const testImage = await createTestImage();
  const outputDir = path.join(__dirname, '..', 'output');
  fs.mkdirSync(outputDir, { recursive: true });

  // Test 1: Render as PNG
  console.log('\n--- Test: Layout → PNG ---');
  const formData = new FormData();
  formData.append('image', new Blob([testImage], { type: 'image/jpeg' }), 'test.jpg');
  formData.append('layout', JSON.stringify(exampleLayout));

  const resp = await fetch(`${BASE_URL}/api/render-layout`, {
    method: 'POST',
    body: formData,
  });

  if (resp.ok) {
    const buf = Buffer.from(await resp.arrayBuffer());
    const outPath = path.join(outputDir, 'layout-test.png');
    fs.writeFileSync(outPath, buf);
    console.log(`Saved: ${outPath} (${buf.length} bytes)`);
  } else {
    console.error(`Error ${resp.status}:`, await resp.text());
  }

  // Test 2: Preview as HTML
  console.log('\n--- Test: Layout → HTML preview ---');
  const formData2 = new FormData();
  formData2.append('image', new Blob([testImage], { type: 'image/jpeg' }), 'test.jpg');
  formData2.append('layout', JSON.stringify(exampleLayout));
  formData2.append('mode', 'preview');

  const resp2 = await fetch(`${BASE_URL}/api/render-layout`, {
    method: 'POST',
    body: formData2,
  });

  if (resp2.ok) {
    const html = await resp2.text();
    const outPath = path.join(outputDir, 'layout-preview.html');
    fs.writeFileSync(outPath, html);
    console.log(`Saved: ${outPath} (${html.length} bytes)`);
  } else {
    console.error(`Error ${resp2.status}:`, await resp2.text());
  }

  console.log('\n=== Layout tests complete ===');
}

main();
