/**
 * placeholder 가구·장식 아트. (임시 에셋)
 * 작은 썸네일에서도 형태가 구별되도록 실제 비율보다 크고 단순하게 그린다. (명세 51)
 */
import { OUTLINE, PALETTE } from '@/config/artTokens';
import type { FurnitureDef, FurnitureShape } from '@/config/catalog';
import {
  circle,
  darken,
  ellipse,
  frame,
  groundShadow,
  leaf,
  lighten,
  makeSheet,
  paint,
  roundRect,
  star,
  type Ctx,
  type Sheet,
} from './draw';

interface ShapeArgs {
  ctx: Ctx;
  w: number;
  h: number;
  tint: string;
  /** 같은 모양이라도 세트마다 무늬가 다르다 (별빛 세트의 별 무늬 등) */
  theme: FurnitureDef['theme'];
}

/** 별빛 세트 표시용 작은 별들. (cx, cy) 기준 상대 좌표로 뿌린다. */
function starSprinkle(
  ctx: Ctx,
  spots: [number, number, number][],
  color: string = PALETTE.star,
): void {
  for (const [x, y, r] of spots) star(ctx, x, y, r, color);
}

/** 오른쪽 아래에 그늘을 얹는 헬퍼 */
function shade(ctx: Ctx, x: number, y: number, w: number, h: number, r: number, color: string): void {
  ctx.save();
  ctx.globalAlpha = 0.35;
  roundRect(ctx, x, y, w, h, r, { fill: color, lineWidth: 0 });
  ctx.restore();
}

