import { CONCEPT_INFO, type Concept, SHAPE_PATHS, WIDE_SHAPES, WINDOW_PAGE_PATH } from '@jic/shared';

/** The PNG is A4 landscape in shape, big enough to print sharp. */
export const CERTIFICATE_WIDTH = 1600;
export const CERTIFICATE_HEIGHT = 1131;

/** The concepts along the top of the certificate, in course order. */
export const CERTIFICATE_CONCEPTS: readonly Concept[] = [
  'number',
  'string',
  'boolean',
  'object',
  'array',
  'function',
  'variable',
  'html',
];

export const CERTIFICATE_TEXT = {
  brand: 'JAVASCRIPT IN COLORS',
  title: 'Certificate of Discovery',
  givenTo: 'This certificate is given to',
  because: [
    'for exploring jars, machines, loops, and more, and for',
    'finishing all 10 lessons with a very bright mind.',
  ],
  dateLabel: 'Date',
} as const;

/** Colors for the "paper" version. Read from the raw design tokens, which no theme changes. */
export interface CertificatePalette {
  readonly paper: string;
  readonly ink: string;
  readonly muted: string;
  readonly accent: string;
  readonly name: string;
  readonly concepts: Readonly<Record<Concept, string>>;
}

export interface CertificateData {
  /** As typed. Empty leaves the name line blank (to write on by hand). */
  readonly name: string;
  /** Already formatted, e.g. "November 5, 2026". */
  readonly date: string;
}

/** The 2D context calls the drawing needs (a real CanvasRenderingContext2D fits). */
export type CertificateContext = Pick<
  CanvasRenderingContext2D,
  | 'save'
  | 'restore'
  | 'translate'
  | 'scale'
  | 'beginPath'
  | 'roundRect'
  | 'arc'
  | 'moveTo'
  | 'lineTo'
  | 'quadraticCurveTo'
  | 'fill'
  | 'stroke'
  | 'fillRect'
  | 'fillText'
  | 'measureText'
  | 'setLineDash'
  | 'fillStyle'
  | 'strokeStyle'
  | 'lineWidth'
  | 'lineCap'
  | 'lineJoin'
  | 'font'
  | 'textAlign'
  | 'textBaseline'
  | 'letterSpacing'
>;

/** Makes a Path2D from SVG path data (injected: test DOMs have no Path2D). */
export type PathFactory = (d: string) => Path2D;

const CX = CERTIFICATE_WIDTH / 2;
const NAME_MAX_WIDTH = 1000;
const NAME_MAX_PX = 140;
const NAME_MIN_PX = 56;

export const DISPLAY_FONT = "'Baloo 2'";
export const BODY_FONT = "'Nunito'";

/** Today's date as the certificate shows it, e.g. "November 5, 2026". */
export function formatCertificateDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(date);
}

/** The biggest name size (px) that fits the line. */
export function fitNameSize(ctx: Pick<CertificateContext, 'font' | 'measureText'>, name: string): number {
  let px = NAME_MAX_PX;
  for (; px > NAME_MIN_PX; px -= 4) {
    ctx.font = `800 ${px}px ${DISPLAY_FONT}`;
    if (ctx.measureText(name).width <= NAME_MAX_WIDTH) break;
  }
  return px;
}

/**
 * Draws the certificate (mockup 10) for the PNG download. The page shows the same certificate as
 * HTML; this is the "paper" version, always in the light palette. Nothing here leaves the device.
 */
export function drawCertificate(
  ctx: CertificateContext,
  data: CertificateData,
  palette: CertificatePalette,
  path: PathFactory,
): void {
  ctx.save();
  ctx.fillStyle = palette.paper;
  ctx.fillRect(0, 0, CERTIFICATE_WIDTH, CERTIFICATE_HEIGHT);

  // Frame: thick ink border, then a dashed accent line inside it.
  ctx.strokeStyle = palette.ink;
  ctx.lineWidth = 20;
  ctx.beginPath();
  ctx.roundRect(24, 24, CERTIFICATE_WIDTH - 48, CERTIFICATE_HEIGHT - 48, 40);
  ctx.stroke();
  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = 6;
  ctx.setLineDash([18, 12]);
  ctx.beginPath();
  ctx.roundRect(60, 60, CERTIFICATE_WIDTH - 120, CERTIFICATE_HEIGHT - 120, 28);
  ctx.stroke();
  ctx.setLineDash([]);

  drawShapes(ctx, palette, path);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  text(ctx, CERTIFICATE_TEXT.brand, 250, `800 30px ${BODY_FONT}`, palette.muted, '8px');
  text(ctx, CERTIFICATE_TEXT.title, 350, `800 96px ${DISPLAY_FONT}`, palette.ink);
  text(ctx, CERTIFICATE_TEXT.givenTo, 430, `700 36px ${BODY_FONT}`, palette.muted);

  const name = data.name.trim();
  if (name) text(ctx, name, 570, `800 ${fitNameSize(ctx, name)}px ${DISPLAY_FONT}`, palette.name);
  line(ctx, CX - 300, 605, CX + 300, 605, palette.accent, 10);

  CERTIFICATE_TEXT.because.forEach((l, i) =>
    text(ctx, l, 690 + i * 52, `700 36px ${BODY_FONT}`, palette.ink),
  );

  text(ctx, data.date, 960, `800 40px ${BODY_FONT}`, palette.ink);
  line(ctx, CX - 170, 980, CX + 170, 980, palette.ink, 4);
  text(ctx, CERTIFICATE_TEXT.dateLabel, 1020, `700 26px ${BODY_FONT}`, palette.muted);

  drawDot(ctx, palette, 140, 830, 1.6);
  drawSeal(ctx, palette, path, CERTIFICATE_WIDTH - 250, 930);
  ctx.restore();
}

