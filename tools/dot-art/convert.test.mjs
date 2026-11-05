// node --test tools/   (runs in CI with the other checks)
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { convertPose, POSES } from './convert-lib.mjs';

const svg = (inner, attrs = 'viewBox="0 0 120 130"') =>
  `<svg xmlns="http://www.w3.org/2000/svg" ${attrs}>${inner}</svg>`;
const BODY =
  '<g id="body"><circle cx="60" cy="76" r="40" fill="#ffc93c" stroke="#1b1f4b" stroke-width="5"/></g>';
const FACE =
  '<g id="eyes"><circle cx="46" cy="69" r="4.5" fill="#1b1f4b"/></g><g id="mouth"><path d="M48 87 Q60 97 72 87" fill="none" stroke="#1b1f4b" stroke-width="5"/></g>';

test('the delivered artwork passes the brief', () => {
  for (const pose of POSES) {
    const art = convertPose(readFileSync(`docs/dot-art/dot-${pose}.svg`, 'utf8'), pose);
    assert.ok(
      art.shapes.some((s) => s.part === 'body'),
      `${pose} has a body`,
    );
  }
});

test('ink is the themed outline on the body, and stays ink on the face', () => {
  const art = convertPose(svg(BODY + FACE), 'ok');
  assert.equal(art.shapes[0].fill, 'accent');
  assert.equal(art.shapes[0].stroke, 'outline');
  assert.equal(art.shapes[1].fill, 'face');
  assert.equal(art.shapes[2].fill, undefined); // fill="none"
  assert.equal(art.shapes[2].stroke, 'face');
});

test('keeps a whole-figure transform', () => {
  const art = convertPose(svg(`<g transform="rotate(-6 60 76)">${BODY}${FACE}</g>`), 'tilt');
  assert.equal(art.transform, 'rotate(-6 60 76)');
});

test('rejects anything outside the brief, with a clear message', () => {
  assert.throws(() => convertPose(svg(BODY + FACE, 'viewBox="0 0 100 100"'), 'x'), /viewBox must be/);
  assert.throws(
    () => convertPose(svg(BODY + FACE + '<g id="eyes"><text>hi</text></g>'), 'x'),
    /<text> is not supported/,
  );
  assert.throws(
    () => convertPose(svg(BODY.replace('#ffc93c', '#00ff00') + FACE), 'x'),
    /#00ff00 is not in the brief/,
  );
  assert.throws(() => convertPose(svg(BODY + FACE + '<g id="hat"></g>'), 'x'), /unknown part id "hat"/);
  assert.throws(() => convertPose(svg(BODY), 'x'), /"eyes" part is missing/);
  assert.throws(
    () => convertPose(svg('<circle cx="1" cy="1" r="1" fill="#ffc93c"/>' + BODY + FACE), 'x'),
    /outside any part group/,
  );
});
