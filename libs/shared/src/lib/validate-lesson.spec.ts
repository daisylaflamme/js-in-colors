import type { Course, Lesson } from './lesson';
import { checkCourseAgainstLessons, formatPath, validateCourse, validateLesson } from './validate-lesson';

/** A small valid lesson; each test breaks one thing. */
function validLesson(): Record<string, unknown> {
  return {
    id: 'jars',
    title: 'Jars',
    topic: 'Variables',
    lead: 'A variable is a jar with a name on it.',
    leadHighlight: 'jar',
    concept: 'variable',
    tip: 'A jar holds one thing.',
    library: {
      title: 'All about jars',
      sections: [{ heading: 'What is a jar?', text: 'A jar keeps a value.' }],
    },
    scenes: [
      { id: 'look', type: 'watch', bubble: 'Look, a jar!', visual: { kind: 'jar', name: 'box' } },
      {
        id: 'name',
        type: 'watch',
        bubble: 'It has a name.',
        visual: { kind: 'jar', name: 'box' },
        code: 'let box;',
      },
      {
        id: 'pick',
        type: 'interact',
        prompt: 'Pick something:',
        visual: { kind: 'jar', name: 'box' },
        choices: [
          {
            id: 'seven',
            label: '7',
            concept: 'number',
            value: '7',
            bubble: 'It is 7!',
            code: 'let box = 7;',
          },
          {
            id: 'hi',
            label: 'Hi',
            concept: 'string',
            value: 'Hi',
            bubble: 'It says Hi!',
            code: 'let box = "Hi";',
          },
        ],
      },
      {
        id: 'quiz',
        type: 'quiz',
        question: 'What is the name?',
        options: [
          { id: 'box', label: 'box', correct: true, feedback: 'Yes!' },
          { id: 'seven', label: '7', concept: 'number', correct: false, feedback: '7 is inside. Try again!' },
        ],
      },
    ],
  };
}

const errors = (r: ReturnType<typeof validateLesson>) =>
  r.issues.filter((i) => i.level === 'error').map((i) => `${formatPath(i.path)}: ${i.message}`);

