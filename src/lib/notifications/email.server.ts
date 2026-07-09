/**
 * Booking-confirmation email transport.
 *
 * This helper is intentionally structured like a Nodemailer / Resend transport
 * so you can drop in credentials and go live:
 *
 *   - Set RESEND_API_KEY in the project secrets and it will use Resend's API.
 *   - Otherwise it logs the payload (safe default for preview/dev builds).
 *
 * Called by the /api/bookings/confirm server route.
 */

export interface BookingEmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendBookingEmail(payload: BookingEmailPayload): Promise<{ delivered: boolean; provider: string; id?: string }> {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const FROM = process.env.EMAIL_FROM ?? "myTravelGo <onboarding@resend.dev>";

  if (RESEND_API_KEY) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Resend send failed [${res.status}]: ${body}`);
    }
    const data = (await res.json()) as { id?: string };
    return { delivered: true, provider: "resend", id: data.id };
  }

  console.info("[email] would send", { to: payload.to, subject: payload.subject });
  return { delivered: false, provider: "console" };
}

export function renderBookingEmail(input: {
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  vibe: string;
  items: Array<{ day: number; slot: string; time: string | null; title: string; address: string | null }>;
}): { subject: string; html: string; text: string } {
  const subject = `Your ${input.destination} trip is confirmed`;
  const rows = input.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 8px;color:#64748b;font-size:12px;">Day ${i.day} · ${i.slot}${i.time ? " · " + i.time : ""}</td><td style="padding:6px 8px;font-size:14px;">${escape(i.title)}${i.address ? `<div style="font-size:12px;color:#64748b;">${escape(i.address)}</div>` : ""}</td></tr>`,
    )
    .join("");
  const html = `<!doctype html><html><body style="font-family:ui-sans-serif,system-ui;padding:24px;background:#f8fafc;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
      <div style="padding:24px;background:linear-gradient(135deg,#0891b2,#f97316);color:#fff;">
        <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;opacity:.85;">myTravelGo · Booking confirmed</div>
        <div style="font-size:24px;font-weight:700;margin-top:6px;">${escape(input.destination)}</div>
        <div style="font-size:14px;margin-top:4px;">${input.startDate} → ${input.endDate} · ${escape(input.vibe)}</div>
      </div>
      <div style="padding:20px 24px;">
        <div style="font-size:14px;color:#64748b;margin-bottom:12px;">Budget: $${input.budget.toLocaleString()}</div>
        <table style="width:100%;border-collapse:collapse;">${rows}</table>
        <div style="margin-top:24px;font-size:12px;color:#94a3b8;">Sent by myTravelGo · Reply to this email with any changes.</div>
      </div>
    </div>
  </body></html>`;
  const text =
    `myTravelGo — ${input.destination}\n${input.startDate} → ${input.endDate}\nBudget: $${input.budget}\n\n` +
    input.items.map((i) => `Day ${i.day} · ${i.slot}${i.time ? " · " + i.time : ""} — ${i.title}`).join("\n");
  return { subject, html, text };
}

function escape(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
