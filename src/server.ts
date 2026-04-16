import express from 'express';
import path from 'path';
import multer from 'multer';
import { processImage } from './imageProcessor';
import { renderTemplate, getAvailableTemplates } from './templateEngine';
import { renderHtmlToImage, initBrowser, closeBrowser } from './renderer';
import { Feature, GenerateRequest, TemplateData, TimingLog } from './types';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '..', 'public')));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are supported'));
    }
  },
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', templates: getAvailableTemplates() });
});

app.get('/api/templates', (_req, res) => {
  res.json({ templates: getAvailableTemplates() });
});

app.post('/api/generate', upload.single('image'), async (req, res) => {
  const totalStart = Date.now();
  const timings: TimingLog[] = [];

  try {
    if (!req.file) {
      res.status(400).json({ error: 'No image file provided' });
      return;
    }

    const template = req.body.template;
    if (!template) {
      res.status(400).json({ error: 'Template name is required' });
      return;
    }

    const available = getAvailableTemplates();
    if (!available.includes(template)) {
      res.status(400).json({
        error: `Template "${template}" not found. Available: ${available.join(', ')}`,
      });
      return;
    }

    const title = req.body.title || '';
    const subtitle = req.body.subtitle || '';
    let features: Feature[] = [];
    try {
      features = req.body.features ? JSON.parse(req.body.features) : [];
    } catch {
      res.status(400).json({ error: 'Invalid features JSON' });
      return;
    }

    const outputWidth = 900;
    const outputHeight = 1200;
    const removeBg = req.body.removeBg !== 'false' && req.body.removeBg !== '0';

    console.log(`\n=== Generating infographic ===`);
    console.log(`Template: ${template}`);
    console.log(`Title: ${title}`);
    console.log(`Output: ${outputWidth}x${outputHeight}`);
    console.log(`Background removal: ${removeBg}`);

    // Process the image (background removal + color extraction)
    const processed = await processImage(req.file.buffer, timings, !removeBg);

    const accentColor = req.body.accentColor || processed.dominantColor;
    const secondaryColor = processed.palette[1] || adjustColor(accentColor, 30);
    const textColor = isLightColor(accentColor) ? '#1a1a1a' : '#ffffff';

    // Prepare template data
    const templateData: TemplateData = {
      title,
      subtitle,
      features,
      accentColor,
      secondaryColor,
      textColor,
      cutoutBase64: processed.cutout
        ? `data:image/png;base64,${processed.cutout.toString('base64')}`
        : null,
      originalBase64: `data:image/${req.file.mimetype.split('/')[1]};base64,${processed.original.toString('base64')}`,
      outputWidth,
      outputHeight,
    };

    // Render template
    const html = renderTemplate(template, templateData);

    // Render to image
    const imageBuffer = await renderHtmlToImage(html, outputWidth, outputHeight, timings);

    timings.push({ step: 'total', durationMs: Date.now() - totalStart });
    console.log('Timings:', timings.map((t) => `${t.step}: ${t.durationMs}ms`).join(', '));

    res.set('Content-Type', 'image/png');
    res.set('X-Processing-Time', String(Date.now() - totalStart));
    res.send(imageBuffer);
  } catch (err: any) {
    console.error('Generation error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}

function adjustColor(hex: string, amount: number): string {
  const r = Math.min(255, Math.max(0, parseInt(hex.slice(1, 3), 16) + amount));
  const g = Math.min(255, Math.max(0, parseInt(hex.slice(3, 5), 16) + amount));
  const b = Math.min(255, Math.max(0, parseInt(hex.slice(5, 7), 16) + amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

async function main() {
  await initBrowser();
  app.listen(PORT, () => {
    console.log(`Infographic service running on port ${PORT}`);
    console.log(`Available templates: ${getAvailableTemplates().join(', ')}`);
  });
}

process.on('SIGTERM', async () => {
  console.log('Shutting down...');
  await closeBrowser();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Shutting down...');
  await closeBrowser();
  process.exit(0);
});

main().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
