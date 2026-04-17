export interface LayoutElement {
  type: 'rect' | 'image' | 'text';
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  opacity?: number;
  borderRadius?: number;
  zIndex?: number;
  // text-specific
  text?: string;
  fontSize?: number;
  fontWeight?: number;
  fontFamily?: string;
  textColor?: string;
  letterSpacing?: number;
  lineHeight?: number;
  textTransform?: string;
  textAlign?: string;
  // label for debug overlay
  label?: string;
}

export interface LayoutCanvas {
  width: number;
  height: number;
  background?: string;
}

export interface LayoutInput {
  canvas: LayoutCanvas;
  elements: LayoutElement[];
}

export function buildLayoutHtml(
  layout: LayoutInput,
  imageBase64: string | null
): string {
  const { canvas, elements } = layout;

  const elementsDivs = elements.map((el, i) => {
    const zIndex = el.zIndex ?? (i + 1);
    const baseStyle = `position:absolute; left:${el.x}px; top:${el.y}px; width:${el.width}px; height:${el.height}px; z-index:${zIndex};`;

    switch (el.type) {
      case 'rect': {
        const color = el.color || '#cccccc';
        const opacity = el.opacity ?? 1;
        const radius = el.borderRadius ?? 0;
        const label = el.label || '';
        return `<div style="${baseStyle} background:${color}; opacity:${opacity}; border-radius:${radius}px;" title="${label}">
          ${label ? `<span style="position:absolute; top:4px; left:6px; font-size:11px; font-family:monospace; color:rgba(0,0,0,0.5); pointer-events:none;">${label}</span>` : ''}
        </div>`;
      }

      case 'image': {
        if (!imageBase64) return '';
        const radius = el.borderRadius ?? 0;
        return `<img src="${imageBase64}" style="${baseStyle} object-fit:cover; object-position:center; border-radius:${radius}px;" />`;
      }

      case 'text': {
        const color = el.textColor || el.color || '#000000';
        const fontSize = el.fontSize || 32;
        const fontWeight = el.fontWeight || 400;
        const fontFamily = el.fontFamily || "'DM Sans', sans-serif";
        const letterSpacing = el.letterSpacing != null ? `letter-spacing:${el.letterSpacing}px;` : '';
        const lineHeight = el.lineHeight != null ? `line-height:${el.lineHeight};` : 'line-height:0.98;';
        const textTransform = el.textTransform ? `text-transform:${el.textTransform};` : '';
        const textAlign = el.textAlign || 'left';
        return `<div style="${baseStyle} font-size:${fontSize}px; font-weight:${fontWeight}; font-family:${fontFamily}; color:${color}; ${letterSpacing} ${lineHeight} ${textTransform} text-align:${textAlign}; overflow:hidden; word-break:break-word;">${el.text || ''}</div>`;
      }

      default:
        return '';
    }
  });

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
html, body { width:${canvas.width}px; height:${canvas.height}px; overflow:hidden; }
.canvas { position:relative; width:${canvas.width}px; height:${canvas.height}px; background:${canvas.background || '#ffffff'}; overflow:hidden; }
</style>
</head>
<body>
<div class="canvas">
${elementsDivs.join('\n')}
</div>
</body></html>`;
}
