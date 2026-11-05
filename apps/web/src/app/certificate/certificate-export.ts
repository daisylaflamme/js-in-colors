import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { CONCEPTS, type Concept } from '@jic/shared';
import {
  BODY_FONT,
  CERTIFICATE_HEIGHT,
  CERTIFICATE_WIDTH,
  type CertificateData,
  type CertificatePalette,
  DISPLAY_FONT,
  drawCertificate,
} from './draw-certificate';

export const CERTIFICATE_FILE_NAME = 'javascript-in-colors-certificate.png';

/**
 * Turns the certificate into a PNG and saves it, all in the browser (ADR 0010): a canvas, a Blob,
 * an object URL and a download link. No request is made, and the name is not kept anywhere.
 */
@Injectable({ providedIn: 'root' })
export class CertificateExport {
  private readonly document = inject(DOCUMENT);

  /** Draws and downloads the PNG. Resolves false when the browser can't (no canvas). */
  async download(data: CertificateData): Promise<boolean> {
    const blob = await this.toPng(data);
    if (!blob) return false;
    const url = URL.createObjectURL(blob);
    try {
      const link = this.document.createElement('a');
      link.href = url;
      link.download = CERTIFICATE_FILE_NAME;
      link.hidden = true;
      this.document.body.append(link);
      link.click();
      link.remove();
    } finally {
      // Let the click start the download before the URL goes away.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    return true;
  }

  async toPng(data: CertificateData): Promise<Blob | null> {
    const canvas = this.document.createElement('canvas');
    canvas.width = CERTIFICATE_WIDTH;
    canvas.height = CERTIFICATE_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx || typeof Path2D === 'undefined') return null;
    await this.fontsReady();
    drawCertificate(ctx, data, this.palette(), (d) => new Path2D(d));
    return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
  }

  /** The canvas only uses a web font once it has loaded. */
  private async fontsReady(): Promise<void> {
    const fonts = this.document.fonts;
    if (!fonts) return;
    try {
      await Promise.all([
        fonts.load(`800 96px ${DISPLAY_FONT}`),
        fonts.load(`700 36px ${BODY_FONT}`),
        fonts.load(`800 36px ${BODY_FONT}`),
      ]);
    } catch {
      // Draw with the fallback font rather than not at all.
    }
  }

  /** Raw tokens (styles/settings/_tokens.scss): themes never override them, so the paper stays light. */
  private palette(): CertificatePalette {
    const style = getComputedStyle(this.document.documentElement);
    const token = (name: string) => style.getPropertyValue(`--color-${name}`).trim();
    const concepts = Object.fromEntries(CONCEPTS.map((c) => [c, token(c)])) as Record<Concept, string>;
    return {
      paper: token('surface'),
      ink: token('ink'),
      muted: token('muted'),
      accent: token('accent'),
      name: token('function'),
      concepts,
    };
  }
}
