import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import { TemplateData } from './types';

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

const templateCache = new Map<string, HandlebarsTemplateDelegate>();

Handlebars.registerHelper('eq', (a: any, b: any) => a === b);
Handlebars.registerHelper('gt', (a: number, b: number) => a > b);
Handlebars.registerHelper('add', (a: number, b: number) => a + b);
Handlebars.registerHelper('multiply', (a: number, b: number) => a * b);

export function getAvailableTemplates(): string[] {
  if (!fs.existsSync(TEMPLATES_DIR)) return [];
  return fs.readdirSync(TEMPLATES_DIR).filter((name) => {
    const templatePath = path.join(TEMPLATES_DIR, name, 'template.html');
    return fs.existsSync(templatePath);
  });
}

export function renderTemplate(templateName: string, data: TemplateData): string {
  const templatePath = path.join(TEMPLATES_DIR, templateName, 'template.html');

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template "${templateName}" not found at ${templatePath}`);
  }

  if (!templateCache.has(templateName)) {
    const source = fs.readFileSync(templatePath, 'utf-8');
    templateCache.set(templateName, Handlebars.compile(source));
  }

  const template = templateCache.get(templateName)!;
  const fontsDir = path.resolve(__dirname, '..', 'assets', 'fonts');
  const iconsDir = path.resolve(__dirname, '..', 'assets', 'icons');

  const iconMap: Record<string, string> = {};
  if (data.features) {
    for (const feature of data.features) {
      const iconPath = path.join(iconsDir, `${feature.icon}.svg`);
      if (fs.existsSync(iconPath)) {
        const svgContent = fs.readFileSync(iconPath, 'utf-8');
        const svgBase64 = Buffer.from(svgContent).toString('base64');
        iconMap[feature.icon] = `data:image/svg+xml;base64,${svgBase64}`;
      }
    }
  }

  const fontFaces = buildFontFaces(fontsDir);

  return template({
    ...data,
    fontFaces,
    iconMap,
    features: data.features.map((f) => ({
      ...f,
      iconSrc: iconMap[f.icon] || '',
    })),
  });
}

function buildFontFaces(fontsDir: string): string {
  const fonts: Array<{ family: string; weight: string; file: string }> = [
    { family: 'Montserrat', weight: '700', file: 'Montserrat-Bold.ttf' },
    { family: 'Montserrat', weight: '800', file: 'Montserrat-ExtraBold.ttf' },
    { family: 'Montserrat', weight: '900', file: 'Montserrat-Black.ttf' },
    { family: 'Roboto', weight: '400', file: 'Roboto-Regular.ttf' },
    { family: 'Roboto', weight: '500', file: 'Roboto-Medium.ttf' },
    { family: 'Roboto', weight: '700', file: 'Roboto-Bold.ttf' },
    { family: 'Playfair Display', weight: '700', file: 'PlayfairDisplay-Bold.ttf' },
    { family: 'Playfair Display', weight: '900', file: 'PlayfairDisplay-Black.ttf' },
  ];

  return fonts
    .filter((f) => fs.existsSync(path.join(fontsDir, f.file)))
    .map((f) => {
      const fontBuffer = fs.readFileSync(path.join(fontsDir, f.file));
      const base64 = fontBuffer.toString('base64');
      return `@font-face {
  font-family: '${f.family}';
  font-weight: ${f.weight};
  src: url('data:font/truetype;base64,${base64}') format('truetype');
}`;
    })
    .join('\n');
}

export function invalidateCache(templateName?: string) {
  if (templateName) {
    templateCache.delete(templateName);
  } else {
    templateCache.clear();
  }
}
