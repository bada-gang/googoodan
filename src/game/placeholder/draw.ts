/**
 * placeholder 아트용 Canvas 2D 드로잉 프리미티브.
 *
 * ⚠ 이 폴더의 모든 그림은 임시(placeholder) 에셋이다. (명세 64, 75-7)
 *    Phase 7 아트 패스에서 public/assets/ 의 실제 아트로 교체된다.
 *
 * 모든 도형은 ART_DIRECTION.md 의 규칙을 따른다.
 *  - 광원은 왼쪽 위, 그림자는 오른쪽 아래
 *  - 외곽선 굵기는 3단계만 사용
 *  - 명암은 2~3단계
 */
import { OUTLINE, PALETTE } from '@/config/artTokens';

export type Ctx = CanvasRenderingContext2D;

export interface Sheet {
  canvas: HTMLCanvasElement;
  ctx: Ctx;
  frameWidth: number;
  frameHeight: number;
  frames: number;
}

export function makeSheet(frameWidth: number, frameHeight: number, frames = 1): Sheet {
  const canvas = document.createElement('canvas');
  canvas.width = frameWidth * frames;
  canvas.height = frameHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D 컨텍스트를 만들 수 없습니다.');
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  return { canvas, ctx, frameWidth, frameHeight, frames };
}

/** 여러 프레임 시트에서 한 프레임만 잘라낸 새 시트를 만든다. (아이콘용) */
export function cropFrame(sheet: Sheet, index: number): Sheet {
  const cropped = makeSheet(sheet.frameWidth, sheet.frameHeight, 1);
  cropped.ctx.drawImage(
    sheet.canvas,
    index * sheet.frameWidth,
    0,
    sheet.frameWidth,
    sheet.frameHeight,
    0,
    0,
    sheet.frameWidth,
    sheet.frameHeight,
  );
  return cropped;
}

/** 프레임 하나를 원점 기준으로 그린다. */
export function frame(sheet: Sheet, index: number, render: (ctx: Ctx) => void): void {
  const { ctx, frameWidth } = sheet;
  ctx.save();
  ctx.translate(index * frameWidth, 0);
  render(ctx);
  ctx.restore();
}

/* ------------------------------- 색상 유틸 ------------------------------- */

