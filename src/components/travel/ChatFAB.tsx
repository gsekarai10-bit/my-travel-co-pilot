import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, Sparkles, X, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import type { ItineraryItem, Trip } from "@/lib/trips/types";

interface Msg { role: "user" | "assistant"; content: string; }

interface Props {
  trip: Trip | null;
  items: ItineraryItem[];
}

export function ChatFAB({ trip, items }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi — I'm your **myTravelGo Co-Pilot**. Ask me anything about your trip, budget, or ideas to add." },
  ]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending, open]);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || pending) return;
    setInput("");
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setPending(true);

    const context = trip
      ? {
          destination: trip.destination,
          startDate: trip.start_date,
          endDate: trip.end_date,
          budget: Number(trip.budget),
          spent: Number(trip.spent),
          vibe: trip.vibe,
          today: new Date().toISOString().slice(0, 10),
          itinerary: items.map((i) => ({
            day: i.day_number,
            slot: i.time_slot,
            time: i.start_time,
            title: i.title,
            address: i.address,
            cost: i.cost,
          })),
        }
      : { today: new Date().toISOString().slice(0, 10) };

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, context }),
      });
      const data = (await res.json()) as { content?: string; error?: string };
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      setMessages((m) => [...m, { role: "assistant", content: data.content ?? "" }]);
    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", content: `⚠️ ${err instanceof Error ? err.message : "Something went wrong."}` }]);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 grid size-14 place-items-center rounded-full text-white shadow-xl transition-transform hover:scale-105"
          style={{ background: "var(--gradient-hero)", boxShadow: "var(--shadow-glow)" }}
          aria-label="Open Co-Pilot"
        >
          <MessageCircle className="size-6" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-40 flex h-[560px] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <header className="flex items-center justify-between border-b border-border/60 px-4 py-3" style={{ background: "var(--gradient-hero)" }}>
            <div className="flex items-center gap-2 text-white">
              <Sparkles className="size-4" />
              <div>
                <div className="text-sm font-semibold">myTravelGo Co-Pilot</div>
                <div className="text-[10px] opacity-80">Context-aware · Gemini 2.5 Flash</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-md p-1 text-white/80 hover:bg-white/10">
              <X className="size-4" />
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4 myt-scrollbar">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`prose prose-sm max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "rounded-br-sm bg-primary text-primary-foreground [&_*]:text-primary-foreground"
                      : "rounded-bl-sm bg-muted text-foreground"
                  }`}
                >
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              </div>
            ))}
            {pending && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-muted px-3 py-2.5 text-muted-foreground">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            )}
          </div>

          <form onSubmit={send} className="border-t border-border/60 p-3">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
                }}
                rows={1}
                placeholder={trip ? `Ask about ${trip.destination}…` : "Ask me anything about your trip…"}
                className="max-h-32 min-h-9 flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
              />
              <Button type="submit" size="icon" disabled={pending || !input.trim()} className="size-9 shrink-0" style={{ background: "var(--gradient-hero)" }}>
                {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
