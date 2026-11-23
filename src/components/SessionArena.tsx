"use client";

import type { CoachHint } from "@/lib/schemas";
import { speak } from "@/lib/speech";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChatArena, type ChatMessage } from "./ChatArena";
import { LiveCoachSidebar, type HintEntry } from "./LiveCoachSidebar";

export type ArenaSession = {
  id: string;
  title: string;
  personaName: string;
  personaTitle: string;
  difficulty: string;
  framework: string;
  speechLang: string;
};

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data as T;
}

/** Split-screen arena: buyer roleplay on the left, live coach on the right. */
export function SessionArena({
  session,
  initialMessages,
  initialHints,
}: {
  session: ArenaSession;
  initialMessages: ChatMessage[];
  initialHints: HintEntry[];
}) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [hints, setHints] = useState(initialHints);
  const [buyerTyping, setBuyerTyping] = useState(false);
  const [coachThinking, setCoachThinking] = useState(false);
  const [coachOn, setCoachOn] = useState(true);
  const [voiceOut, setVoiceOut] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const opened = useRef(false);
  const coachOnRef = useRef(coachOn);
  const voiceOutRef = useRef(voiceOut);

  useEffect(() => {
    coachOnRef.current = coachOn;
    voiceOutRef.current = voiceOut;
  }, [coachOn, voiceOut]);

  const fetchHint = useCallback(async () => {
    if (!coachOnRef.current) return;
    setCoachThinking(true);
    try {
      const { messageId, hint } = await post<{ messageId: string; hint: CoachHint }>("/api/hint", {
        sessionId: session.id,
      });
      setHints((h) => [...h.filter((x) => x.messageId !== messageId), { messageId, hint }]);
    } catch (err) {
      // Coaching is best-effort; never block the conversation on it.
      console.warn("coach hint failed", err);
    } finally {
      setCoachThinking(false);
    }
  }, [session.id]);

  const askBuyer = useCallback(
    async (message?: string) => {
      setError(null);
      setBuyerTyping(true);
      try {
        const { message: reply } = await post<{ message: ChatMessage }>("/api/roleplay", {
          sessionId: session.id,
          message,
        });
        setMessages((m) => [...m, reply]);
        if (voiceOutRef.current) speak(reply.content, session.speechLang);
        void fetchHint();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setBuyerTyping(false);
      }
    },
    [session.id, session.speechLang, fetchHint],
  );

  // The buyer opens the meeting when the transcript is empty.
  useEffect(() => {
    if (opened.current || initialMessages.length > 0) return;
    opened.current = true;
    void askBuyer();
  }, [askBuyer, initialMessages.length]);

  function send(text: string) {
    const optimistic: ChatMessage = {
      id: `local-${Date.now()}`,
      role: "seller",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimistic]);
    void askBuyer(text);
  }

  async function endAndScore() {
    setScoring(true);
    setError(null);
    try {
      await post("/api/evaluate", { sessionId: session.id });
      router.push(`/scorecard/${session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setScoring(false);
    }
  }

  const sellerTurns = messages.filter((m) => m.role === "seller").length;

  return (
    <div className="grid gap-4 lg:h-[calc(100vh-9rem)] lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <ChatArena
        session={session}
        messages={messages}
        buyerTyping={buyerTyping}
        error={error}
        onSend={send}
        voiceOut={voiceOut}
        onVoiceOutChange={setVoiceOut}
        canScore={sellerTurns > 0 && !buyerTyping}
        scoring={scoring}
        onEndAndScore={endAndScore}
      />
      <LiveCoachSidebar
        hints={hints}
        thinking={coachThinking}
        enabled={coachOn}
        onToggle={setCoachOn}
        framework={session.framework}
      />
    </div>
  );
}
