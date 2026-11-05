import { CONCEPTS, type Concept } from '@jic/shared';
import {
  type CertificateContext,
  type CertificatePalette,
  CERTIFICATE_TEXT,
  drawCertificate,
  fitNameSize,
  formatCertificateDate,
} from './draw-certificate';

const palette: CertificatePalette = {
  paper: 'white',
  ink: 'ink',
  muted: 'muted',
  accent: 'accent',
  name: 'magenta',
  concepts: Object.fromEntries(CONCEPTS.map((c) => [c, `fill-${c}`])) as Record<Concept, string>,
};

/** A 2D context that records what is written, and measures text as 0.55 em per character. */
function fakeContext() {
  const texts: { text: string; font: string; color: string }[] = [];
  const fills: string[] = [];
  const noop = () => undefined;
  const ctx = {
    font: '',
    fillStyle: '' as CertificateContext['fillStyle'],
    strokeStyle: '' as CertificateContext['strokeStyle'],
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    letterSpacing: '0px',
    save: noop,
    restore: noop,
    translate: noop,
    scale: noop,
    beginPath: noop,
    roundRect: noop,
    arc: noop,
    moveTo: noop,
    lineTo: noop,
    quadraticCurveTo: noop,
    stroke: noop,
    fillRect: noop,
    setLineDash: noop,
    fill(this: { fillStyle: unknown }) {
      fills.push(String(this.fillStyle));
    },
    fillText(this: { font: string; fillStyle: unknown }, text: string) {
      texts.push({ text, font: this.font, color: String(this.fillStyle) });
    },
    measureText(this: { font: string }, text: string) {
      const px = Number(/(\d+)px/.exec(this.font)?.[1] ?? 10);
      return { width: text.length * px * 0.55 } as TextMetrics;
    },
  };
  return { ctx: ctx as unknown as CertificateContext, texts, fills };
}

const path = (d: string) => ({ d }) as unknown as Path2D;

describe('drawCertificate', () => {
  it('writes the title, the name in its color, the reason and the date', () => {
    const { ctx, texts } = fakeContext();
    drawCertificate(ctx, { name: 'Emma', date: 'November 5, 2026' }, palette, path);
    const written = texts.map((t) => t.text);
    expect(written).toEqual([
      CERTIFICATE_TEXT.brand,
      CERTIFICATE_TEXT.title,
      CERTIFICATE_TEXT.givenTo,
      'Emma',
      ...CERTIFICATE_TEXT.because,
      'November 5, 2026',
      CERTIFICATE_TEXT.dateLabel,
    ]);
    const name = texts.find((t) => t.text === 'Emma');
    expect(name?.color).toBe('magenta');
    expect(name?.font).toContain('140px');
  });

  it('leaves the name line blank when no name is typed', () => {
    const { ctx, texts } = fakeContext();
    drawCertificate(ctx, { name: '   ', date: 'today' }, palette, path);
    expect(texts.map((t) => t.text)).not.toContain('   ');
    expect(texts).toHaveLength(7); // everything but the name
  });

  it('fills every concept shape in its own color', () => {
    const { ctx, fills } = fakeContext();
    drawCertificate(ctx, { name: 'Emma', date: 'today' }, palette, path);
    for (const c of ['number', 'string', 'boolean', 'object', 'array', 'function', 'variable', 'html']) {
      expect(fills).toContain(`fill-${c}`);
    }
  });
});

describe('fitNameSize', () => {
  it('keeps short names big and shrinks long ones to fit the line', () => {
    const { ctx } = fakeContext();
    expect(fitNameSize(ctx, 'Emma')).toBe(140);
    const long = fitNameSize(ctx, 'Maximiliana Rosalind Lee');
    expect(long).toBeLessThan(140);
    expect(long * 0.55 * 'Maximiliana Rosalind Lee'.length).toBeLessThanOrEqual(1000);
  });
});

describe('formatCertificateDate', () => {
  it('writes the date out in words', () => {
    expect(formatCertificateDate(new Date(2026, 10, 5))).toBe('November 5, 2026');
  });
});
