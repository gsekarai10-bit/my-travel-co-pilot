import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { renderBookingEmail, sendBookingEmail } from "@/lib/notifications/email.server";

const BodySchema = z.object({ trip_id: z.string().uuid() });

export const Route = createFileRoute("/api/bookings/confirm")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = request.headers.get("authorization");
        if (!auth?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

        let body;
        try {
          body = BodySchema.parse(await request.json());
        } catch (e) {
          return json({ error: "Invalid request", detail: (e as Error).message }, 400);
        }

        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
          global: { headers: { Authorization: auth } },
          auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
        });

        const { data: userRes, error: userErr } = await supabase.auth.getUser();
        if (userErr || !userRes.user) return json({ error: "Unauthorized" }, 401);

        const { data: trip, error: tErr } = await supabase.from("trips").select("*").eq("id", body.trip_id).maybeSingle();
        if (tErr || !trip) return json({ error: "Trip not found" }, 404);

        const { data: items } = await supabase
          .from("itinerary_items")
          .select("day_number,time_slot,start_time,title,address")
          .eq("trip_id", trip.id)
          .order("day_number")
          .order("time_slot")
          .order("order_index");

        const { data: settings } = await supabase.from("user_settings").select("notification_email").maybeSingle();
        const to = settings?.notification_email || userRes.user.email;
        if (!to) return json({ error: "No email on file" }, 400);

        const rendered = renderBookingEmail({
          destination: trip.destination,
          startDate: trip.start_date,
          endDate: trip.end_date,
          budget: Number(trip.budget) || 0,
          vibe: trip.vibe,
          items: (items ?? []).map((i) => ({
            day: i.day_number,
            slot: i.time_slot,
            time: i.start_time,
            title: i.title,
            address: i.address,
          })),
        });

        let delivered = false;
        let provider = "console";
        try {
          const send = await sendBookingEmail({ to, subject: rendered.subject, html: rendered.html, text: rendered.text });
          delivered = send.delivered;
          provider = send.provider;
        } catch (err) {
          console.error("[bookings/confirm] send error", err);
        }

        const summary = `Confirmed ${trip.destination} · ${trip.start_date}→${trip.end_date} · ${items?.length ?? 0} stops`;
        await supabase.from("bookings").insert({
          trip_id: trip.id,
          user_id: userRes.user.id,
          summary,
          confirmation_email: to,
        });

        return json({ ok: true, delivered, provider, to, summary });
      },
    },
  },
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}
