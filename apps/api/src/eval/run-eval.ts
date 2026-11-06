// npx nx run api:eval  (or: npm run chat:eval)
// Sends every tricky question to the REAL provider through the full safety pipeline and checks
// each answer. Needs CHAT_PROVIDER=groq and GROQ_API_KEY in apps/api/.env. Not run in CI.
// The questions are made up, so printing the answers here is fine; the server itself never logs.
import { readConfig } from '../config';
import { answer } from '../pipeline';
import { GroqProvider } from '../providers/groq';
import { evaluate } from './evaluate';
import { TRICKY_QUESTIONS } from './tricky-questions';

const config = readConfig(process.env);
if (config.provider !== 'groq' || !config.groqApiKey) {
  console.error('Set CHAT_PROVIDER=groq and GROQ_API_KEY in apps/api/.env to run the live eval.');
  process.exit(1);
}

const provider = new GroqProvider({ apiKey: config.groqApiKey, model: config.groqModel });
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const rows: { kind: string; question: string; pass: string; answer: string; problems: string }[] = [];
let passed = 0;

for (const { kind, question, expect } of TRICKY_QUESTIONS) {
  let text = '';
  const signal = AbortSignal.timeout(20_000);
  for await (const chunk of answer(question, provider, { signal })) {
    if ('text' in chunk) text += chunk.text;
  }
  const verdict = evaluate(expect, text);
  if (verdict.pass) passed++;
  rows.push({
    kind,
    question: question.slice(0, 40),
    pass: verdict.pass ? 'yes' : 'NO',
    answer: text.slice(0, 90),
    problems: verdict.problems.join('; '),
  });
  await pause(2500); // stay well under the free tier's requests per minute
}

console.log(`\nAsk Dot live eval: ${config.groqModel}, ${new Date().toISOString().slice(0, 10)}`);
console.table(rows);
console.log(`${passed} of ${TRICKY_QUESTIONS.length} passed.`);
process.exitCode = passed === TRICKY_QUESTIONS.length ? 0 : 1;
