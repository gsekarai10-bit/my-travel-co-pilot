import { useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ItineraryItem, TimeSlot } from "@/lib/trips/types";
import { SLOTS } from "@/lib/trips/types";

interface Props {
  trigger: ReactNode;
  defaultSlot?: TimeSlot;
  dayNumber: number;
  onSubmit: (draft: Partial<ItineraryItem> & { time_slot: TimeSlot }) => Promise<void> | void;
}

const PLACE_TYPES = ["attraction", "restaurant", "cafe", "hotel", "activity", "transport", "shopping", "nature"];

export function ActivityFormDialog({ trigger, defaultSlot = "morning", dayNumber, onSubmit }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [slot, setSlot] = useState<TimeSlot>(defaultSlot);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [placeType, setPlaceType] = useState("attraction");
  const [address, setAddress] = useState("");
  const [startTime, setStartTime] = useState("");
  const [cost, setCost] = useState("");

  function reset() {
    setSlot(defaultSlot);
    setTitle("");
    setDescription("");
    setPlaceType("attraction");
    setAddress("");
    setStartTime("");
    setCost("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      await onSubmit({
        time_slot: slot,
        title: title.trim(),
        description: description.trim() || null,
        place_type: placeType,
        address: address.trim() || null,
        start_time: startTime || null,
        cost: cost ? Number(cost) : 0,
      });
      reset();
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) setSlot(defaultSlot); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add planned activity · Day {dayNumber}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="act-title">Title</Label>
            <Input id="act-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Eiffel Tower visit" autoFocus required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Time of day</Label>
              <Select value={slot} onValueChange={(v) => setSlot(v as TimeSlot)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SLOTS.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="act-start">Start time</Label>
              <Input id="act-start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={placeType} onValueChange={setPlaceType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLACE_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="act-cost">Cost ($)</Label>
              <Input id="act-cost" type="number" min="0" step="1" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="act-address">Address / location</Label>
            <Input id="act-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Optional" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="act-desc">Notes</Label>
            <Textarea id="act-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Optional details" />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={busy || !title.trim()} style={{ background: "var(--gradient-hero)" }}>
              {busy ? "Adding…" : "Add activity"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