describe('validateLesson', () => {
  it('accepts a valid lesson and returns it', () => {
    const r = validateLesson(validLesson(), { expectedId: 'jars' });
    expect(errors(r)).toEqual([]);
    expect(r.value?.id).toBe('jars');
  });

  it('reports a missing required field', () => {
    const data = validLesson();
    delete data['tip'];
    expect(errors(validateLesson(data))).toEqual(['tip: is required.']);
  });

  it('reports an unknown concept with the list of valid ones', () => {
    const data = validLesson();
    (data['scenes'] as Record<string, unknown>[])[2]['choices'] = [
      { id: 'a', label: 'A', concept: 'strng', value: 'A', bubble: 'A.', code: 'a' },
      { id: 'b', label: 'B', concept: 'number', value: 'B', bubble: 'B.', code: 'b' },
    ];
    const [message] = errors(validateLesson(data));
    expect(message).toMatch(
      /^scenes\[2\]\.choices\[0\]\.concept: "strng" is not a concept\. Use one of: number, string/,
    );
  });

  it('reports a typo in a field name', () => {
    const data = validLesson();
    data['tipp'] = 'oops';
    expect(errors(validateLesson(data))[0]).toMatch(/^tipp: is not a known field here/);
  });

  it.each([
    [3, 'scenes: needs at least 4 items, has 3.'],
    [7, 'scenes: can have at most 6 items, has 7.'],
  ])('requires 4 to 6 scenes (%i)', (count, message) => {
    const data = validLesson();
    const scenes = data['scenes'] as Record<string, unknown>[];
    data['scenes'] = Array.from({ length: count }, (_, i) => ({ ...scenes[0], id: `s${i}` }));
    expect(errors(validateLesson(data))).toEqual([message]);
  });

  it('requires exactly one correct quiz option', () => {
    const data = validLesson();
    const quiz = (data['scenes'] as Record<string, unknown>[])[3];
    (quiz['options'] as Record<string, unknown>[])[1]['correct'] = true;
    expect(errors(validateLesson(data))).toEqual([
      'scenes[3].options: needs exactly one option with "correct: true", has 2.',
    ]);
  });

  it('reports duplicate ids', () => {
    const data = validLesson();
    (data['scenes'] as Record<string, unknown>[])[1]['id'] = 'look';
    expect(errors(validateLesson(data))).toEqual(['scenes[1].id: "look" is used twice (also at item 0).']);
  });

  it('reports an unknown scene type and visual kind', () => {
    const data = validLesson();
    const scenes = data['scenes'] as Record<string, unknown>[];
    scenes[0]['type'] = 'video';
    scenes[1]['visual'] = { kind: 'box' };
    expect(errors(validateLesson(data))).toEqual([
      'scenes[0].type: "video" is not a scene type. Use one of: watch, interact, quiz.',
      'scenes[1].visual.kind: "box" is not a visual. Use one of: jar, screen, dot, machine.',
    ]);
  });

  describe('screen scenes with lines', () => {
    /** The interact scene, turned into a screen scene. */
    function withScreen(): { data: Record<string, unknown>; first: Record<string, unknown> } {
      const data = validLesson();
      const pick = (data['scenes'] as Record<string, unknown>[])[2];
      pick['visual'] = { kind: 'screen', lines: [] };
      return { data, first: (pick['choices'] as Record<string, unknown>[])[0] };
    }

    it('accepts 1 to 4 lines on a choice', () => {
      const { data, first } = withScreen();
      first['lines'] = ['Jump!', 'Jump!', 'Jump!'];
      expect(errors(validateLesson(data))).toEqual([]);
    });

    it('allows at most 4 lines, all text', () => {
      const { data, first } = withScreen();
      first['lines'] = ['1', '2', '3', '4', '5'];
      expect(errors(validateLesson(data))).toEqual([
        'scenes[2].choices[0].lines: can have at most 4 items, has 5.',
      ]);
      first['lines'] = ['1', 2];
      expect(errors(validateLesson(data))).toEqual(['scenes[2].choices[0].lines[1]: should be text, got 2.']);
    });

    it('allows lines only in screen scenes', () => {
      const data = validLesson();
      const pick = (data['scenes'] as Record<string, unknown>[])[2];
      (pick['choices'] as Record<string, unknown>[])[0]['lines'] = ['7'];
      expect(errors(validateLesson(data))).toEqual([
        'scenes[2].choices[0].lines: is only for screen scenes (the lines on the screen).',
      ]);
    });
  });

  describe('machine scenes', () => {
    /** The interact scene, turned into a machine scene with a result on each choice. */
    function withMachine(): { data: Record<string, unknown>; pick: Record<string, unknown> } {
      const data = validLesson();
      const pick = (data['scenes'] as Record<string, unknown>[])[2];
      pick['visual'] = { kind: 'machine', name: 'double' };
      (pick['choices'] as Record<string, unknown>[])[0]['result'] = '14';
      (pick['choices'] as Record<string, unknown>[])[1]['result'] = 'HiHi';
      return { data, pick };
    }

    it('accepts a machine with a result on every choice', () => {
      expect(errors(validateLesson(withMachine().data))).toEqual([]);
    });

    it('requires a result on each choice of a machine scene', () => {
      const { data, pick } = withMachine();
      delete (pick['choices'] as Record<string, unknown>[])[1]['result'];
      expect(errors(validateLesson(data))).toEqual(['scenes[2].choices[1].result: is required.']);
    });

    it('allows a result only in machine scenes', () => {
      const data = validLesson();
      const pick = (data['scenes'] as Record<string, unknown>[])[2];
      (pick['choices'] as Record<string, unknown>[])[0]['result'] = '14';
      expect(errors(validateLesson(data))).toEqual([
        'scenes[2].choices[0].result: is only for machine scenes (what comes out of the machine).',
      ]);
    });

    it('needs a concept when a machine shows an input or output', () => {
      const data = validLesson();
      (data['scenes'] as Record<string, unknown>[])[0]['visual'] = {
        kind: 'machine',
        name: 'double',
        input: '3',
      };
      expect(errors(validateLesson(data))).toEqual([
        'scenes[0].visual.concept: is required when the machine has an input or output (it colors them).',
      ]);
    });
  });

  it('checks the id against the file name and the id format', () => {
    expect(errors(validateLesson(validLesson(), { expectedId: 'variables' }))).toEqual([
      'id: "jars" should match the file name ("variables").',
    ]);
    const data = { ...validLesson(), id: 'My Jars' };
    expect(errors(validateLesson(data))[0]).toMatch(/should be lowercase words joined by dashes/);
  });

  it('validates the optional concept chips', () => {
    const ok = { ...validLesson(), chips: { label: 'Jars can hold:', concepts: ['number', 'string'] } };
    expect(errors(validateLesson(ok))).toEqual([]);
    const bad = { ...validLesson(), chips: { label: 'Jars can hold:', concepts: ['number', 'cats'] } };
    expect(errors(validateLesson(bad))[0]).toContain('chips.concepts[1]: "cats" is not a concept');
  });

  it('checks that the highlight word is in the lead', () => {
    const data = { ...validLesson(), leadHighlight: 'box' };
    expect(errors(validateLesson(data))).toEqual(['leadHighlight: "box" does not appear in the lead.']);
  });

  it('warns about long sentences and multi-sentence tips, without failing', () => {
    const data = {
      ...validLesson(),
      tip: 'A jar holds one thing. You can change it.',
      lead: 'A variable is a jar with a name on it that you can use again and again later.',
    };
    const r = validateLesson(data);
    expect(r.value).toBeDefined();
    expect(r.issues.map((i) => `${i.level} ${formatPath(i.path)}`)).toEqual(['warning lead', 'warning tip']);
  });

  it('rejects data that is not a mapping', () => {
    expect(errors(validateLesson(['a list']))).toEqual([
      '(file): should be a mapping (key: value pairs), got a list.',
    ]);
  });
});

describe('validateCourse and cross-file checks', () => {
  const course: Course = {
    lessons: [
      { id: 'jars', title: 'Jars', topic: 'Variables', concept: 'variable', status: 'ready' },
      { id: 'loops', title: 'Loops', topic: 'Loops', concept: 'number', status: 'ready' },
    ],
  };

  it('validates the course index', () => {
    expect(validateCourse(course).issues).toEqual([]);
    const bad = validateCourse({ lessons: [{ ...course.lessons[0], status: 'later' }] });
    expect(bad.issues[0].message).toBe('"later" is not a status. Use "ready" or "soon".');
  });

  it('finds ready lessons without a file, mismatched titles, and unlisted files', () => {
    const lessons = [
      { ...validLesson(), title: 'Jars!' } as unknown as Lesson,
      { ...validLesson(), id: 'extra' } as unknown as Lesson,
    ];
    expect(
      checkCourseAgainstLessons(course, lessons).map((i) => `${formatPath(i.path)}: ${i.message}`),
    ).toEqual([
      'lessons[0].title: "Jars" differs from the lesson file ("Jars!").',
      'lessons[1].status: "loops" is "ready" but content/lessons/loops.yaml does not exist.',
      'lessons: content/lessons/extra.yaml is not listed in course.yaml.',
    ]);
  });
});
