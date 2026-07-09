import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, MapPin, Plus, Sparkles, Wallet } from "lucide-react";

import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/travel/AppSidebar";
import { TripFormDialog } from "@/components/travel/TripFormDialog";
import { Timeline } from "@/components/travel/Timeline";
import { MapCanvas } from "@/components/travel/MapCanvas";
import { ChatFAB } from "@/components/travel/ChatFAB";
import { InspirationImport } from "@/components/travel/InspirationImport";
import { ReceiptUpload } from "@/components/travel/ReceiptUpload";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import type { ItineraryItem, Trip, TimeSlot } from "@/lib/trips/types";

export const Route = createFileRoute("/_authenticated/app/")({
  component: Workspace,
});

function Workspace() {
  const qc = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [dayNumber, setDayNumber] = useState(1);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const trips = useQuery({
    queryKey: ["trips", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("trips").select("*").order("start_date", { ascending: false });
      if (error) throw error;
      return data as Trip[];
    },
  });

  useEffect(() => {
    if (!selectedTripId && trips.data?.length) setSelectedTripId(trips.data[0].id);
  }, [trips.data, selectedTripId]);

  const trip = useMemo(() => trips.data?.find((t) => t.id === selectedTripId) ?? null, [trips.data, selectedTripId]);

  const items = useQuery({
    queryKey: ["items", selectedTripId],
    enabled: !!selectedTripId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("itinerary_items")
        .select("*")
        .eq("trip_id", selectedTripId!)
        .order("day_number")
        .order("time_slot")
        .order("order_index");
      if (error) throw error;
      return data as ItineraryItem[];
    },
  });

  const totalDays = useMemo(() => {
    if (!trip) return 1;
    const s = new Date(trip.start_date + "T00:00:00");
    const e = new Date(trip.end_date + "T00:00:00");
    return Math.max(1, Math.floor((e.getTime() - s.getTime()) / 86400000) + 1);
  }, [trip]);

  const spent = useMemo(
    () => (items.data ?? []).reduce((sum, i) => sum + (Number(i.cost) || 0), 0),
    [items.data],
  );

  // Add / delete
  const addItem = useMutation({
    mutationFn: async (input: { slot: TimeSlot; draft?: Partial<ItineraryItem> }) => {
      if (!trip || !userId) throw new Error("No trip selected");
      const { data, error } = await supabase
        .from("itinerary_items")
        .insert({
          trip_id: trip.id,
          user_id: userId,
          day_number: dayNumber,
          time_slot: input.slot,
          title: input.draft?.title ?? "New stop",
          description: input.draft?.description ?? null,
          place_type: input.draft?.place_type ?? "attraction",
          address: input.draft?.address ?? null,
          lat: input.draft?.lat ?? null,
          lng: input.draft?.lng ?? null,
          cover_photo_url: input.draft?.cover_photo_url ?? null,
          rating: input.draft?.rating ?? null,
          weather: input.draft?.weather ?? null,
          cost: input.draft?.cost ?? 0,
          start_time: input.draft?.start_time ?? null,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["items", selectedTripId] }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const removeItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("itinerary_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["items", selectedTripId] }),
  });

  async function confirmBooking() {
    if (!trip) return;
    setConfirming(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/bookings/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ trip_id: trip.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      if (data.delivered) toast.success(`Confirmation email sent to ${data.to}`);
      else toast.success(`Booking confirmed. (Email transport not configured — logged to console.)`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setConfirming(false);
    }
  }

  if (!userId) return <div className="grid h-screen place-items-center text-muted-foreground">Loading…</div>;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          {/* Header */}
          <header className="flex h-14 items-center gap-3 border-b border-border/60 bg-background/70 px-4 backdrop-blur">
            <SidebarTrigger />
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="size-4 text-primary" />
              <span className="font-semibold">{trip?.destination ?? "No trip"}</span>
              {trip && (
                <span className="text-muted-foreground">· {trip.start_date} → {trip.end_date} · {trip.vibe}</span>
              )}
            </div>
            <div className="ml-auto flex items-center gap-2">
              {trips.data && trips.data.length > 0 && (
                <Select value={selectedTripId ?? undefined} onValueChange={setSelectedTripId}>
                  <SelectTrigger className="h-9 w-[220px] text-sm">
                    <SelectValue placeholder="Select trip" />
                  </SelectTrigger>
                  <SelectContent>
                    {trips.data.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.destination}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <TripFormDialog
                userId={userId}
                onCreated={(id) => { setSelectedTripId(id); setDayNumber(1); }}
                trigger={
                  <Button size="sm" style={{ background: "var(--gradient-hero)" }}>
                    <Plus className="mr-1 size-4" /> New trip
                  </Button>
                }
              />
            </div>
          </header>

          {trip ? (
            <div className="grid flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
              {/* LEFT: timeline & tools */}
              <div className="flex min-h-0 flex-col border-r border-border/60">
                {/* Budget/vibe summary */}
                <div className="grid grid-cols-3 gap-2 border-b border-border/60 bg-card/40 p-3 text-xs">
                  <Stat label="Budget" value={`$${Number(trip.budget).toLocaleString()}`} icon={Wallet} />
                  <Stat label="Planned" value={`$${spent.toLocaleString()}`} />
                  <Stat label="Days" value={`${totalDays}`} />
                </div>

                <div className="min-h-0 flex-1 grid grid-rows-[1fr_auto]">
                  <Timeline
                    items={items.data ?? []}
                    dayNumber={dayNumber}
                    totalDays={totalDays}
                    activeItemId={activeItemId}
                    onHover={setActiveItemId}
                    onSelect={setActiveItemId}
                    onDelete={(id) => removeItem.mutate(id)}
                    onDayChange={setDayNumber}
                    onAdd={(slot) => addItem.mutate({ slot })}
                  />

                  <div className="space-y-3 border-t border-border/60 bg-card/40 p-3">
                    <InspirationImport onAppend={(draft) => addItem.mutate({ slot: (draft.time_slot as TimeSlot) ?? "afternoon", draft })} />
                    <ReceiptUpload />
                    <Button
                      onClick={confirmBooking}
                      disabled={confirming || !items.data?.length}
                      className="h-11 w-full text-base font-semibold"
                      style={{ background: "var(--gradient-hero)" }}
                    >
                      {confirming ? "Confirming…" : (<><Check className="mr-2 size-4" /> Complete booking / Confirm itinerary</>)}
                    </Button>
                  </div>
                </div>
              </div>

              {/* RIGHT: Map */}
              <div className="min-h-[400px] p-3 lg:min-h-0">
                <MapCanvas trip={trip} items={items.data ?? []} activeItemId={activeItemId} onSelect={setActiveItemId} />
              </div>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center p-10">
              <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
                <div className="mx-auto mb-4 grid size-12 place-items-center rounded-xl" style={{ background: "var(--gradient-hero)" }}>
                  <Sparkles className="size-6 text-white" />
                </div>
                <h2 className="text-lg font-semibold">Let's plan your first trip</h2>
                <p className="mt-1 text-sm text-muted-foreground">Give us a destination, dates and a vibe — the AI takes it from there.</p>
                <div className="mt-4">
                  <TripFormDialog userId={userId} trigger={<Button style={{ background: "var(--gradient-hero)" }}>Create a trip</Button>} />
                </div>
              </div>
            </div>
          )}
        </SidebarInset>
      </div>
      <ChatFAB trip={trip} items={items.data ?? []} />
    </SidebarProvider>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof Wallet }) {
  return (
    <div className="rounded-lg bg-card px-3 py-2">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
        {Icon && <Icon className="size-3" />} {label}
      </div>
      <div className="text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}
