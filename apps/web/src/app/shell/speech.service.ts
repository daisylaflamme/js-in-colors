import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

/**
 * "Read to me": a thin wrapper over the Web Speech API (speechSynthesis).
 * Optional by design: `available` is false where the browser has no speech, and the UI hides the tab.
 * Nothing is recorded or sent anywhere; the browser speaks locally.
 */
@Injectable({ providedIn: 'root' })
export class SpeechService {
  private readonly synth: SpeechSynthesis | undefined = inject(DOCUMENT).defaultView?.speechSynthesis;

  readonly available = typeof SpeechSynthesisUtterance !== 'undefined' && !!this.synth;
  readonly speaking = signal(false);

  speak(text: string): void {
    if (!this.available || !this.synth) return;
    this.synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9; // a little slower for young listeners
    utterance.onend = () => this.speaking.set(false);
    utterance.onerror = () => this.speaking.set(false);
    this.speaking.set(true);
    this.synth.speak(utterance);
  }

  stop(): void {
    this.synth?.cancel();
    this.speaking.set(false);
  }

  toggle(text: string): void {
    if (this.speaking()) {
      this.stop();
    } else {
      this.speak(text);
    }
  }
}
