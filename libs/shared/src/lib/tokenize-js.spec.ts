import { tokenizeJs } from './tokenize-js';

const kinds = (code: string) => tokenizeJs(code).map((t) => `${t.kind}:${t.text}`);

describe('tokenizeJs', () => {
  it('splits a variable declaration and keeps the text intact', () => {
    const tokens = tokenizeJs('let favorite = 7;');
    expect(tokens.map((t) => t.text).join('')).toBe('let favorite = 7;');
    expect(kinds('let favorite = 7;')).toEqual([
      'keyword:let',
      'punctuation: ',
      'name:favorite',
      'punctuation: ',
      'operator:=',
      'punctuation: ',
      'value:7',
      'punctuation:;',
    ]);
  });

  it('marks values with their concept', () => {
    const values = (code: string) => tokenizeJs(code).filter((t) => t.kind === 'value');
    expect(values('x = "Emma"')[0]).toEqual({ text: '"Emma"', kind: 'value', concept: 'string' });
    expect(values("x = 'hi'")[0].concept).toBe('string');
    expect(values('x = 3.5')[0].concept).toBe('number');
    expect(values('x = true')[0].concept).toBe('boolean');
  });

  it('handles console.log calls', () => {
    expect(kinds('console.log("Hi");')).toEqual([
      'name:console',
      'punctuation:.',
      'name:log',
      'punctuation:(',
      'value:"Hi"',
      'punctuation:);',
    ]);
  });

  it('never loses characters, even for things it does not know', () => {
    const code = 'if (a >= 2 && b) { c++ } // ok @#';
    expect(
      tokenizeJs(code)
        .map((t) => t.text)
        .join(''),
    ).toBe(code);
  });
});
