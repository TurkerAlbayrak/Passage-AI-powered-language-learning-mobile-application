import * as Speech from 'expo-speech';

export interface SpeakOptions {
  rate?: number;
  onStart?: () => void;
  onDone?: () => void;
}

/** Speak English text with sensible defaults; stops anything already speaking. */
export function speak(text: string, opts: SpeakOptions = {}): void {
  if (!text?.trim()) return;
  Speech.stop();
  Speech.speak(text, {
    language: 'en-US',
    rate: opts.rate ?? 0.96,
    pitch: 1.0,
    onStart: opts.onStart,
    onDone: opts.onDone,
    onStopped: opts.onDone,
    onError: opts.onDone,
  });
}

export function stopSpeaking(): void {
  Speech.stop();
}

export async function isSpeaking(): Promise<boolean> {
  try {
    return await Speech.isSpeakingAsync();
  } catch {
    return false;
  }
}
