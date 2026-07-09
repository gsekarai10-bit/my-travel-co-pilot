import { createFileRoute, Link } from "@tanstack/react-router";
import { Compass, MapPin, Sparkles, MessageCircle, Bell, Mail } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/60 bg-background/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-lg" style={{ background: "var(--gradient-hero)" }}>
              <Compass className="size-5 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight">myTravelGo</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Sign in
            </Link>
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="inline-flex h-9 items-center rounded-md px-4 text-sm font-medium text-primary-foreground shadow-sm transition-transform hover:scale-[1.02]"
              style={{ background: "var(--gradient-hero)" }}
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 pt-20 pb-24 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="size-3.5" /> AI travel co-pilot
          </span>
          <h1 className="mt-6 text-5xl font-bold tracking-tight md:text-6xl">
            Plan trips on a{" "}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-hero)" }}>
              living map
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
            Chat with an AI that knows your budget, dates and vibe. See it come alive as a day-by-day timeline
            beside an interactive map — with automatic WhatsApp reminders and email confirmations.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="inline-flex h-11 items-center gap-2 rounded-lg px-6 text-base font-semibold text-primary-foreground shadow-lg"
              style={{ background: "var(--gradient-hero)", boxShadow: "var(--shadow-glow)" }}
            >
              Start planning free
            </Link>
            <Link
              to="/auth"
              className="inline-flex h-11 items-center rounded-lg border border-border bg-card px-6 text-base font-semibold"
            >
              I already have an account
            </Link>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: MapPin, title: "Map-first workspace", desc: "Day-by-day timeline next to a live map. Hover a stop, watch it pin." },
            { icon: MessageCircle, title: "Context-aware AI", desc: "Every message carries your budget, spend, dates and full itinerary." },
            { icon: Bell, title: "WhatsApp reminders", desc: "Automatic daily digests the evening before your next travel day." },
            { icon: Mail, title: "Booking confirmations", desc: "One click to lock the plan and email a rich summary to yourself." },
            { icon: Sparkles, title: "Inspiration import", desc: "Paste a TikTok, Reel or article URL — get a clean place card." },
            { icon: Compass, title: "Smart routing", desc: "Ask about non-red-eye flights or budget math — the AI knows what to do." },
          ].map((f) => (
            <div key={f.title} className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="mb-3 grid size-10 place-items-center rounded-lg bg-accent text-accent-foreground">
                <f.icon className="size-5" />
              </div>
              <h3 className="text-base font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/60 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} myTravelGo · Built with an AI co-pilot
      </footer>
    </div>
  );
}
