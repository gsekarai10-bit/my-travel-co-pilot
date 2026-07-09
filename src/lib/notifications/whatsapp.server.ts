/**
 * WhatsApp alert transport (Twilio Messaging API).
 *
 * Structured so a token can be plugged in easily for production:
 *   - TWILIO_ACCOUNT_SID
 *   - TWILIO_AUTH_TOKEN
 *   - TWILIO_WHATSAPP_FROM  (e.g. "whatsapp:+14155238886")
 *
 * When any of those are missing, the helper logs what it would send and returns
 * { delivered: false, provider: "console" } — safe for preview/dev.
 */

export async function sendWhatsAppAlert(
  phoneNumber: string,
  scheduleSummary: string,
): Promise<{ delivered: boolean; provider: string; sid?: string }> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!sid || !token || !from) {
    console.info("[whatsapp] would send", { to: phoneNumber, summary: scheduleSummary.slice(0, 120) });
    return { delivered: false, provider: "console" };
  }

  const to = phoneNumber.startsWith("whatsapp:") ? phoneNumber : `whatsapp:${phoneNumber}`;
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: to, From: from, Body: scheduleSummary }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Twilio send failed [${res.status}]: ${body}`);
  }
  const data = (await res.json()) as { sid?: string };
  return { delivered: true, provider: "twilio", sid: data.sid };
}
