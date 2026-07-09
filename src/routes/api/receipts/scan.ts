import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/**
 * Receipt / ticket parser — MOCK.
 *
 * Accepts a filename hint and returns synthesized flight/hotel metadata that
 * the UI can drop into a booking overview card. Wire to a real OCR service
 * (Textract, DocumentAI, Mindee) when moving to production.
 */

const BodySchema = z.object({ filename: z.string().min(1), kind: z.enum(["flight", "hotel", "generic"]).default("generic") });

export const Route = createFileRoute("/api/receipts/scan")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body;
        try {
          body = BodySchema.parse(await request.json());
        } catch (e) {
          return json({ error: "Invalid request", detail: (e as Error).message }, 400);
        }

        const isFlight = body.kind === "flight" || /flight|boarding|ticket/i.test(body.filename);
        const isHotel = body.kind === "hotel" || /hotel|reserv|checkin/i.test(body.filename);

        if (isFlight) {
          return json({
            kind: "flight",
            flight_number: "UA 837",
            airline: "United",
            from: "SFO",
            to: "NRT",
            depart_at: "2026-08-14T11:30:00-07:00",
            arrive_at: "2026-08-15T15:20:00+09:00",
            seat: "24A",
            confirmation: "ABC123",
          });
        }
        if (isHotel) {
          return json({
            kind: "hotel",
            hotel_name: "Park Hotel Tokyo",
            check_in: "2026-08-15",
            check_out: "2026-08-20",
            address: "1-7-1 Higashi-Shimbashi, Minato, Tokyo",
            confirmation: "HTL-778812",
          });
        }
        return json({ kind: "generic", note: "Could not classify receipt. Try renaming the file." });
      },
    },
  },
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json" } });
}
