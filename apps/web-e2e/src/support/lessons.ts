/** A ready lesson as the specs see it (built from content/ in cypress.config.ts). */
export interface ReadyLesson {
  readonly id: string;
  readonly title: string;
  /** Quiz scenes carry their correct answer and its feedback. */
  readonly scenes: readonly { readonly type: string; readonly answer?: string; readonly feedback?: string }[];
}

export const readyLessons = (): readonly ReadyLesson[] => Cypress.env('lessons') as ReadyLesson[];
