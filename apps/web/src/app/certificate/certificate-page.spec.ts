import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { memoryProgressStorage } from '@jic/data-access';
import { CertificateExport } from './certificate-export';
import { CertificatePage } from './certificate-page';

/** Every lesson in the real course (content/). */
const ALL = [
  'hello',
  'output',
  'variables',
  'data-types',
  'functions',
  'conditions',
  'loops',
  'arrays',
  'objects',
  'dom',
];
const saved = (finishedIds: string[]) => ({
  v: 1,
  resumeCode: 'brave-otter-37',
  finishedIds,
  lastLessonId: null,
});

async function setup(finishedIds: string[]) {
  const memory = memoryProgressStorage(saved(finishedIds));
  const download = vi.fn(async () => true);
  TestBed.configureTestingModule({
    providers: [provideRouter([]), memory.provider, { provide: CertificateExport, useValue: { download } }],
  });
  const fixture = TestBed.createComponent(CertificatePage);
  await fixture.whenStable();
  const el = fixture.nativeElement as HTMLElement;
  const text = (selector: string) => el.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim();
  const type = async (value: string) => {
    const input = el.querySelector<HTMLInputElement>('#certificate-name');
    if (!input) throw new Error('No name box');
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  };
  return { fixture, el, text, type, download, memory };
}

describe('CertificatePage', () => {
  afterEach(() => vi.restoreAllMocks());

  it('says how far the child is, and offers to continue, until every lesson is finished', async () => {
    const { el, text } = await setup(['hello', 'output', 'variables']);
    expect(text('h1')).toBe('Your certificate');
    expect(text('.lead')).toBe('You finished 3 of 10 lessons. Finish the rest to fill in your certificate!');
    expect(el.querySelector('a.continue')?.getAttribute('href')).toBe('/lesson/data-types');
    expect(el.querySelector('#certificate-name')).toBeNull();
    expect(el.querySelector('.sheet')).toBeNull();
  });

  it('shows the certificate with a labelled name box once all 10 are finished', async () => {
    const { el, text } = await setup(ALL);
    const input = el.querySelector<HTMLInputElement>('#certificate-name');
    expect(el.querySelector('label[for="certificate-name"]')?.textContent).toBe('Name on the certificate');
    expect(input?.getAttribute('autocomplete')).toBe('off');
    expect(input?.getAttribute('maxlength')).toBe('24');
    expect(text('#certificate-name-note')).toBe(
      'You can type any name. It is made on this device and never sent anywhere.',
    );
    expect(text('.sheet h2')).toBe('Certificate of Discovery');
    expect(text('.sheet p.name')).toBe('Your name');
    expect(el.querySelectorAll('.shapes jic-concept-shape')).toHaveLength(8);
  });

  it('writes the typed name on the certificate, smaller when it is long', async () => {
    const { el, text, type } = await setup(ALL);
    await type('Emma');
    expect(text('.sheet p.name')).toBe('Emma');
    expect(el.querySelector('.sheet p.name')?.getAttribute('data-size')).toBe('big');
    await type('Maximiliana Rosalind');
    expect(el.querySelector('.sheet p.name')?.getAttribute('data-size')).toBe('small');
  });

  it('never stores the name: not in progress, not in localStorage', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const { type, memory } = await setup(ALL);
    await type('Emma');
    expect(JSON.stringify(memory.box)).not.toContain('Emma');
    expect(setItem.mock.calls.flat().join(' ')).not.toContain('Emma');
  });

  it('downloads with the typed name and the date, and says so', async () => {
    const { el, text, type, download, fixture } = await setup(ALL);
    await type('Emma');
    el.querySelector<HTMLButtonElement>('button.download')?.click();
    await fixture.whenStable();
    expect(download).toHaveBeenCalledWith({ name: 'Emma', date: expect.stringMatching(/\d{4}$/) });
    expect(text('[role="status"]')).toBe('Your certificate was saved.');
  });

  it('opens the print dialog', async () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    const { el, text, fixture } = await setup(ALL);
    el.querySelector<HTMLButtonElement>('button.print')?.click();
    await fixture.whenStable();
    expect(print).toHaveBeenCalled();
    expect(text('[role="status"]')).toBe('Print opened.');
  });
});