function text(
  ctx: CertificateContext,
  value: string,
  y: number,
  font: string,
  color: string,
  spacing = '0px',
): void {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.letterSpacing = spacing;
  ctx.fillText(value, CX, y);
  ctx.letterSpacing = '0px';
}

function line(
  ctx: CertificateContext,
  x1: number,
  y: number,
  x2: number,
  y2: number,
  color: string,
  w: number,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.lineCap = 'butt';
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

/** The concept shapes in a row, each in its color (the star stays outlined, as on screen). */
function drawShapes(ctx: CertificateContext, palette: CertificatePalette, path: PathFactory): void {
  const scale = 56 / 24;
  const widths = CERTIFICATE_CONCEPTS.map(
    (c) => (WIDE_SHAPES.includes(CONCEPT_INFO[c].shape) ? 32 : 24) * scale,
  );
  const gap = 24;
  let x = CX - (widths.reduce((a, b) => a + b, 0) + gap * (widths.length - 1)) / 2;
  CERTIFICATE_CONCEPTS.forEach((concept, i) => {
    const shape = CONCEPT_INFO[concept].shape;
    ctx.save();
    ctx.translate(x, 120);
    ctx.scale(scale, scale);
    ctx.fillStyle = palette.concepts[concept];
    ctx.fill(path(SHAPE_PATHS[shape]));
    if (shape === 'window') {
      ctx.fillStyle = palette.paper;
      ctx.fill(path(WINDOW_PAGE_PATH));
    }
    ctx.restore();
    x += widths[i] + gap;
  });
}

/** The star seal: an ink ring around a yellow disc with an ink star. */
function drawSeal(
  ctx: CertificateContext,
  palette: CertificatePalette,
  path: PathFactory,
  x: number,
  y: number,
) {
  ctx.strokeStyle = palette.ink;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(x, y, 110, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = palette.accent;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(x, y, 88, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.save();
  ctx.translate(x - 48, y - 48);
  ctx.scale(4, 4);
  ctx.fillStyle = palette.ink;
  ctx.fill(path(SHAPE_PATHS.star));
  ctx.restore();
}

/**
 * Dot, drawn like the placeholder DotCharacterComponent (libs/visuals, viewBox 120 x 130).
 * Keep the two in step until the real Dot artwork replaces both.
 */
function drawDot(ctx: CertificateContext, palette: CertificatePalette, x: number, y: number, s: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = palette.ink;
  ctx.lineCap = 'round';
  const circle = (cx: number, cy: number, r: number, fill: string, stroke = 0) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.lineWidth = stroke;
      ctx.stroke();
    }
  };
  const curve = (x1: number, y1: number, qx: number, qy: number, x2: number, y2: number) => {
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(qx, qy, x2, y2);
    ctx.stroke();
  };
  curve(60, 30, 58, 14, 70, 10);
  circle(72, 9, 6, palette.concepts.function, 5);
  circle(60, 78, 46, palette.accent, 5);
  circle(44, 72, 9, palette.paper, 3);
  circle(76, 72, 9, palette.paper, 3);
  circle(46, 73, 4, palette.ink);
  circle(78, 73, 4, palette.ink);
  curve(46, 94, 60, 104, 74, 94);
  circle(28, 60, 4.5, palette.concepts.number);
  circle(94, 58, 4, palette.concepts.function);
  circle(98, 88, 4.5, palette.concepts.boolean);
  circle(22, 92, 4, palette.concepts.string);
  ctx.restore();
}
