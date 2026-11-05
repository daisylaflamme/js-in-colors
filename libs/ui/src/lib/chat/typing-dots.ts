import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Dot is thinking: three bouncing dots in a bubble (mockup 09). The words "Dot is typing" are
 * there for screen readers. Calm or reduced motion pauses the loop (the dots just sit there).
 */
@Component({
  selector: 'jic-typing-dots',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'jic-typing-dots' },
  template: `
    <span class="bubble">
      <span class="dot"></span><span class="dot"></span><span class="dot"></span>
      <span class="u-visually-hidden">Dot is typing</span>
    </span>
  `,
  styleUrl: './typing-dots.scss',
})
export class TypingDotsComponent {}
