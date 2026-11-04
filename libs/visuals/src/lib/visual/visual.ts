import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { Visual } from '@jic/shared';
import { DotCharacterComponent } from '../dot/dot-character';
import { JarVisualComponent } from '../jar/jar-visual';
import { MachineVisualComponent } from '../machine/machine-visual';
import { ScreenVisualComponent } from '../screen/screen-visual';

/** Renders a lesson Visual by kind. Adding a kind = one component + one case here + the type. */
@Component({
  selector: 'jic-visual',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DotCharacterComponent, JarVisualComponent, MachineVisualComponent, ScreenVisualComponent],
  host: { style: 'display: contents' },
  template: `
    @let v = visual();
    @switch (v.kind) {
      @case ('jar') {
        <jic-jar-visual
          [name]="v.name"
          [value]="v.value"
          [concept]="v.concept ?? 'number'"
          [replayKey]="replayKey()"
        />
      }
      @case ('screen') {
        <jic-screen-visual [lines]="v.lines" [replayKey]="replayKey()" />
      }
      @case ('dot') {
        <jic-dot-character class="big-dot" />
      }
      @case ('machine') {
        <jic-machine-visual
          [name]="v.name"
          [input]="v.input"
          [output]="v.output"
          [concept]="v.concept ?? 'number'"
          [replayKey]="replayKey()"
        />
      }
    }
  `,
  styles: `
    .big-dot {
      inline-size: clamp(7rem, 30cqi, 12rem);
    }
  `,
})
export class VisualComponent {
  readonly visual = input.required<Visual>();
  readonly replayKey = input(0);
}
