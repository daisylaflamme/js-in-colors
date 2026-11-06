import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CourseStore } from '@jic/data-access';
import { SHAPE_PATHS } from '@jic/shared';
import { AppLogoComponent, ConceptShapeComponent, IconComponent } from '@jic/ui';
import { DotCharacterComponent } from '@jic/visuals';
import { CertificateExport } from './certificate-export';
import { CERTIFICATE_CONCEPTS, CERTIFICATE_TEXT, formatCertificateDate } from './draw-certificate';

/** As long as a name can be (the input's maxlength): long enough for most names, short enough to fit. */
export const NAME_MAX_LENGTH = 24;

/**
 * The certificate (mockup 10, ADR 0010). Earned when every lesson is finished; before that the
 * page says how far the child is and offers to continue. The name lives only in a signal for this
 * visit: it is never stored or sent, not even to localStorage. Download makes a PNG on the device;
 * Print prints only the certificate.
 */
@Component({
  selector: 'jic-certificate-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, AppLogoComponent, ConceptShapeComponent, DotCharacterComponent, IconComponent],
  templateUrl: './certificate-page.html',
  styleUrl: './certificate-page.scss',
})
export class CertificatePage {
  protected readonly course = inject(CourseStore);
  private readonly export = inject(CertificateExport);
  private readonly window = inject(DOCUMENT).defaultView;

  protected readonly text = CERTIFICATE_TEXT;
  protected readonly concepts = CERTIFICATE_CONCEPTS;
  protected readonly starPath = SHAPE_PATHS.star;
  protected readonly maxLength = NAME_MAX_LENGTH;
  protected readonly date = formatCertificateDate(new Date());

  /**
   * False in the prerendered HTML and until the page has rendered in the browser (ADR 0014). The
   * build knows no child's progress, so it must not draw "not yet" for a child who has earned it.
   */
  protected readonly progressRead = signal(false);

  constructor() {
    if (isPlatformBrowser(inject(PLATFORM_ID))) afterNextRender(() => this.progressRead.set(true));
  }

  /** In memory only (ADR 0010). */
  protected readonly name = signal('');
  protected readonly status = signal('');
  protected readonly busy = signal(false);

  protected readonly total = computed(() => this.course.lessons().length);
  protected readonly nextLesson = computed(
    () => this.course.continueLesson() ?? this.course.lessons().find((l) => l.status === 'ready'),
  );
  /** Long names get smaller, so they stay on one line of the certificate. */
  protected readonly nameSize = computed(() => {
    const n = this.name().trim().length;
    return n <= 10 ? 'big' : n <= 16 ? 'medium' : 'small';
  });

  protected onNameInput(event: Event): void {
    if (event.target instanceof HTMLInputElement) this.name.set(event.target.value.slice(0, NAME_MAX_LENGTH));
  }

  protected async download(): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    this.status.set('');
    try {
      const saved = await this.export.download({ name: this.name(), date: this.date });
      this.status.set(
        saved ? 'Your certificate was saved.' : 'Sorry, this browser cannot save it. Try Print.',
      );
    } catch {
      this.status.set('Sorry, something went wrong. Try Print.');
    } finally {
      this.busy.set(false);
    }
  }

  protected print(): void {
    this.status.set('Print opened.');
    this.window?.print();
  }
}
