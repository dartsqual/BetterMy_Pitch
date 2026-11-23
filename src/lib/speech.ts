"use client";

// Thin wrappers over the browser Web Speech API (SpeechRecognition +
// SpeechSynthesis). Both are optional: the UI hides voice controls when the
// browser doesn't support them (e.g. Firefox has no SpeechRecognition).

type RecognitionResultEvent = {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
};

export type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: RecognitionResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
};

type RecognitionCtor = new () => Recognition;

export function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function canSpeak() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function speak(text: string, lang: string) {
  if (!canSpeak()) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  const voice = window.speechSynthesis.getVoices().find((v) => v.lang === lang);
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}

/**
 * Read several buyer lines in order, giving each committee member (by index)
 * a different voice when the browser has several for the language, and a
 * different pitch otherwise.
 */
export function speakLines(lines: { text: string; voice: number }[], lang: string) {
  if (!canSpeak() || lines.length === 0) return;
  window.speechSynthesis.cancel();
  const prefix = lang.split("-")[0];
  const all = window.speechSynthesis.getVoices();
  const voices = all.filter((v) => v.lang === lang).concat(all.filter((v) => v.lang !== lang && v.lang.startsWith(prefix)));
  for (const line of lines) {
    const utterance = new SpeechSynthesisUtterance(line.text);
    utterance.lang = lang;
    if (voices.length > 0) utterance.voice = voices[line.voice % voices.length];
    if (voices.length <= line.voice) utterance.pitch = [1, 0.8, 1.2][line.voice % 3];
    window.speechSynthesis.speak(utterance);
  }
}

export function stopSpeaking() {
  if (canSpeak()) window.speechSynthesis.cancel();
}
