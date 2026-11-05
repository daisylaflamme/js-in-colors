import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { Scene } from '@jic/shared';
import { LibraryContentComponent } from './library-content';
import { EMPTY_SCENE_STATE, type SceneAction, type SceneComponent, type SceneState } from './scene-contract';
import { SceneHostComponent } from './scene-host';
import { provideDefaultSceneTypes, provideSceneTypes } from './scene-registry';
import { InteractSceneComponent } from './scenes/interact-scene';
import { QuizSceneComponent } from './scenes/quiz-scene';
import { WatchSceneComponent } from './scenes/watch-scene';
import { SAMPLE_INTERACT, SAMPLE_LIBRARY, SAMPLE_QUIZ, SAMPLE_WATCH } from './testing/sample-scenes';

async function host(
  scene: Scene,
  state: SceneState = EMPTY_SCENE_STATE,
  providers = provideDefaultSceneTypes(),
) {
  TestBed.configureTestingModule({ providers });
  const fixture = TestBed.createComponent(SceneHostComponent);
  fixture.componentRef.setInput('scene', scene);
  fixture.componentRef.setInput('state', state);
  const actions: SceneAction[] = [];
  fixture.componentInstance.action.subscribe((a) => actions.push(a));
  await fixture.whenStable();
  return { fixture, el: fixture.nativeElement as HTMLElement, actions };
}

const buttons = (el: HTMLElement) =>
  Array.from(el.querySelectorAll<HTMLButtonElement>('button[jic-choice-button]'));

describe('SceneHost + registry', () => {
  it.each([
    [SAMPLE_WATCH, 'jic-watch-scene'],
    [SAMPLE_INTERACT, 'jic-interact-scene'],
    [SAMPLE_QUIZ, 'jic-quiz-scene'],
  ] as const)('renders %s.type with its registered component', async (scene, selector) => {
    const { el } = await host(scene);
    expect(el.querySelector(selector)).not.toBeNull();
  });

  it('shows a kind fallback for an unknown scene type', async () => {
    const { el } = await host({ ...SAMPLE_WATCH, type: 'video' } as unknown as Scene);
    expect(el.querySelector('jic-fallback-scene')?.textContent).toContain('not ready yet');
  });

  it('lets an app register a new scene type with one component', async () => {
    @Component({
      selector: 'jic-test-scene',
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `custom: {{ scene().id }}`,
    })
    class TestScene implements SceneComponent {
      readonly scene = input.required<Scene>();
      readonly state = input<SceneState>(EMPTY_SCENE_STATE);
      readonly action = output<SceneAction>();
    }
    const providers = [
      ...provideDefaultSceneTypes(),
      ...provideSceneTypes({ type: 'watch', component: TestScene }),
    ];
    const { el } = await host(SAMPLE_WATCH, EMPTY_SCENE_STATE, providers);
    expect(el.textContent).toContain('custom: meet');
  });

  it('creates a fresh component for a new scene and keeps it for the same scene', async () => {
    const { fixture } = await host(SAMPLE_INTERACT);
    const first = fixture.componentInstance.current;
    fixture.componentRef.setInput('state', { pickedChoiceId: 'emma', answeredOptionId: null });
    await fixture.whenStable();
    expect(fixture.componentInstance.current).toBe(first);
    fixture.componentRef.setInput('scene', { ...SAMPLE_INTERACT, id: 'fill-2' });
    await fixture.whenStable();
    expect(fixture.componentInstance.current).not.toBe(first);
  });
});

describe('WatchScene', () => {
  it('shows the bubble and the picture, and replays without changing the final state', async () => {
    const { fixture, el } = await host(SAMPLE_WATCH);
    expect(el.querySelector('.bubble')?.textContent).toBe('This is a jar. It can hold one thing.');
    expect(el.querySelector('.art jic-jar-visual')).not.toBeNull();
    const scene = fixture.componentInstance.current as WatchSceneComponent;
    const before = el.querySelector('jic-jar-visual .value');
    el.querySelector<HTMLButtonElement>('button[jic-replay-button]')?.click();
    await fixture.whenStable();
    expect(el.querySelector('jic-jar-visual .value')).not.toBe(before); // re-created: animation restarts
    expect(el.querySelector('jic-jar-visual .value-text')?.textContent).toBe('7'); // same final state
    expect(scene.finalVisual()).toEqual(SAMPLE_WATCH.visual);
  });

  it('peeks at the code with the notes', async () => {
    const { fixture, el } = await host(SAMPLE_WATCH);
    const toggle = el.querySelector<HTMLButtonElement>('button[jic-code-peek-toggle]');
    toggle?.click();
    await fixture.whenStable();
    const panel = el.querySelector('jic-code-panel');
    expect(toggle?.getAttribute('aria-controls')).toBe(panel?.id);
    expect(panel?.querySelector('code')?.textContent).toBe('let favorite = 7;');
    expect(panel?.querySelectorAll('.notes li')).toHaveLength(2);
  });
});

