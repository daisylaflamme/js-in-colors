import type { Provider } from '@angular/core';
import {
  PROGRESS_STORAGE,
  PROGRESS_VERSION,
  type ProgressStorage,
  type SavedProgress,
} from '../progress/progress-storage';

/** In-memory progress storage for tests. `saved` holds what was last written (with its version). */
export function memoryProgressStorage(initial: unknown = null) {
  const box: { saved: unknown; writes: number } = { saved: initial, writes: 0 };
  const storage: ProgressStorage = {
    read: () => box.saved,
    write: (progress: SavedProgress) => {
      box.saved = { v: PROGRESS_VERSION, ...progress };
      box.writes++;
    },
  };
  const provider: Provider = { provide: PROGRESS_STORAGE, useValue: storage };
  return { box, storage, provider };
}
