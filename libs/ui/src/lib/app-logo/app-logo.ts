import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Three overlapping dots + "JavaScript in Colors".
 * With `link`, the whole logo is a link (to Home, the color path); its name ends in ", home".
 */
@Component({
  selector: 'jic-app-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, RouterLink],
  host: { class: 'jic-app-logo', '[class.stacked]': 'stacked()' },
  template: `
    <ng-template #logo>
      <svg class="mark" viewBox="0 0 40 40" aria-hidden="true" focusable="false">
        <circle cx="13" cy="14" r="10" fill="var(--color-number)" />
        <circle cx="26" cy="13" r="10" fill="var(--color-function)" />
        <circle cx="19" cy="25" r="10" fill="var(--color-accent)" />
      </svg>
      <span class="name">JavaScript <span class="line">in Colors</span></span>
    </ng-template>
    @if (link(); as to) {
      <a class="logo" [routerLink]="to">
        <ng-container [ngTemplateOutlet]="logo" /><span class="u-visually-hidden">, home</span>
      </a>
    } @else {
      <span class="logo"><ng-container [ngTemplateOutlet]="logo" /></span>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      color: var(--color-text);
      font-family: var(--font-display);
      font-size: 1.25rem;
      font-weight: var(--font-weight-bold);
      line-height: 1.05;
    }
    .logo {
      display: inline-flex;
      align-items: center;
      gap: var(--space-3);
      color: inherit;
      text-decoration: none;
    }
    a.logo {
      min-block-size: var(--size-touch);
      border-radius: var(--radius-nav-item);
    }
    a.logo:focus-visible {
      outline: var(--focus-ring-width) solid var(--color-focus);
      outline-offset: var(--focus-ring-offset);
    }
    .mark {
      flex: none;
      inline-size: 2.25rem;
      block-size: 2.25rem;
    }
    :host(.stacked) {
      font-size: 1.5rem;
    }
    :host(.stacked) .line {
      display: block;
    }
  `,
})
export class AppLogoComponent {
  /** Two lines ("JavaScript / in Colors"), as at the top of the lesson menu. */
  readonly stacked = input(false);
  /** Makes the logo a link, e.g. '/' for Home. */
  readonly link = input<string>();
}