function clamp(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function parseHex(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function toHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => clamp(v).toString(16).padStart(2, '0')).join('')}`;
}

export function lighten(hex: string, amount = 0.18): string {
  const [r, g, b] = parseHex(hex);
  return toHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount);
}

export function darken(hex: string, amount = 0.18): string {
  const [r, g, b] = parseHex(hex);
  return toHex(r * (1 - amount), g * (1 - amount), b * (1 - amount));
}

export function alpha(hex: string, a: number): string {
  const [r, g, b] = parseHex(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/* -------------------------------- 도형 ---------------------------------- */

export function roundRectPath(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export function ellipsePath(ctx: Ctx, cx: number, cy: number, rx: number, ry: number): void {
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.closePath();
}

export interface PaintOptions {
  fill?: string | CanvasGradient;
  stroke?: string;
  lineWidth?: number;
}

export function paint(ctx: Ctx, options: PaintOptions = {}): void {
  const { fill, stroke = PALETTE.outline, lineWidth = OUTLINE.base } = options;
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke && lineWidth > 0) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

export function roundRect(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  options: PaintOptions = {},
): void {
  roundRectPath(ctx, x, y, w, h, r);
  paint(ctx, options);
}

export function ellipse(
  ctx: Ctx,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  options: PaintOptions = {},
): void {
  ellipsePath(ctx, cx, cy, rx, ry);
  paint(ctx, options);
}

export function circle(ctx: Ctx, cx: number, cy: number, r: number, options: PaintOptions = {}): void {
  ellipse(ctx, cx, cy, r, r, options);
}

/** 오브젝트 아래 접지 그림자. 광원이 왼쪽 위이므로 살짝 오른쪽으로 민다. (명세 50) */
export function groundShadow(ctx: Ctx, cx: number, cy: number, rx: number, ry = rx * 0.28): void {
  ellipse(ctx, cx + rx * 0.08, cy, rx, ry, { fill: PALETTE.shadow, lineWidth: 0 });
}

/** 위쪽 하이라이트: 도형 위에 얹는 밝은 띠 */
export function topLight(
  ctx: Ctx,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  color: string,
  a = 0.5,
): void {
  ctx.save();
  ctx.globalAlpha = a;
  ellipse(ctx, cx, cy, rx, ry, { fill: color, lineWidth: 0 });
  ctx.restore();
}

/** 오른쪽 아래 그늘 */
export function shadeSide(ctx: Ctx, render: (ctx: Ctx) => void, color: string, a = 0.35): void {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = color;
  render(ctx);
  ctx.restore();
}

export function verticalGradient(
  ctx: Ctx,
  x: number,
  y0: number,
  y1: number,
  from: string,
  to: string,
): CanvasGradient {
  const gradient = ctx.createLinearGradient(x, y0, x, y1);
  gradient.addColorStop(0, from);
  gradient.addColorStop(1, to);
  return gradient;
}

/* ------------------------------- 표정 부품 ------------------------------- */

/** 큰 표정. 작은 화면에서도 보이도록 눈/입/볼을 명확히. (명세 42) */
export function face(
  ctx: Ctx,
  cx: number,
  cy: number,
  options: {
    eyeGap?: number;
    eyeR?: number;
    blink?: boolean;
    smile?: number;
    cheek?: boolean;
    cheekColor?: string;
    look?: number;
  } = {},
): void {
  const {
    eyeGap = 18,
    eyeR = 5,
    blink = false,
    smile = 6,
    cheek = true,
    cheekColor = PALETTE.accentPink,
    look = 0,
  } = options;

  if (cheek) {
    ctx.save();
    ctx.globalAlpha = 0.55;
    ellipse(ctx, cx - eyeGap - 8, cy + 9, 7, 4.5, { fill: cheekColor, lineWidth: 0 });
    ellipse(ctx, cx + eyeGap + 8, cy + 9, 7, 4.5, { fill: cheekColor, lineWidth: 0 });
    ctx.restore();
  }

  ctx.fillStyle = PALETTE.outline;
  if (blink) {
    ctx.lineWidth = 3;
    ctx.strokeStyle = PALETTE.outline;
    for (const sign of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx + sign * eyeGap - eyeR, cy);
      ctx.quadraticCurveTo(cx + sign * eyeGap, cy + 3, cx + sign * eyeGap + eyeR, cy);
      ctx.stroke();
    }
  } else {
    for (const sign of [-1, 1]) {
      ellipse(ctx, cx + sign * eyeGap + look, cy, eyeR, eyeR * 1.15, {
        fill: PALETTE.outline,
        lineWidth: 0,
      });
      ellipse(ctx, cx + sign * eyeGap + look - eyeR * 0.3, cy - eyeR * 0.4, eyeR * 0.32, eyeR * 0.32, {
        fill: '#ffffff',
        lineWidth: 0,
      });
    }
  }

  if (smile > 0) {
    ctx.strokeStyle = PALETTE.outline;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - smile, cy + 13);
    ctx.quadraticCurveTo(cx, cy + 13 + smile, cx + smile, cy + 13);
    ctx.stroke();
  }
}

/* -------------------------------- 반복 무늬 ------------------------------- */

/** 잔디 낱장 */
export function grassBlade(ctx: Ctx, x: number, y: number, h: number, color: string): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + h * 0.2, y - h * 0.6, x + h * 0.35, y - h);
  ctx.stroke();
}

/** 작은 별 (파티클/보상용) */
export function star(ctx: Ctx, cx: number, cy: number, r: number, color: string): void {
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 === 0 ? r : r * 0.42;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  paint(ctx, { fill: color, stroke: darken(color, 0.35), lineWidth: OUTLINE.thin });
}

/** 나뭇잎 한 장 */
export function leaf(ctx: Ctx, cx: number, cy: number, r: number, color: string, angle = 0): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(-r, 0);
  ctx.quadraticCurveTo(0, -r * 0.85, r, 0);
  ctx.quadraticCurveTo(0, r * 0.85, -r, 0);
  ctx.closePath();
  paint(ctx, { fill: color, stroke: darken(color, 0.3), lineWidth: OUTLINE.thin });
  ctx.restore();
}

/**
 * 겹친 원 여러 개를 하나의 덩어리로 칠한다. (나무 잎, 양 털, 구름)
 *
 * 퍼프마다 따로 채우고 그늘을 주면 겹친 원의 경계가 그대로 드러나
 * "도형을 붙여 놓은 것"처럼 보인다. 그래서
 *   ① 외곽선 있는 원 → ② 안쪽 외곽선 덮기 → ③ 합집합 안에서 명암 한 번
 * 순서로 그린다. 광원은 왼쪽 위. (ART_DIRECTION 4)
 */
export function puffMass(
  ctx: Ctx,
  puffs: [number, number, number][],
  base: string,
  outlineWidth: number = OUTLINE.base,
  contrast = 0.28,
): void {
  if (puffs.length === 0) return;

  for (const [x, y, r] of puffs) circle(ctx, x, y, r, { fill: base, lineWidth: outlineWidth });
  for (const [x, y, r] of puffs) {
    circle(ctx, x, y, r - outlineWidth / 2, { fill: base, lineWidth: 0 });
  }

  const minX = Math.min(...puffs.map(([x, , r]) => x - r));
  const maxX = Math.max(...puffs.map(([x, , r]) => x + r));
  const minY = Math.min(...puffs.map(([, y, r]) => y - r));
  const maxY = Math.max(...puffs.map(([, y, r]) => y + r));
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const radius = Math.max(maxX - minX, maxY - minY) / 2;

  ctx.save();
  ctx.beginPath();
  for (const [x, y, r] of puffs) {
    ctx.moveTo(x + r, y);
    ctx.arc(x, y, r - outlineWidth / 2, 0, Math.PI * 2);
  }
  ctx.clip();

  const shading = ctx.createRadialGradient(
    cx - radius * 0.38,
    cy - radius * 0.48,
    radius * 0.08,
    cx,
    cy,
    radius * 1.18,
  );
  shading.addColorStop(0, lighten(base, contrast * 1.15));
  shading.addColorStop(0.42, base);
  shading.addColorStop(1, darken(base, contrast));
  ctx.fillStyle = shading;
  ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
  ctx.restore();
}
