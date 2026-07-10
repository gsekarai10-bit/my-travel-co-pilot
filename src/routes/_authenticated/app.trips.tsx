import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, MapPin, Plus, Sparkles, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";

import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/travel/AppSidebar";
import { TripFormDialog } from "@/components/travel/TripFormDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import type { Trip } from "@/lib/trips/types";

export const Route = createFileRoute("/_authenticated/app/trips")({
  component: TripsPage,
});

function TripsPage() {
  const qc = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const trips = useQuery({
    queryKey: ["trips", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data as Trip[];
    },
  });

  const removeTrip = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("trips").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Trip deleted");
      qc.invalidateQueries({ queryKey: ["trips", userId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-14 items-center gap-3 border-b border-border/60 bg-background/70 px-4 backdrop-blur">
            <SidebarTrigger />
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="size-4 text-primary" />
              <span className="font-semibold">Your trips</span>
              {trips.data && (
                <span className="text-muted-foreground">· {trips.data.length} total</span>
              )}
            </div>
            <div className="ml-auto">
              {userId && (
                <TripFormDialog
                  userId={userId}
                  trigger={
                    <Button size="sm" style={{ background: "var(--gradient-hero)" }}>
                      <Plus className="mr-1 size-4" /> New trip
                    </Button>
                  }
                />
              )}
            </div>
          </header>

          <div className="p-6">
            {trips.isLoading ? (
              <div className="text-sm text-muted-foreground">Loading trips…</div>
            ) : !trips.data?.length ? (
              <EmptyState userId={userId} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {trips.data.map((trip) => (
                  <TripCard key={trip.id} trip={trip} onDelete={(id) => removeTrip.mutate(id)} />
                ))}
              </div>
            )}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function TripCard({ trip, onDelete }: { trip: Trip; onDelete: (id: string) => void }) {
  const days = Math.max(
    1,
    Math.floor(
      (new Date(trip.end_date + "T00:00:00").getTime() -
        new Date(trip.start_date + "T00:00:00").getTime()) /
        86400000,
    ) + 1,
  );

  return (
    <div className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-md">
      <div
        className="relative h-32 w-full"
        style={{
          background: trip.cover_photo_url
            ? `url(${trip.cover_photo_url}) center/cover`
            : "var(--gradient-hero)",
        }}
      >
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between text-white">
          <div>
            <div className="text-xs uppercase tracking-wide opacity-80">{trip.vibe}</div>
            <div className="text-lg font-semibold leading-tight">{trip.destination}</div>
          </div>
          <Badge variant="secondary" className="bg-white/90 text-foreground">
            {days}d
          </Badge>
        </div>
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="size-3.5" />
          {trip.start_date} → {trip.end_date}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Wallet className="size-3.5" />${Number(trip.budget).toLocaleString()} budget
        </div>
        <div className="flex gap-2 pt-1">
          <Button asChild size="sm" className="flex-1" style={{ background: "var(--gradient-hero)" }}>
            <Link to="/app">Open</Link>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (confirm(`Delete trip to ${trip.destination}? This removes its itinerary too.`))
                onDelete(trip.id);
            }}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ userId }: { userId: string | null }) {
  return (
    <div className="mx-auto mt-16 max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
      <div
        className="mx-auto mb-4 grid size-12 place-items-center rounded-xl"
        style={{ background: "var(--gradient-hero)" }}
      >
        <Sparkles className="size-6 text-white" />
      </div>
      <h2 className="text-lg font-semibold">No trips yet</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Plan your first destination and it will show up here.
      </p>
      {userId && (
        <div className="mt-4">
          <TripFormDialog
            userId={userId}
            trigger={
              <Button style={{ background: "var(--gradient-hero)" }}>Create a trip</Button>
            }
          />
        </div>
      )}
    </div>
  );
}
