import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ShellState } from './shell-state';

/** Fake matchMedia for a viewport width (jsdom has none). */
function stubViewport(width: number) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => {
      const min = Number(/min-width:\s*(\d+)px/.exec(query)?.[1] ?? 0);
      return {
        matches: width >= min,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      } as unknown as MediaQueryList;
    }),
  );
}

describe('ShellState', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

  function create(width: number): ShellState {
    stubViewport(width);
    TestBed.resetTestingModule();
    return TestBed.inject(ShellState);
  }

  it.each([
    [390, 'phone'],
    [820, 'tablet'],
    [1440, 'desktop'],
  ] as const)('at %ipx the layout is %s', (width, layout) => {
    expect(create(width).layout()).toBe(layout);
  });

  it('on desktop the menu starts open and inline', () => {
    const shell = create(1440);
    expect(shell.menuOpen()).toBe(true);
    expect(shell.menuInline()).toBe(true);
    expect(shell.overlayMenuOpen()).toBe(false);
  });

  it('on desktop the hamburger collapses the menu and the choice is remembered', () => {
    create(1440).toggleMenu();
    expect(localStorage.getItem('jic.menuOpen')).toBe('false');

    const again = create(1440);
    expect(again.menuOpen()).toBe(false);
    expect(again.menuInline()).toBe(false);
  });

  it('below lg the menu is a closed overlay that the hamburger opens', () => {
    const shell = create(820);
    const trigger = document.createElement('button');
    expect(shell.menuOpen()).toBe(false);

    shell.toggleMenu(trigger);

    expect(shell.overlayMenuOpen()).toBe(true);
    expect(shell.menuInline()).toBe(false);
    expect(shell.menuTrigger()).toBe(trigger);

    shell.closeOverlayMenu();
    expect(shell.menuOpen()).toBe(false);
  });

  it('survives storage that throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(create(1440).menuOpen()).toBe(true);
    vi.restoreAllMocks();
  });

  it('when prerendering (no screen), draws the desktop layout with the menu open', () => {
    // Even with a phone-sized matchMedia around, the build never asks it (ADR 0014).
    stubViewport(390);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
    const shell = TestBed.inject(ShellState);

    expect(shell.prerendering).toBe(true);
    expect(shell.layout()).toBe('desktop');
    expect(shell.menuInline()).toBe(true);
  });

  it('in the browser it is not prerendering', () => {
    expect(create(390).prerendering).toBe(false);
  });
});
