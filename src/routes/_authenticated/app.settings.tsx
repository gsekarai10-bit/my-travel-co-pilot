import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Bell, Loader2, Mail, MessageSquare, Save } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/travel/AppSidebar";

export const Route = createFileRoute("/_authenticated/app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [emailOn, setEmailOn] = useState(true);
  const [waOn, setWaOn] = useState(true);

  useEffect(() => {
    supabase.from("user_settings").select("*").maybeSingle().then(({ data }) => {
      if (data) {
        setEmail(data.notification_email ?? "");
        setPhone(data.whatsapp_number ?? "");
        setEmailOn(data.email_notifications);
        setWaOn(data.whatsapp_notifications);
      }
      setLoading(false);
    });
  }, []);

  async function save() {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("user_settings").upsert({
        user_id: user.id,
        notification_email: email || null,
        whatsapp_number: phone || null,
        email_notifications: emailOn,
        whatsapp_notifications: waOn,
      });
      if (error) throw error;
      toast.success("Saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-14 items-center gap-3 border-b border-border/60 px-4">
            <SidebarTrigger />
            <Link to="/app" className="text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-1 inline size-4" /> Back to workspace
            </Link>
          </header>

          <main className="mx-auto w-full max-w-2xl p-6">
            <h1 className="text-2xl font-semibold tracking-tight">Notification preferences</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              We use these for the day-before WhatsApp digest and your booking confirmation email.
            </p>

            {loading ? (
              <div className="mt-8 grid place-items-center text-muted-foreground">
                <Loader2 className="size-5 animate-spin" />
              </div>
            ) : (
              <div className="mt-6 space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
                <Row icon={Mail} title="Email confirmations" description="Get a rich summary emailed when you confirm an itinerary.">
                  <Switch checked={emailOn} onCheckedChange={setEmailOn} />
                </Row>
                <div>
                  <Label htmlFor="email">Notification email</Label>
                  <Input id="email" type="email" className="mt-1" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
                </div>

                <div className="border-t border-border pt-6">
                  <Row icon={MessageSquare} title="WhatsApp reminders" description="Automatic daily digest the evening before your travel day.">
                    <Switch checked={waOn} onCheckedChange={setWaOn} />
                  </Row>
                  <div className="mt-3">
                    <Label htmlFor="phone">WhatsApp number</Label>
                    <Input id="phone" className="mt-1" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+15558675310" />
                    <p className="mt-1 text-xs text-muted-foreground">Include country code, e.g. +1, +44.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                  <Bell className="size-4 shrink-0 text-primary" />
                  <div>
                    A scheduled server task checks every user's next-day itinerary. Set Twilio credentials in project secrets to
                    activate real WhatsApp delivery — otherwise sends are logged to the server console.
                  </div>
                </div>

                <Button onClick={save} disabled={saving} className="w-full" style={{ background: "var(--gradient-hero)" }}>
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <><Save className="mr-2 size-4" /> Save preferences</>}
                </Button>
              </div>
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function Row({ icon: Icon, title, description, children }: { icon: typeof Mail; title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
          <Icon className="size-4" />
        </div>
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
      </div>
      {children}
    </div>
  );
}
