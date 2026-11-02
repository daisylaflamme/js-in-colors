import { TestBed } from '@angular/core/testing';
import { SceneNavComponent } from './scene-nav';

describe('SceneNavComponent', () => {
  async function setup(scene: number, sceneCount = 5) {
    const fixture = TestBed.createComponent(SceneNavComponent);
    fixture.componentRef.setInput('scene', scene);
    fixture.componentRef.setInput('sceneCount', sceneCount);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    return { fixture, el };
  }

  it('says which scene this is in text (dots are decorative)', async () => {
    const { el } = await setup(3);
    expect(el.querySelector('.label')?.textContent).toBe('Scene 3 of 5');
    expect(el.querySelector('.dots')?.getAttribute('aria-hidden')).toBe('true');
    expect(el.querySelectorAll('.dot')).toHaveLength(5);
    expect(el.querySelectorAll('.dot.done')).toHaveLength(2);
    expect(el.querySelector('.dot.current')).not.toBeNull();
  });

  it('disables Back on the first scene', async () => {
    const { el } = await setup(1);
    expect(el.querySelector<HTMLButtonElement>('.back')?.disabled).toBe(true);
  });

  it('emits back and next', async () => {
    const { fixture, el } = await setup(3);
    const back = vi.fn();
    const next = vi.fn();
    fixture.componentInstance.back.subscribe(back);
    fixture.componentInstance.next.subscribe(next);

    el.querySelector<HTMLButtonElement>('.back')?.click();
    el.querySelector<HTMLButtonElement>('.next')?.click();

    expect(back).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledOnce();
  });
});
