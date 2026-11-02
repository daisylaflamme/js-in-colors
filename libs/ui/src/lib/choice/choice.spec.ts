import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ChoiceButtonComponent } from './choice-button';
import { ChoiceRowComponent } from './choice-row';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ChoiceRowComponent, ChoiceButtonComponent],
  template: `
    <jic-choice-row label="Pick something for the jar:">
      <button
        type="button"
        jic-choice-button
        concept="number"
        [pressed]="picked() === 'n'"
        (click)="picked.set('n')"
      >
        7
      </button>
      <button
        type="button"
        jic-choice-button
        concept="string"
        [pressed]="picked() === 's'"
        (click)="picked.set('s')"
      >
        Emma
      </button>
      <button jicChoiceRowEnd type="button">Peek</button>
    </jic-choice-row>
  `,
})
class HostComponent {
  readonly picked = signal('n');
}

describe('ChoiceRow + ChoiceButton', () => {
  async function setup() {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    return { fixture, el, buttons: el.querySelectorAll<HTMLButtonElement>('button[jic-choice-button]') };
  }

  it('is a labelled group of native buttons', async () => {
    const { el, buttons } = await setup();
    const group = el.querySelector('[role="group"]');
    const labelId = group?.getAttribute('aria-labelledby') ?? '';
    expect(el.querySelector(`#${labelId}`)?.textContent).toBe('Pick something for the jar:');
    expect(buttons[0].type).toBe('button');
  });

  it('reflects the selected choice with aria-pressed', async () => {
    const { fixture, buttons } = await setup();
    expect(buttons[0].getAttribute('aria-pressed')).toBe('true');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('false');

    buttons[1].click();
    await fixture.whenStable();

    expect(buttons[0].getAttribute('aria-pressed')).toBe('false');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
  });

  it('pairs every choice with its shape (never color alone)', async () => {
    const { buttons } = await setup();
    expect(buttons[0].querySelector('jic-concept-shape')?.getAttribute('data-shape')).toBe('circle');
    expect(buttons[1].querySelector('jic-concept-shape')?.getAttribute('data-shape')).toBe('pill');
  });

  it('projects the end slot', async () => {
    const { el } = await setup();
    expect(el.querySelector('.end button')?.textContent).toBe('Peek');
  });
});
