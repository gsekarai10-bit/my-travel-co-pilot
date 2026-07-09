import { createFileRoute } from "@tanstack/react-router";
import { sendWhatsAppAlert } from "@/lib/notifications/whatsapp.server";

/**
 * Daily WhatsApp digest — scheduled by pg_cron.
 *
 * Runs once a day; for every user with a trip covering tomorrow, compiles that
 * day's itinerary and calls sendWhatsAppAlert(phone, summary). This is the
 * production replacement for a node-cron background runner (which cannot run
 * on the Workers runtime this app deploys to).
 *
 * Public route (`/api/public/*`) — bypasses auth on published sites; secured by
 * checking the Supabase publishable key in the `apikey` header, which pg_cron
 * supplies via `net.http_post`.
 */

export const Route = createFileRoute("/api/public/hooks/whatsapp-alerts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get("apikey");
        if (!apikey || apikey !== process.env.SUPABASE_PUBLISHABLE_KEY) {
          return json({ error: "Forbidden" }, 403);
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 86400000);
        const tomorrowISO = tomorrow.toISOString().slice(0, 10);

        const { data: trips, error } = await supabaseAdmin
          .from("trips")
          .select("id,user_id,destination,start_date,end_date")
          .lte("start_date", tomorrowISO)
          .gte("end_date", tomorrowISO);

        if (error) return json({ error: error.message }, 500);

        let sent = 0;
        const results: Array<{ trip_id: string; delivered: boolean; provider: string }> = [];

        for (const trip of trips ?? []) {
          const start = new Date(trip.start_date + "T00:00:00");
          const dayNumber = Math.floor((tomorrow.getTime() - start.getTime()) / 86400000) + 1;
          if (dayNumber < 1) continue;

          const [{ data: items }, { data: settings }] = await Promise.all([
            supabaseAdmin
              .from("itinerary_items")
              .select("time_slot,start_time,title,address")
              .eq("trip_id", trip.id)
              .eq("day_number", dayNumber)
              .order("time_slot")
              .order("order_index"),
            supabaseAdmin
              .from("user_settings")
              .select("whatsapp_number,whatsapp_notifications")
              .eq("user_id", trip.user_id)
              .maybeSingle(),
          ]);

          if (!settings?.whatsapp_notifications || !settings.whatsapp_number) continue;
          if (!items?.length) continue;

          const summary =
            `🌍 myTravelGo — Tomorrow in ${trip.destination} (Day ${dayNumber})\n\n` +
            items
              .map(
                (i) =>
                  `• ${cap(i.time_slot)}${i.start_time ? ` ${i.start_time}` : ""} — ${i.title}${i.address ? ` (${i.address})` : ""}`,
              )
              .join("\n");

          try {
            const res = await sendWhatsAppAlert(settings.whatsapp_number, summary);
            results.push({ trip_id: trip.id, delivered: res.delivered, provider: res.provider });
            if (res.delivered) sent++;
          } catch (err) {
            console.error("[whatsapp-alerts] send failed", err);
            results.push({ trip_id: trip.id, delivered: false, provider: "error" });
          }
        }

        return json({ ok: true, checked: trips?.length ?? 0, sent, results });
      },
    },
  },
});

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json" } });
}
