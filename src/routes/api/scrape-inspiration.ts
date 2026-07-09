import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/**
 * Inspiration parser — MOCK.
 *
 * Accepts a social/article URL and returns a synthesized place card the client
 * can append to the itinerary. In production, wire this to a real scraper or
 * an oEmbed/OG endpoint per platform (TikTok, Instagram, YouTube, Medium, etc.).
 */

const BodySchema = z.object({ url: z.string().url(), note: z.string().max(500).optional() });

export const Route = createFileRoute("/api/scrape-inspiration")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body;
        try {
          body = BodySchema.parse(await request.json());
        } catch (e) {
          return json({ error: "Invalid URL", detail: (e as Error).message }, 400);
        }

        const host = safeHost(body.url);
        const platform = detectPlatform(host);

        const seed = hash(body.url);
        const pool = [
          { title: "Blue Bottle Coffee — Kiyosumi", place_type: "cafe", address: "1-4-8 Hirano, Koto, Tokyo", weather: "☀️ 22°C" },
          { title: "Teamlab Planets", place_type: "attraction", address: "6-1-16 Toyosu, Koto, Tokyo", weather: "🌤 20°C" },
          { title: "Golden Gai back alleys", place_type: "nightlife", address: "1 Chome Kabukicho, Shinjuku", weather: "🌙 18°C" },
          { title: "Fushimi Inari sunrise hike", place_type: "attraction", address: "68 Fukakusa Yabunouchicho, Kyoto", weather: "⛅ 17°C" },
          { title: "Cala Comte beach club", place_type: "beach", address: "Sant Josep, Ibiza", weather: "☀️ 27°C" },
          { title: "Sao Bento pastry crawl", place_type: "food", address: "Rua das Flores, Porto", weather: "☀️ 24°C" },
        ];
        const p = pool[seed % pool.length];

        return json({
          card: {
            source: { url: body.url, platform, host },
            title: p.title,
            description: body.note ?? `Imported from ${platform}. Add to a day to lock coordinates & timing.`,
            place_type: p.place_type,
            address: p.address,
            weather: p.weather,
            rating: 4 + ((seed % 10) / 10),
            cover_photo_url: `https://picsum.photos/seed/${platform}-${seed}/800/500`,
            open_hours: null,
          },
        });
      },
    },
  },
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json" } });
}
function safeHost(u: string) { try { return new URL(u).host; } catch { return "unknown"; } }
function detectPlatform(host: string) {
  if (host.includes("tiktok")) return "TikTok";
  if (host.includes("instagram")) return "Instagram";
  if (host.includes("youtube") || host.includes("youtu.be")) return "YouTube";
  if (host.includes("medium")) return "Medium";
  return "Web";
}
function hash(s: string) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); }
