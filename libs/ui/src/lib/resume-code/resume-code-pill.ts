import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

export type CopyState = 'idle' | 'copied' | 'failed';

let nextId = 0;

/**
 * "Resume code blue-fox-42 [Copy]" (mockup 08). Presentational: the owner does the copying and
 * reports back through `copyState`. A polite status announces the result; if copying failed,
 * a visible hint asks the child to select the code (it selects in one tap).
 */
@Component({
  selector: 'jic-resume-code-pill',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'jic-resume-code-pill' },
  template: `
    <div class="pill" role="group" [attr.aria-labelledby]="labelId">
      <span class="label" [id]="labelId">Resume code</span>
      <code class="code">{{ code() }}</code>
      <button type="button" class="copy" aria-label="Copy resume code" (click)="copyRequested.emit()">
        <span aria-hidden="true">{{ copyState() === 'copied' ? 'Copied!' : 'Copy' }}</span>
      </button>
    </div>
    <p class="status" role="status">
      @if (message(); as text) {
        <span [class.u-visually-hidden]="copyState() === 'copied'">{{ text }}</span>
      }
    </p>
  `,
  styles: `
    :host {
      display: inline-grid;
      justify-items: start;
      gap: var(--space-1);
      max-inline-size: 100%;
    }
    .pill {
      display: inline-flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-2) var(--space-3);
      min-block-size: var(--size-control);
      padding: var(--space-1) var(--space-1) var(--space-1) var(--space-5);
      border: var(--border-width) solid var(--color-border);
      border-radius: var(--radius-button);
      background: var(--color-bg-raised);
    }
    .label {
      color: var(--color-text-muted);
      font-weight: var(--font-weight-bold);
    }
    .code {
      font-family: var(--font-code);
      font-size: 1.0625rem;
      font-weight: var(--font-weight-bold);
      user-select: all;
    }
    .copy {
      min-block-size: var(--size-touch);
      padding-inline: var(--space-4);
      border: 0;
      border-radius: var(--radius-button);
      background: var(--color-accent);
      color: var(--color-accent-ink);
      font: inherit;
      font-weight: var(--font-weight-heavy);
      cursor: pointer;
    }
    .copy:focus-visible {
      outline: var(--focus-ring-width) solid var(--color-focus);
      outline-offset: var(--focus-ring-offset);
    }
    .status {
      margin: 0;
      padding-inline-start: var(--space-5);
      font-size: var(--text-small);
      font-weight: var(--font-weight-bold);
    }
    .status:empty {
      display: none;
    }
  `,
})
export class ResumeCodePillComponent {
  readonly code = input.required<string>();
  readonly copyState = input<CopyState>('idle');
  readonly copyRequested = output<void>();

  protected readonly labelId = `jic-resume-code-${nextId++}`;
  protected readonly message = computed(() => {
    switch (this.copyState()) {
      case 'copied':
        return 'Copied!';
      case 'failed':
        return 'Copy did not work. Tap the code to select it.';
      default:
        return '';
    }
  });
}
