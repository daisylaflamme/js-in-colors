import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'jic-not-found-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <h1>We could not find that page</h1>
    <p>Maybe the jar is empty. Let's go back to the lessons.</p>
    <a routerLink="/">Go to the lessons</a>
  `,
  styles: `
    :host {
      display: grid;
      gap: var(--space-4);
      justify-items: start;
      padding: var(--space-7) var(--space-5);
    }
    a {
      display: inline-flex;
      align-items: center;
      min-block-size: var(--size-control);
      padding-inline: var(--space-6);
      border: var(--border-width) solid var(--color-border);
      border-radius: var(--radius-button);
      background: var(--color-accent);
      color: var(--color-accent-ink);
      font-weight: var(--font-weight-heavy);
      text-decoration: none;
    }
  `,
})
export class NotFoundPage {}
