import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * One chat message (mockup 09). Dot's bubbles sit on the left in a soft box; the child's sit on
 * the right in number blue with white text (5.5:1). Extra content (a lesson link) goes in the slot.
 * The sender is said in words for screen readers, not only by side or color.
 */
@Component({
  selector: 'jic-chat-bubble',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'jic-chat-bubble', '[attr.data-from]': 'from()' },
  template: `
    <div class="bubble">
      <span class="u-visually-hidden">{{ from() === 'dot' ? 'Dot:' : 'You:' }} </span>
      <p class="text">{{ text() }}</p>
      <ng-content />
    </div>
  `,
  styles: `
    :host {
      display: flex;
    }
    :host([data-from='kid']) {
      justify-content: flex-end;
    }
    .bubble {
      display: grid;
      gap: var(--space-3);
      max-inline-size: min(36rem, 88%);
      padding: var(--space-3) var(--space-4);
      border: var(--border-width) solid var(--color-border-soft);
      border-radius: var(--radius-card);
      background: var(--color-bg);
      color: var(--color-text);
      font-size: 1.125rem;
      font-weight: var(--font-weight-bold);
      line-height: 1.45;
    }
    :host([data-from='kid']) .bubble {
      border-color: var(--color-number);
      background: var(--color-number);
      color: var(--color-number-on);
    }
    .text {
      margin: 0;
      overflow-wrap: anywhere;
      white-space: pre-wrap;
    }
    .text:empty {
      display: none;
    }
  `,
})
export class ChatBubbleComponent {
  readonly from = input.required<'dot' | 'kid'>();
  readonly text = input('');
}