describe('InteractScene', () => {
  it('pre-picks the first choice and asks to pick another', async () => {
    const { el, actions } = await host(SAMPLE_INTERACT);
    expect(buttons(el)[0].getAttribute('aria-pressed')).toBe('true');
    buttons(el)[1].click();
    expect(actions).toEqual([{ kind: 'pick', id: 'emma' }]);
  });

  it('updates the picture, bubble and code together from the picked choice', async () => {
    const { fixture, el } = await host(SAMPLE_INTERACT, { pickedChoiceId: 'emma', answeredOptionId: null });
    el.querySelector<HTMLButtonElement>('button[jic-code-peek-toggle]')?.click();
    await fixture.whenStable();
    expect(el.querySelector('.bubble')?.textContent).toBe('My favorite is Emma!');
    expect(el.querySelector('jic-jar-visual .value-text')?.textContent).toBe('Emma');
    expect(el.querySelector('jic-code-panel code')?.textContent).toBe('let favorite = "Emma";');
    expect(buttons(el)[1].textContent).toContain('(words)');
    const scene = fixture.componentInstance.current as InteractSceneComponent;
    expect(scene.visual()).toEqual({ kind: 'jar', name: 'favorite', value: 'Emma', concept: 'string' });
  });

  it('feeds the picked choice into a machine: value goes in, result comes out', async () => {
    const machineScene: Scene = {
      id: 'feed',
      type: 'interact',
      prompt: 'Feed the machine:',
      visual: { kind: 'machine', name: 'double' },
      choices: [
        {
          id: 'two',
          label: '2',
          concept: 'number',
          value: '2',
          result: '4',
          bubble: '2 in, 4 out!',
          code: 'double(2)',
        },
        {
          id: 'five',
          label: '5',
          concept: 'number',
          value: '5',
          result: '10',
          bubble: '5 in, 10 out!',
          code: 'double(5)',
        },
      ],
    };
    const { fixture, el } = await host(machineScene, { pickedChoiceId: 'five', answeredOptionId: null });
    expect(el.querySelector('jic-machine-visual .in .token-text')?.textContent).toBe('5');
    expect(el.querySelector('jic-machine-visual .out .token-text')?.textContent).toBe('10');
    const scene = fixture.componentInstance.current as InteractSceneComponent;
    expect(scene.visual()).toEqual({
      kind: 'machine',
      name: 'double',
      input: '5',
      output: '10',
      concept: 'number',
    });
  });
});

describe('QuizScene', () => {
  it('asks the question in the bubble and gives no feedback before an answer', async () => {
    const { el } = await host(SAMPLE_QUIZ);
    expect(el.querySelector('.bubble')?.textContent).toBe('What is the name of this jar?');
    expect(el.querySelector('.art jic-jar-visual')).not.toBeNull(); // projected into the stage's art slot
    expect(el.querySelector('jic-quiz-feedback')?.textContent?.trim()).toBe('');
  });

  it('gives kind feedback for a wrong answer and allows another try', async () => {
    const { fixture, el, actions } = await host(SAMPLE_QUIZ, {
      pickedChoiceId: null,
      answeredOptionId: 'seven',
    });
    const quiz = fixture.componentInstance.current as QuizSceneComponent;
    expect(quiz.status()).toBe('try-again');
    expect(el.querySelector('jic-quiz-feedback')?.textContent).toContain('Not quite. 7 is inside.');
    buttons(el)[0].click();
    expect(actions).toEqual([{ kind: 'answer', id: 'favorite' }]);
    buttons(el).forEach((b) => expect(b.disabled).toBe(false));
  });

  it('celebrates the right answer', async () => {
    const { fixture } = await host(SAMPLE_QUIZ, { pickedChoiceId: null, answeredOptionId: 'favorite' });
    expect((fixture.componentInstance.current as QuizSceneComponent).status()).toBe('correct');
  });
});

describe('LibraryContent', () => {
  it('renders sections, examples with shapes and words, and reads the text aloud', async () => {
    const fixture = TestBed.createComponent(LibraryContentComponent);
    fixture.componentRef.setInput('entry', SAMPLE_LIBRARY);
    fixture.componentRef.setInput('canRead', true);
    const read = signal('');
    fixture.componentInstance.readAloud.subscribe((t) => read.set(t));
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h3')?.textContent).toBe('All about jars');
    expect(el.querySelectorAll('.examples jic-concept-shape')).toHaveLength(2);
    expect(el.querySelector('.words')?.textContent).toContain('name = the label');
    el.querySelector<HTMLButtonElement>('button.read')?.click();
    expect(read()).toBe(
      'All about jars. What is a jar? A jar keeps one thing. It has a name. Numbers: 7. Words: Emma. Words to know. name means the label.',
    );
  });

  it('hides the read button when speech is not available', async () => {
    const fixture = TestBed.createComponent(LibraryContentComponent);
    fixture.componentRef.setInput('entry', SAMPLE_LIBRARY);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('button.read')).toBeNull();
  });
});
