"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";

type Course = { title: string; slug: string; price: string; format: string; schedule: string; location: string };
type Reply = {
  reply: string;
  courses?: Course[];
  links?: { label: string; href: string }[];
  suggestions?: string[];
};
type Msg = { from: "user" | "bot"; text: string; data?: Reply };

const START: Msg = {
  from: "bot",
  text: "Hi, I’m the Skillhive assistant. Tell me what you want to learn and I’ll find courses, or ask me how anything works.",
  data: {
    reply: "",
    suggestions: ["Free online courses", "Leadership workshops", "Courses under $100", "How do I list a course?"],
  },
};

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([START]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [msgs, open, busy]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || busy) return;
    setInput("");
    setMsgs((m) => [...m, { from: "user", text: message }]);
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = (await res.json()) as Reply;
      setMsgs((m) => [...m, { from: "bot", text: data.reply, data }]);
    } catch {
      setMsgs((m) => [...m, { from: "bot", text: "I couldn’t reach the server. Please try again." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {open ? (
        <div
          role="dialog"
          aria-label="Skillhive assistant"
          className="hard fixed right-4 bottom-20 z-50 flex h-[32rem] max-h-[calc(100dvh-7rem)] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-xl bg-card"
        >
          <div className="flex items-center justify-between border-b-2 border-foreground bg-primary px-4 py-3 text-primary-foreground">
            <div>
              <p className="font-heading text-lg leading-none font-semibold">Skillhive assistant</p>
              <p className="mt-1 text-xs opacity-80">Finds courses · answers questions</p>
            </div>
            <button type="button" aria-label="Close chat" onClick={() => setOpen(false)} className="rounded p-1 hover:bg-black/15">
              <X className="size-5" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
            {msgs.map((m, i) => (
              <div key={i} className={m.from === "user" ? "flex justify-end" : "flex justify-start"}>
                <div className="max-w-[88%] space-y-2">
                  <div
                    className={
                      m.from === "user"
                        ? "rounded-xl rounded-br-sm border-2 border-foreground bg-clay px-3 py-2 text-sm text-clay-foreground"
                        : "rounded-xl rounded-bl-sm border-2 border-foreground bg-background px-3 py-2 text-sm text-foreground"
                    }
                  >
                    {m.text || m.data?.reply}
                  </div>

                  {m.data?.courses?.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/listings/${c.slug}`}
                      onClick={() => setOpen(false)}
                      className="block rounded-lg border-2 border-foreground bg-card p-3 text-sm transition-colors hover:bg-accent"
                    >
                      <p className="font-heading font-semibold">{c.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {c.format} · {c.location} · {c.schedule}
                      </p>
                      <p className="mt-1 text-xs font-bold text-primary">{c.price}</p>
                    </Link>
                  ))}

                  {m.data?.links?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {m.data.links.map((l) => (
                        <Link
                          key={l.href}
                          href={l.href}
                          onClick={() => setOpen(false)}
                          className="rounded-md border-2 border-foreground px-2.5 py-1 text-xs font-semibold text-primary hover:bg-foreground hover:text-background"
                        >
                          {l.label} →
                        </Link>
                      ))}
                    </div>
                  ) : null}

                  {i === msgs.length - 1 && m.from === "bot" && m.data?.suggestions?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {m.data.suggestions.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => send(s)}
                          className="rounded-full border-2 border-foreground/40 bg-background px-2.5 py-1 text-xs hover:border-foreground"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
            {busy ? (
              <div className="flex justify-start">
                <div className="rounded-xl border-2 border-foreground bg-background px-3 py-2 text-sm text-muted-foreground">
                  Thinking…
                </div>
              </div>
            ) : null}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
            className="flex gap-2 border-t-2 border-foreground p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={300}
              placeholder="Ask about a course or topic…"
              aria-label="Message"
              className="h-10 min-w-0 flex-1 rounded-lg border-2 border-foreground bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label="Send"
              className="flex size-10 items-center justify-center rounded-lg border-2 border-foreground bg-clay text-clay-foreground disabled:opacity-50"
            >
              <Send className="size-4" />
            </button>
          </form>
        </div>
      ) : null}

      <button
        type="button"
        aria-label={open ? "Close assistant" : "Open assistant"}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="hard-sm hard-hover fixed right-4 bottom-4 z-50 flex size-14 items-center justify-center rounded-full bg-clay text-clay-foreground"
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
      </button>
    </>
  );
}
