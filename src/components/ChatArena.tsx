"use client";

import { difficultyLabel, frameworkLabel } from "@/lib/catalog";
import { canSpeak, getRecognitionCtor, stopSpeaking, type Recognition } from "@/lib/speech";
import { cn } from "@/lib/utils";
import { Flag, Loader2, Mic, MicOff, Send, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { ArenaSession } from "./SessionArena";
import { Badge, Button } from "./ui";

export type ChatMessage = { id: string; role: "seller" | "buyer"; content: string; createdAt: string };

const subscribeNoop = () => () => {};

export function ChatArena({
  session,
  messages,
  buyerTyping,
  error,
  onSend,
  voiceOut,
  onVoiceOutChange,
  canScore,
  scoring,
  onEndAndScore,
}: {
  session: ArenaSession;
  messages: ChatMessage[];
  buyerTyping: boolean;
  error: string | null;
  onSend: (text: string) => void;
  voiceOut: boolean;
  onVoiceOutChange: (on: boolean) => void;
  canScore: boolean;
  scoring: boolean;
  onEndAndScore: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [listening, setListening] = useState(false);
  const [autoSend, setAutoSend] = useState(true);
  const recognition = useRef<Recognition | null>(null);
  const heard = useRef("");
  const bottom = useRef<HTMLDivElement>(null);

  // Feature detection must only run in the browser (not during SSR).
  const micSupported = useSyncExternalStore(subscribeNoop, () => getRecognitionCtor() !== null, () => false);
  const ttsSupported = useSyncExternalStore(subscribeNoop, canSpeak, () => false);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, buyerTyping]);

  useEffect(() => () => recognition.current?.stop(), []);

  function submit(text = draft) {
    const value = text.trim();
    if (!value || buyerTyping) return;
    onSend(value);
    setDraft("");
  }

  function toggleMic() {
    if (listening) {
      recognition.current?.stop();
      return;
    }
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    stopSpeaking();
    const rec = new Ctor();
    rec.lang = session.speechLang;
    rec.continuous = true;
    rec.interimResults = true;
    heard.current = draft ? `${draft.trim()} ` : "";
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) heard.current += `${r[0].transcript.trim()} `;
        else interim += r[0].transcript;
      }
      setDraft((heard.current + interim).trimStart());
    };
    rec.onerror = (e) => console.warn("speech recognition error", e.error);
    rec.onend = () => {
      setListening(false);
      recognition.current = null;
      if (autoSend && heard.current.trim()) submit(heard.current);
    };
    recognition.current = rec;
    rec.start();
    setListening(true);
  }

  return (
    <section className="flex min-h-[70vh] flex-col overflow-hidden rounded-2xl border border-border bg-card lg:min-h-0">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wide text-muted">Buyer simulator</div>
          <div className="truncate font-semibold">
            {session.personaName} <span className="font-normal text-muted">· {session.personaTitle}</span>
          </div>
          <div className="mt-1 flex gap-1.5">
            <Badge>{difficultyLabel(session.difficulty)}</Badge>
            <Badge>{frameworkLabel(session.framework)}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {ttsSupported && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (voiceOut) stopSpeaking();
                onVoiceOutChange(!voiceOut);
              }}
              aria-pressed={voiceOut}
              title="Read buyer replies aloud"
            >
              {voiceOut ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
              <span className="hidden sm:inline">Voice {voiceOut ? "on" : "off"}</span>
            </Button>
          )}
          <Button variant="danger" size="sm" disabled={!canScore || scoring} onClick={onEndAndScore}>
            {scoring ? <Loader2 className="size-4 animate-spin" /> : <Flag className="size-4" />}
            {scoring ? "Scoring…" : "End & Score Session"}
          </Button>
        </div>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto p-4" aria-live="polite">
        {messages.map((m) => (
          <div key={m.id} className={cn("flex", m.role === "seller" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                m.role === "seller" ? "rounded-br-md bg-accent text-white" : "rounded-bl-md bg-background",
              )}
            >
              {m.role === "buyer" && (
                <div className="mb-0.5 text-xs font-medium text-muted">{session.personaName}</div>
              )}
              {m.content}
            </div>
          </div>
        ))}
        {buyerTyping && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Loader2 className="size-4 animate-spin" /> {session.personaName} is thinking…
          </div>
        )}
        {error && <p className="rounded-lg bg-bad/10 p-3 text-sm text-bad">{error}</p>}
        <div ref={bottom} />
      </div>

      <form
        className="border-t border-border p-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="flex items-end gap-2">
          {micSupported && (
            <Button
              type="button"
              variant={listening ? "danger" : "outline"}
              onClick={toggleMic}
              aria-pressed={listening}
              title={listening ? "Stop listening" : "Speak your reply"}
              className="shrink-0"
            >
              {listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
            </Button>
          )}
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={2}
            placeholder={listening ? "Listening…" : "Your reply to the buyer (Enter to send, Shift+Enter for a new line)"}
            className="min-h-10 flex-1 resize-none rounded-lg border border-border bg-background p-2.5 text-sm"
          />
          <Button type="submit" disabled={!draft.trim() || buyerTyping} className="shrink-0" aria-label="Send">
            <Send className="size-4" />
          </Button>
        </div>
        {micSupported && (
          <label className="mt-2 flex items-center gap-2 text-xs text-muted">
            <input type="checkbox" checked={autoSend} onChange={(e) => setAutoSend(e.target.checked)} />
            Send automatically when I stop the mic
          </label>
        )}
      </form>
    </section>
  );
}
