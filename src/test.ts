import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

async function createTestImage(): Promise<Buffer> {
  // Generate a simple test product image (colored rectangle with gradient)
  return sharp({
    create: {
      width: 800,
      height: 1000,
      channels: 3,
      background: { r: 240, g: 235, b: 228 },
    },
  })
    .composite([
      {
        input: await sharp({
          create: {
            width: 300,
            height: 500,
            channels: 4,
            background: { r: 90, g: 120, b: 160, alpha: 255 },
          },
        })
          .png()
          .toBuffer(),
        top: 250,
        left: 250,
      },
    ])
    .jpeg({ quality: 90 })
    .toBuffer();
}

async function testGenerate(
  template: string,
  title: string,
  subtitle: string,
  features: Array<{ icon: string; text: string }>,
  outputFile: string,
  accentColor?: string
) {
  console.log(`\n--- Testing template: ${template} ---`);
  const startTime = Date.now();

  const testImage = await createTestImage();

  const formData = new FormData();
  formData.append('image', new Blob([testImage], { type: 'image/jpeg' }), 'test.jpg');
  formData.append('template', template);
  formData.append('title', title);
  formData.append('subtitle', subtitle);
  formData.append('features', JSON.stringify(features));
  if (accentColor) {
    formData.append('accentColor', accentColor);
  }

  try {
    const response = await fetch(`${BASE_URL}/api/generate`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`Error ${response.status}: ${text}`);
      return;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const outputPath = path.join(__dirname, '..', 'output', outputFile);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, buffer);

    const elapsed = Date.now() - startTime;
    console.log(`Success! Saved to ${outputPath} (${buffer.length} bytes, ${elapsed}ms)`);
  } catch (err) {
    console.error(`Request failed:`, err);
  }
}

async function main() {
  console.log(`Testing infographic service at ${BASE_URL}\n`);

  // Check health
  try {
    const health = await fetch(`${BASE_URL}/health`);
    const data = await health.json();
    console.log('Health:', data);
  } catch {
    console.error('Service not available. Start the server first with: npm run dev');
    process.exit(1);
  }

  // Test fashion-model template
  await testGenerate(
    'fashion-model',
    'БЕЛАЯ РУБАШКА',
    'Хлопок 100%',
    [
      { icon: 'cotton', text: 'Натуральный хлопок' },
      { icon: 'scissors', text: 'Свободный крой' },
      { icon: 'wash', text: 'Машинная стирка' },
    ],
    'fashion-model-test.png',
    '#4a6741'
  );

  // Test product-features template
  await testGenerate(
    'product-features',
    'ЛОШАДКА-КАЧАЛКА',
    'Для детей от 1 года',
    [
      { icon: 'safety', text: 'Безопасные материалы' },
      { icon: 'eco', text: 'Экологичное дерево' },
      { icon: 'star', text: 'Ручная работа' },
      { icon: 'delivery', text: 'Быстрая доставка' },
    ],
    'product-features-test.png',
    '#c4956a'
  );

  // Test minimal-clean template
  await testGenerate(
    'minimal-clean',
    'Кожаная сумка',
    'Итальянская кожа премиум класса',
    [
      { icon: 'star', text: 'Премиум качество' },
      { icon: 'eco', text: 'Натуральная кожа' },
      { icon: 'delivery', text: 'Бесплатная доставка' },
    ],
    'minimal-clean-test.png'
  );

  console.log('\n=== All tests completed ===');
}

main();
