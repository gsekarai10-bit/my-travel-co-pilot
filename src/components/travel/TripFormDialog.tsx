import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarRange, Loader2, MapPin, Wallet } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { VIBES, type TripVibe } from "@/lib/trips/types";

interface Props {
  userId: string;
  trigger?: React.ReactNode;
  onCreated?: (tripId: string) => void;
}

export function TripFormDialog({ userId, trigger, onCreated }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [destination, setDestination] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [budget, setBudget] = useState(1500);
  const [vibe, setVibe] = useState<TripVibe>("Adventure");

  const create = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .insert({
          user_id: userId,
          destination,
          start_date: start,
          end_date: end,
          budget,
          vibe,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ["trips"] });
      toast.success("Trip created");
      setOpen(false);
      setDestination(""); setStart(""); setEnd(""); setBudget(1500); setVibe("Adventure");
      onCreated?.(id);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? <Button size="sm">New trip</Button>}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Plan a new trip</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!destination || !start || !end) return toast.error("Fill destination and dates");
            create.mutate();
          }}
        >
          <div>
            <Label htmlFor="dest">Destination</Label>
            <div className="relative mt-1">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="dest" className="pl-9" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Tokyo, Japan" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="start">Start</Label>
              <div className="relative mt-1">
                <CalendarRange className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="start" type="date" className="pl-9" value={start} onChange={(e) => setStart(e.target.value)} required />
              </div>
            </div>
            <div>
              <Label htmlFor="end">End</Label>
              <div className="relative mt-1">
                <CalendarRange className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="end" type="date" className="pl-9" value={end} onChange={(e) => setEnd(e.target.value)} required min={start || undefined} />
              </div>
            </div>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>Budget</Label>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
                <Wallet className="size-3.5" /> ${budget.toLocaleString()}
              </span>
            </div>
            <Slider value={[budget]} min={200} max={15000} step={100} onValueChange={(v) => setBudget(v[0])} />
          </div>
          <div>
            <Label className="mb-2 block">Trip vibe</Label>
            <div className="grid grid-cols-4 gap-2">
              {VIBES.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVibe(v)}
                  className={`rounded-lg border px-2 py-2 text-sm font-medium transition-colors ${
                    vibe === v ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-accent"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <Button type="submit" disabled={create.isPending} className="w-full" style={{ background: "var(--gradient-hero)" }}>
            {create.isPending ? <Loader2 className="size-4 animate-spin" /> : "Create trip"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
