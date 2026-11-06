// Words Dot must never say to a child. Used only on the AI's OUTPUT (checkWord), one whole word
// at a time, as the last safety layer after the system prompt. Conservative on purpose: a false
// alarm only ends an answer early with a redirect. Lowercase, letters and apostrophes only.
export const CHAT_BLOCKLIST: ReadonlySet<string> = new Set([
  // swearing
  'fuck',
  'fucking',
  'shit',
  'bitch',
  'bastard',
  'ass',
  'asshole',
  'crap',
  'damn',
  'hell',
  'piss',
  'dick',
  // unkind words
  'stupid',
  'idiot',
  'dumb',
  'hate',
  'loser',
  'ugly',
  // adult topics
  'sex',
  'sexy',
  'porn',
  'nude',
  'naked',
  // drugs and alcohol
  'drug',
  'drugs',
  'cocaine',
  'weed',
  'alcohol',
  'beer',
  'vodka',
  'drunk',
  // violence and self-harm
  'kill',
  'killing',
  'murder',
  'gun',
  'guns',
  'weapon',
  'weapons',
  'bomb',
  'blood',
  'suicide',
]);
