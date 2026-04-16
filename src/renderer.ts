import { chromium, Browser, BrowserContext } from 'playwright';
import { TimingLog } from './types';

let browser: Browser | null = null;

export async function initBrowser(): Promise<void> {
  if (!browser) {
    browser = await chromium.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });
    console.log('Playwright browser launched');
  }
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

export async function renderHtmlToImage(
  html: string,
  width: number,
  height: number,
  timings: TimingLog[]
): Promise<Buffer> {
  if (!browser) {
    await initBrowser();
  }

  const renderStart = Date.now();

  const context: BrowserContext = await browser!.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();

  try {
    await page.setContent(html, { waitUntil: 'networkidle' });

    // Wait for fonts to load
    // Wait for fonts to load in browser context
    await page.evaluate('document.fonts.ready');

    // Small delay for rendering to settle
    await page.waitForTimeout(200);

    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: false,
      clip: { x: 0, y: 0, width, height },
    });

    timings.push({ step: 'html_rendering', durationMs: Date.now() - renderStart });

    return Buffer.from(screenshot);
  } finally {
    await context.close();
  }
}
