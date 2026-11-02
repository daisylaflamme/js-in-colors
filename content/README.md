# Lesson content

Lessons are YAML files, rendered by `libs/lesson-engine`. Adding a lesson needs no code
unless it needs a new kind of picture (a new visual) or a new scene type.

- `course.yaml`: every lesson in menu order, with `status: ready` or `status: soon`.
- `lessons/<id>.yaml`: one file per ready lesson. The file name is the lesson id.

Check your work with `npx nx run content:validate`. Errors look like this and point at the line:

```
content/lessons/variables.yaml:23:32  error    scenes[1].choices[0].concept: "strng" is not a concept. Use one of: number, string, ...
```

Warnings (long sentences, a Tip with two sentences) never break the build, but please fix them:
the readers are 6 to 12 years old.

## Writing rules

- Very short sentences, 12 words or fewer. Simple words. Talk to the child ("you").
- Original wording only. Use tutorials for topic order, never for text.
- 4 to 6 scenes. A one-sentence Tip. A Library entry with a few short sections.
- Every choice and example names its concept, so the app can show the color **and** the shape.
- Quiz feedback is kind for every option. There is no failing: "Not quite. ... Try another one!"

## Shape of a lesson

```yaml
id: variables # = file name
title: Variables
topic: Variables # the real JavaScript word
lead: A variable is a jar with a name on it.
leadHighlight: jar # optional; must appear in the lead
concept: variable # number, string, boolean, object, array, function, variable, html, intro
tip: A jar holds one thing at a time.
library:
  title: All about variables
  sections:
    - { heading: What is a variable?, text: A variable is a jar. }
  examples: # optional
    - { concept: number, label: Numbers, value: '7' }
  words: # optional
    - { term: variable, meaning: the jar }
scenes:
  - id: meet-the-jar
    type: watch # an animated explanation; "Play again" replays it
    bubble: This is a jar.
    visual: { kind: jar, name: favorite } # jar | screen | dot
    code: let favorite; # optional, shown with "Peek at the code"
    notes: [{ term: let, text: 'means: make a new jar' }] # optional
  - id: fill-the-jar
    type: interact # pick a choice; picture, bubble and code change together
    prompt: 'Pick something for the jar:'
    visual: { kind: jar, name: favorite }
    choices: # 2 to 4; the first is picked when the scene opens
      - id: seven
        label: '7'
        concept: number
        value: '7'
        bubble: My favorite is 7!
        code: let favorite = 7;
  - id: check
    type: quiz # one question; exactly one option is correct
    question: What is the name of this jar?
    options:
      - id: favorite
        label: favorite
        correct: true
        feedback: Yes! The name is on the tag.
      - id: seven
        label: '7'
        concept: number
        correct: false
        feedback: Not quite. 7 is inside. Try another one!
```
