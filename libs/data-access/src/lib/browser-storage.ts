/**
 * The browser's localStorage, or undefined when there is none or it is blocked. With cookies
 * blocked, Chrome and Firefox throw on *reading the property*, before any getItem/setItem
 * call, so it must be guarded here as well as at each use.
 */
export function browserLocalStorage(win: Window | null | undefined): Storage | undefined {
  try {
    return win?.localStorage ?? undefined;
  } catch {
    return undefined;
  }
}