const PAINTERS: Record<FurnitureShape, (args: ShapeArgs) => void> = {
  bed: ({ ctx, w, h, tint, theme }) => {
    const base = h - 10;
    groundShadow(ctx, w / 2, base + 6, w * 0.46, 10);
    roundRect(ctx, 10, base - 44, w - 20, 40, 12, { fill: tint, lineWidth: OUTLINE.bold });
    shade(ctx, w * 0.55, base - 42, w * 0.42, 36, 10, darken(tint, 0.3));
    // 머리판
    roundRect(ctx, 6, base - 96, 34, 92, 12, { fill: darken(tint, 0.1), lineWidth: OUTLINE.bold });
    // 이불
    roundRect(ctx, 40, base - 62, w - 56, 26, 12, {
      fill: PALETTE.accentPink,
      lineWidth: OUTLINE.base,
    });
    roundRect(ctx, 48, base - 68, w - 76, 16, 8, {
      fill: lighten(PALETTE.accentPink, 0.28),
      lineWidth: OUTLINE.thin,
    });
    // 베개
    roundRect(ctx, 44, base - 84, 54, 26, 12, { fill: PALETTE.cream, lineWidth: OUTLINE.base });
    // 다리
    roundRect(ctx, 16, base - 6, 14, 16, 5, { fill: darken(tint, 0.25), lineWidth: OUTLINE.thin });
    roundRect(ctx, w - 32, base - 6, 14, 16, 5, { fill: darken(tint, 0.25), lineWidth: OUTLINE.thin });

    if (theme === 'starlight') {
      // 머리판의 큰 별 하나 + 이불 위에 작은 별들
      star(ctx, 23, base - 62, 11, PALETTE.star);
      starSprinkle(ctx, [
        [66, base - 52, 6],
        [96, base - 60, 4.5],
        [124, base - 50, 5.5],
        [154, base - 58, 4],
        [178, base - 51, 5],
      ]);
    }
  },

  desk: ({ ctx, w, h, tint }) => {
    const base = h - 8;
    groundShadow(ctx, w / 2, base + 4, w * 0.44, 9);
    roundRect(ctx, 4, 28, w - 8, 22, 9, { fill: lighten(tint, 0.12), lineWidth: OUTLINE.bold });
    shade(ctx, w * 0.5, 34, w * 0.48, 14, 7, darken(tint, 0.3));
    roundRect(ctx, 14, 50, 20, base - 50, 6, { fill: tint, lineWidth: OUTLINE.base });
    roundRect(ctx, w - 62, 50, 52, base - 50, 8, { fill: tint, lineWidth: OUTLINE.base });
    roundRect(ctx, w - 54, 60, 36, 18, 5, { fill: darken(tint, 0.18), lineWidth: OUTLINE.thin });
    roundRect(ctx, w - 54, 84, 36, 18, 5, { fill: darken(tint, 0.18), lineWidth: OUTLINE.thin });
  },

  chair: ({ ctx, w, h, tint }) => {
    const base = h - 8;
    groundShadow(ctx, w / 2, base + 4, w * 0.42, 8);
    roundRect(ctx, 12, 8, w - 24, 46, 12, { fill: tint, lineWidth: OUTLINE.bold });
    roundRect(ctx, 22, 18, w - 44, 26, 8, { fill: darken(tint, 0.14), lineWidth: 0 });
    roundRect(ctx, 6, 52, w - 12, 18, 8, { fill: lighten(tint, 0.14), lineWidth: OUTLINE.bold });
    roundRect(ctx, 14, 68, 12, base - 68, 5, { fill: darken(tint, 0.2), lineWidth: OUTLINE.thin });
    roundRect(ctx, w - 26, 68, 12, base - 68, 5, { fill: darken(tint, 0.2), lineWidth: OUTLINE.thin });
  },

  sofa: ({ ctx, w, h, tint }) => {
    const base = h - 10;
    groundShadow(ctx, w / 2, base + 6, w * 0.46, 10);
    roundRect(ctx, 8, 22, w - 16, 46, 16, { fill: tint, lineWidth: OUTLINE.bold });
    roundRect(ctx, 0, 44, 34, 52, 14, { fill: lighten(tint, 0.1), lineWidth: OUTLINE.bold });
    roundRect(ctx, w - 34, 44, 34, 52, 14, { fill: darken(tint, 0.12), lineWidth: OUTLINE.bold });
    roundRect(ctx, 26, 58, w - 52, 34, 12, { fill: lighten(tint, 0.2), lineWidth: OUTLINE.base });
    shade(ctx, w * 0.55, 60, w * 0.35, 30, 10, darken(tint, 0.28));
    // 다리는 몸체 아래에 붙어 있어야 한다. 떼어 놓으면 소파가 떠 보인다.
    for (const lx of [20, w - 36]) {
      roundRect(ctx, lx, 90, 16, base - 88, 5, {
        fill: PALETTE.woodDark,
        lineWidth: OUTLINE.thin,
      });
    }
  },

  bookshelf: ({ ctx, w, h, tint }) => {
    const base = h - 8;
    groundShadow(ctx, w / 2, base + 4, w * 0.44, 9);
    roundRect(ctx, 4, 6, w - 8, base - 6, 12, { fill: tint, lineWidth: OUTLINE.bold });
    shade(ctx, w * 0.6, 12, w * 0.36, base - 20, 8, darken(tint, 0.32));
    const shelfColors = [PALETTE.apple, PALETTE.accentBlue, PALETTE.gold, PALETTE.accentMint];
    for (let row = 0; row < 3; row += 1) {
      const y = 22 + row * ((base - 40) / 3);
      roundRect(ctx, 12, y, w - 24, (base - 40) / 3 - 10, 6, {
        fill: darken(tint, 0.22),
        lineWidth: OUTLINE.thin,
      });
      // 폭과 높이가 같은 막대를 늘어놓으면 책이 아니라 색 띠로 보인다.
      const shelfH = (base - 40) / 3 - 22;
      let bx = 17;
      for (let b = 0; b < 5 && bx < w - 30; b += 1) {
        const wobble = ((row * 7 + b * 13) % 5) / 5; // 0 ~ 0.8
        const bw = 12 + wobble * 9;
        const bh = shelfH * (0.78 + wobble * 0.22);
        const color = shelfColors[(row * 2 + b) % shelfColors.length];
        roundRect(ctx, bx, y + 6 + (shelfH - bh), bw, bh, 3, {
          fill: color,
          lineWidth: OUTLINE.thin,
        });
        // 책등 선
        ctx.strokeStyle = darken(color, 0.35);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(bx + bw * 0.5, y + 10 + (shelfH - bh));
        ctx.lineTo(bx + bw * 0.5, y + 2 + shelfH);
        ctx.stroke();
        bx += bw + 3;
      }
    }
  },

  table: ({ ctx, w, h, tint }) => {
    const base = h - 8;
    groundShadow(ctx, w / 2, base + 4, w * 0.42, 9);
    ellipse(ctx, w / 2, 34, w / 2 - 6, 22, { fill: lighten(tint, 0.14), lineWidth: OUTLINE.bold });
    ctx.save();
    ctx.globalAlpha = 0.3;
    ellipse(ctx, w / 2 + 12, 40, w / 2 - 22, 14, { fill: darken(tint, 0.3), lineWidth: 0 });
    ctx.restore();
    roundRect(ctx, w / 2 - 12, 48, 24, base - 56, 8, { fill: tint, lineWidth: OUTLINE.base });
    ellipse(ctx, w / 2, base - 4, 36, 12, { fill: darken(tint, 0.15), lineWidth: OUTLINE.base });
  },

  lamp: ({ ctx, w, h, tint, theme }) => {
    const base = h - 8;
    groundShadow(ctx, w / 2, base + 4, w * 0.4, 8);
    ctx.strokeStyle = PALETTE.outline;
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(w / 2, base - 10);
    ctx.lineTo(w / 2, 62);
    ctx.stroke();
    ctx.strokeStyle = PALETTE.woodDark;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(w / 2, base - 10);
    ctx.lineTo(w / 2, 62);
    ctx.stroke();
    ellipse(ctx, w / 2, base - 6, 30, 11, { fill: PALETTE.woodDark, lineWidth: OUTLINE.base });
    ctx.beginPath();
    ctx.moveTo(w / 2 - 34, 62);
    ctx.lineTo(w / 2 - 22, 14);
    ctx.lineTo(w / 2 + 22, 14);
    ctx.lineTo(w / 2 + 34, 62);
    ctx.closePath();
    paint(ctx, { fill: tint, lineWidth: OUTLINE.bold });
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = lighten(tint, 0.4);
    ctx.beginPath();
    ctx.moveTo(w / 2 - 30, 58);
    ctx.lineTo(w / 2 - 20, 18);
    ctx.lineTo(w / 2 - 6, 18);
    ctx.lineTo(w / 2 - 14, 58);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ellipse(ctx, w / 2, 62, 34, 8, { fill: PALETTE.star, lineWidth: OUTLINE.thin });

    if (theme === 'starlight') {
      // 갓에 뚫린 별 무늬 — 불빛이 새어 나오는 느낌
      starSprinkle(
        ctx,
        [
          [w / 2 - 8, 30, 7],
          [w / 2 + 12, 42, 5.5],
          [w / 2 - 16, 50, 5],
        ],
        lighten(PALETTE.star, 0.35),
      );
      // 기둥 꼭대기에 별 장식
      star(ctx, w / 2, 8, 9, PALETTE.star);
    }
  },

  drawer: ({ ctx, w, h, tint }) => {
    const base = h - 8;
    groundShadow(ctx, w / 2, base + 4, w * 0.44, 9);
    roundRect(ctx, 6, 14, w - 12, base - 14, 12, { fill: tint, lineWidth: OUTLINE.bold });
    shade(ctx, w * 0.6, 20, w * 0.36, base - 32, 8, darken(tint, 0.3));
    for (let i = 0; i < 3; i += 1) {
      const y = 26 + i * ((base - 40) / 3);
      roundRect(ctx, 16, y, w - 32, (base - 40) / 3 - 8, 7, {
        fill: lighten(tint, 0.12),
        lineWidth: OUTLINE.base,
      });
      roundRect(ctx, w / 2 - 12, y + 8, 24, 7, 4, { fill: PALETTE.gold, lineWidth: OUTLINE.thin });
    }
  },

  plant: ({ ctx, w, h, tint }) => {
    const base = h - 8;
    groundShadow(ctx, w / 2, base + 4, w * 0.4, 8);
    ctx.beginPath();
    ctx.moveTo(w / 2 - 30, base - 52);
    ctx.lineTo(w / 2 + 30, base - 52);
    ctx.lineTo(w / 2 + 22, base - 2);
    ctx.lineTo(w / 2 - 22, base - 2);
    ctx.closePath();
    paint(ctx, { fill: '#d98d63', lineWidth: OUTLINE.bold });
    roundRect(ctx, w / 2 - 34, base - 62, 68, 16, 7, { fill: '#e8a077', lineWidth: OUTLINE.base });
    ctx.strokeStyle = PALETTE.leafShade;
    ctx.lineWidth = 5;
    for (const dx of [-1, 0, 1]) {
      ctx.beginPath();
      ctx.moveTo(w / 2, base - 62);
      ctx.quadraticCurveTo(w / 2 + dx * 18, base - 90, w / 2 + dx * 26, base - 112);
      ctx.stroke();
    }
    leaf(ctx, w / 2 - 26, base - 112, 22, tint, -0.5);
    leaf(ctx, w / 2 + 26, base - 112, 22, lighten(tint, 0.15), 0.5);
    leaf(ctx, w / 2, base - 126, 24, tint, 0);
  },

  frame: ({ ctx, w, h, tint }) => {
    roundRect(ctx, 4, 4, w - 8, h - 8, 10, { fill: tint, lineWidth: OUTLINE.bold });
    roundRect(ctx, 16, 16, w - 32, h - 32, 6, { fill: PALETTE.skyBottom, lineWidth: OUTLINE.thin });
    ctx.save();
    roundRect(ctx, 16, 16, w - 32, h - 32, 6, {});
    ctx.clip();
    ctx.fillStyle = PALETTE.farHill;
    ctx.beginPath();
    ctx.moveTo(16, h - 16);
    ctx.quadraticCurveTo(w / 2, h * 0.36, w - 16, h - 16);
    ctx.closePath();
    ctx.fill();
    circle(ctx, w - 34, 34, 9, { fill: PALETTE.gold, lineWidth: 0 });
    ctx.restore();
  },

  doll: ({ ctx, w, h, tint }) => {
    const base = h - 6;
    groundShadow(ctx, w / 2, base + 2, w * 0.36, 6);
    ellipse(ctx, w / 2 - 12, 22, 7, 17, { fill: tint, lineWidth: OUTLINE.base });
    ellipse(ctx, w / 2 + 12, 20, 7, 17, { fill: tint, lineWidth: OUTLINE.base });
    ellipse(ctx, w / 2, base - 22, 24, 22, { fill: tint, lineWidth: OUTLINE.bold });
    circle(ctx, w / 2, 46, 21, { fill: lighten(tint, 0.14), lineWidth: OUTLINE.bold });
    circle(ctx, w / 2 - 7, 44, 3.4, { fill: PALETTE.outline, lineWidth: 0 });
    circle(ctx, w / 2 + 7, 44, 3.4, { fill: PALETTE.outline, lineWidth: 0 });
    ctx.strokeStyle = PALETTE.outline;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 4, 53);
    ctx.quadraticCurveTo(w / 2, 57, w / 2 + 4, 53);
    ctx.stroke();
  },

  clock: ({ ctx, w, h, tint, theme }) => {
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) / 2 - 4;
    circle(ctx, cx, cy, r, { fill: tint, lineWidth: OUTLINE.bold });

    // "알록달록 시계"는 색이 하나면 이름값을 못 한다. 테두리를 네 조각으로 나눠 칠한다.
    const colorful = theme === 'colorful';
    if (colorful) {
      const rim = [PALETTE.gold, PALETTE.accentPink, PALETTE.accentMint, tint];
      rim.forEach((color, i) => {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, (i * Math.PI) / 2 - Math.PI / 2, ((i + 1) * Math.PI) / 2 - Math.PI / 2);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
      });
      circle(ctx, cx, cy, r, { lineWidth: OUTLINE.bold });
    }

    circle(ctx, cx, cy, r - 10, { fill: PALETTE.cream, lineWidth: OUTLINE.thin });

    if (colorful) {
      // 12·3·6·9 자리 눈금도 색으로
      const marks = [PALETTE.accentPink, PALETTE.accentBlue, PALETTE.gold, PALETTE.accentMint];
      marks.forEach((color, i) => {
        const angle = (i * Math.PI) / 2 - Math.PI / 2;
        circle(ctx, cx + Math.cos(angle) * (r - 17), cy + Math.sin(angle) * (r - 17), 3.5, {
          fill: color,
          lineWidth: 0,
        });
      });
    }

    ctx.strokeStyle = PALETTE.outline;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy - 18);
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + 14, cy + 6);
    ctx.stroke();
    circle(ctx, cx, cy, 4, { fill: PALETTE.outline, lineWidth: 0 });
  },

  carpet: ({ ctx, w, h, tint, theme }) => {
    if (theme === 'colorful') {
      // 색 하나로는 "포근한 카펫"과 구분이 안 된다. 고리마다 다른 색을 쓴다.
      const rings = [tint, PALETTE.gold, PALETTE.accentPink, PALETTE.accentBlue];
      rings.forEach((color, i) => {
        ellipse(ctx, w / 2, h / 2, w / 2 - 6 - i * 17, h / 2 - 6 - i * 5, {
          fill: color,
          lineWidth: i === 0 ? OUTLINE.bold : OUTLINE.thin,
        });
      });
      return;
    }

    ellipse(ctx, w / 2, h / 2, w / 2 - 6, h / 2 - 6, { fill: tint, lineWidth: OUTLINE.bold });
    ellipse(ctx, w / 2, h / 2, w / 2 - 20, h / 2 - 14, {
      fill: lighten(tint, 0.22),
      lineWidth: OUTLINE.thin,
    });
    ellipse(ctx, w / 2, h / 2, w / 2 - 40, h / 2 - 22, {
      fill: darken(tint, 0.12),
      lineWidth: OUTLINE.thin,
    });
  },

  cushion: ({ ctx, w, h, tint }) => {
    groundShadow(ctx, w / 2, h - 6, w * 0.4, 6);
    roundRect(ctx, 6, 8, w - 12, h - 20, 20, { fill: tint, lineWidth: OUTLINE.bold });
    shade(ctx, w * 0.52, 14, w * 0.42, h - 32, 16, darken(tint, 0.28));
    circle(ctx, w / 2, h / 2 - 4, 5, { fill: darken(tint, 0.3), lineWidth: OUTLINE.thin });
  },

  fence: ({ ctx, w, h, tint }) => {
    groundShadow(ctx, w / 2, h - 6, w * 0.44, 7);
    for (const x of [16, w - 30]) {
      ctx.beginPath();
      ctx.moveTo(x, h - 8);
      ctx.lineTo(x, 22);
      ctx.lineTo(x + 7, 12);
      ctx.lineTo(x + 14, 22);
      ctx.lineTo(x + 14, h - 8);
      ctx.closePath();
      paint(ctx, { fill: tint, lineWidth: OUTLINE.base });
    }
    for (const y of [38, 62]) {
      roundRect(ctx, 4, y, w - 8, 13, 6, { fill: lighten(tint, 0.14), lineWidth: OUTLINE.base });
    }
  },

  bench: ({ ctx, w, h, tint }) => {
    const base = h - 8;
    groundShadow(ctx, w / 2, base + 4, w * 0.44, 9);
    for (let i = 0; i < 3; i += 1) {
      roundRect(ctx, 8, 14 + i * 13, w - 16, 10, 5, {
        fill: i % 2 ? lighten(tint, 0.12) : tint,
        lineWidth: OUTLINE.base,
      });
    }
    roundRect(ctx, 6, 56, w - 12, 14, 7, { fill: lighten(tint, 0.18), lineWidth: OUTLINE.bold });
    roundRect(ctx, 16, 70, 14, base - 70, 5, { fill: darken(tint, 0.2), lineWidth: OUTLINE.thin });
    roundRect(ctx, w - 30, 70, 14, base - 70, 5, { fill: darken(tint, 0.2), lineWidth: OUTLINE.thin });
  },

  flower: ({ ctx, w, h, tint }) => {
    const base = h - 6;
    groundShadow(ctx, w / 2, base + 2, w * 0.42, 7);
    ellipse(ctx, w / 2, base - 6, w / 2 - 8, 14, { fill: PALETTE.soil, lineWidth: OUTLINE.base });
    const colors = [tint, PALETTE.gold, '#ffffff'];
    [22, 55, 86].forEach((x, i) => {
      ctx.strokeStyle = PALETTE.leafShade;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x, base - 10);
      ctx.lineTo(x, 30 + i * 5);
      ctx.stroke();
      for (let p = 0; p < 5; p += 1) {
        const angle = (p / 5) * Math.PI * 2;
        circle(ctx, x + Math.cos(angle) * 8, 30 + i * 5 + Math.sin(angle) * 8, 6.5, {
          fill: colors[i % colors.length],
          lineWidth: OUTLINE.thin,
        });
      }
      circle(ctx, x, 30 + i * 5, 5, { fill: PALETTE.gold, lineWidth: OUTLINE.thin });
    });
  },

  streetlamp: ({ ctx, w, h, tint }) => {
    const base = h - 8;
    groundShadow(ctx, w / 2, base + 4, w * 0.4, 8);
    ellipse(ctx, w / 2, base - 4, 26, 10, { fill: darken(tint, 0.2), lineWidth: OUTLINE.base });
    roundRect(ctx, w / 2 - 8, 60, 16, base - 64, 7, { fill: tint, lineWidth: OUTLINE.bold });
    roundRect(ctx, w / 2 - 26, 22, 52, 44, 12, { fill: PALETTE.star, lineWidth: OUTLINE.bold });
    ctx.save();
    ctx.globalAlpha = 0.45;
    roundRect(ctx, w / 2 - 18, 28, 16, 30, 8, { fill: '#ffffff', lineWidth: 0 });
    ctx.restore();
    roundRect(ctx, w / 2 - 30, 10, 60, 16, 8, { fill: tint, lineWidth: OUTLINE.base });
  },

  stonepath: ({ ctx, h, tint }) => {
    // 같은 타원 네 개를 늘어놓으면 알약처럼 보인다. 크기와 자리를 흔들고 접지를 준다.
    for (let i = 0; i < 4; i += 1) {
      const wobble = ((i * 37) % 7) / 7; // 0 ~ 0.86
      const cx = 22 + i * 32 + (wobble - 0.4) * 4;
      const cy = h / 2 + (i % 2 === 0 ? -4 : 4);
      const rx = 13 + wobble * 5;
      const ry = 9 + wobble * 3;
      groundShadow(ctx, cx, cy + ry * 0.8, rx * 0.95, ry * 0.4);
      ellipse(ctx, cx, cy, rx, ry, { fill: tint, lineWidth: OUTLINE.base });
      ctx.save();
      ctx.globalAlpha = 0.4;
      ellipse(ctx, cx + rx * 0.25, cy + ry * 0.3, rx * 0.6, ry * 0.55, {
        fill: darken(tint, 0.3),
        lineWidth: 0,
      });
      ctx.globalAlpha = 0.5;
      ellipse(ctx, cx - rx * 0.3, cy - ry * 0.35, rx * 0.4, ry * 0.3, {
        fill: lighten(tint, 0.3),
        lineWidth: 0,
      });
      ctx.restore();
    }
  },

  fountain: ({ ctx, w, h, tint }) => {
    const base = h - 8;
    groundShadow(ctx, w / 2, base + 4, w * 0.46, 12);
    ellipse(ctx, w / 2, base - 18, w / 2 - 6, 30, { fill: '#cfc6b4', lineWidth: OUTLINE.bold });
    ellipse(ctx, w / 2, base - 24, w / 2 - 22, 22, { fill: tint, lineWidth: OUTLINE.base });
    ctx.save();
    ctx.globalAlpha = 0.5;
    ellipse(ctx, w / 2 - 16, base - 30, 22, 8, { fill: '#ffffff', lineWidth: 0 });
    ctx.restore();
    roundRect(ctx, w / 2 - 12, base - 78, 24, 54, 8, { fill: '#cfc6b4', lineWidth: OUTLINE.base });
    ellipse(ctx, w / 2, base - 82, 30, 12, { fill: '#ded6c6', lineWidth: OUTLINE.base });
    for (const dir of [-1, 1]) {
      ctx.strokeStyle = lighten(tint, 0.3);
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(w / 2, base - 90);
      ctx.quadraticCurveTo(w / 2 + dir * 26, base - 78, w / 2 + dir * 30, base - 40);
      ctx.stroke();
    }
    star(ctx, w / 2, base - 100, 10, PALETTE.star);
  },
};

export function buildFurnitureIcon(def: FurnitureDef): Sheet {
  const sheet = makeSheet(def.width, def.height, 1);
  frame(sheet, 0, (ctx) =>
    PAINTERS[def.shape]({ ctx, w: def.width, h: def.height, tint: def.tint, theme: def.theme }),
  );
  return sheet;
}
