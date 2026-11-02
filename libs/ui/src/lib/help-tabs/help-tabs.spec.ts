import { TestBed } from '@angular/core/testing';
import { HelpTabsComponent } from './help-tabs';

describe('HelpTabsComponent', () => {
  async function setup(inputs: Record<string, unknown> = {}) {
    const fixture = TestBed.createComponent(HelpTabsComponent);
    for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const tab = (name: string) => el.querySelector<HTMLButtonElement>(`button.${name}`);
    return { fixture, el, tab };
  }

  it('reflects open state with aria-expanded and points at the dialogs', async () => {
    const { tab } = await setup({ tipOpen: true });
    expect(tab('tip')?.getAttribute('aria-expanded')).toBe('true');
    expect(tab('tip')?.getAttribute('aria-controls')).toBe('jic-tip');
    expect(tab('library')?.getAttribute('aria-expanded')).toBe('false');
    expect(tab('library')?.getAttribute('aria-controls')).toBe('jic-library');
  });

  it('emits the clicked button so focus can return to it', async () => {
    const { fixture, tab } = await setup();
    const tip = vi.fn();
    const library = vi.fn();
    fixture.componentInstance.tipToggle.subscribe(tip);
    fixture.componentInstance.libraryToggle.subscribe(library);

    tab('tip')?.click();
    tab('library')?.click();

    expect(tip).toHaveBeenCalledWith(tab('tip'));
    expect(library).toHaveBeenCalledWith(tab('library'));
  });

  it('hides "Read to me" when speech is not available', async () => {
    const { tab } = await setup({ readAloudAvailable: false });
    expect(tab('read')).toBeNull();
  });

  it('marks "Read to me" as pressed while reading', async () => {
    const { tab } = await setup({ reading: true });
    expect(tab('read')?.getAttribute('aria-pressed')).toBe('true');
  });
});
