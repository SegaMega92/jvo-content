import sharp from 'sharp';
import { ProcessedImage, TimingLog } from './types';

let removeBackground: any = null;

async function loadBackgroundRemoval() {
  if (!removeBackground) {
    const mod = await import('@imgly/background-removal-node');
    removeBackground = mod.removeBackground;
  }
  return removeBackground;
}

export async function processImage(
  imageBuffer: Buffer,
  timings: TimingLog[],
  skipBackgroundRemoval: boolean = false
): Promise<ProcessedImage> {
  const colorStart = Date.now();
  const { dominantColor, palette } = await extractColors(imageBuffer);
  timings.push({ step: 'color_extraction', durationMs: Date.now() - colorStart });

  let cutout: Buffer | null = null;

  if (!skipBackgroundRemoval) {
    const bgStart = Date.now();
    try {
      cutout = await removeBackgroundFromImage(imageBuffer);
      timings.push({ step: 'background_removal', durationMs: Date.now() - bgStart });
    } catch (err) {
      timings.push({ step: 'background_removal_failed', durationMs: Date.now() - bgStart });
      console.error('Background removal failed, proceeding without cutout:', err);
    }
  } else {
    timings.push({ step: 'background_removal_skipped', durationMs: 0 });
  }

  return {
    original: imageBuffer,
    cutout,
    dominantColor,
    palette,
  };
}

async function removeBackgroundFromImage(imageBuffer: Buffer): Promise<Buffer> {
  const removeBg = await loadBackgroundRemoval();
  const blob = new Blob([imageBuffer], { type: 'image/png' });
  const resultBlob: Blob = await removeBg(blob, {
    output: { format: 'image/png', quality: 0.9 },
  });
  const arrayBuffer = await resultBlob.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function extractColors(imageBuffer: Buffer): Promise<{
  dominantColor: string;
  palette: string[];
}> {
  const { dominant, channels } = await sharp(imageBuffer)
    .resize(64, 64, { fit: 'cover' })
    .raw()
    .toBuffer({ resolveWithObject: true })
    .then(({ data, info }) => {
      const pixels: Array<[number, number, number]> = [];
      for (let i = 0; i < data.length; i += info.channels) {
        pixels.push([data[i], data[i + 1], data[i + 2]]);
      }

      const buckets = new Map<string, { r: number; g: number; b: number; count: number }>();

      for (const [r, g, b] of pixels) {
        const qr = Math.round(r / 32) * 32;
        const qg = Math.round(g / 32) * 32;
        const qb = Math.round(b / 32) * 32;
        const key = `${qr},${qg},${qb}`;

        if (buckets.has(key)) {
          const bucket = buckets.get(key)!;
          bucket.r += r;
          bucket.g += g;
          bucket.b += b;
          bucket.count += 1;
        } else {
          buckets.set(key, { r, g, b, count: 1 });
        }
      }

      const sorted = [...buckets.values()].sort((a, b) => b.count - a.count);
      const top = sorted.slice(0, 5);

      const dominant = top[0];
      const avgDominant = {
        r: Math.round(dominant.r / dominant.count),
        g: Math.round(dominant.g / dominant.count),
        b: Math.round(dominant.b / dominant.count),
      };

      const channels = top.map((c) => ({
        r: Math.round(c.r / c.count),
        g: Math.round(c.g / c.count),
        b: Math.round(c.b / c.count),
      }));

      return { dominant: avgDominant, channels };
    });

  const toHex = (c: { r: number; g: number; b: number }) =>
    '#' + [c.r, c.g, c.b].map((v) => v.toString(16).padStart(2, '0')).join('');

  return {
    dominantColor: toHex(dominant),
    palette: channels.map(toHex),
  };
}
