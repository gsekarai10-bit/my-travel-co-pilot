import { useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ItineraryItem, TimeSlot } from "@/lib/trips/types";
import { SLOTS } from "@/lib/trips/types";
import { NearbyPlacesBrowser, type NearbyPlace, type OsmFilter } from "./NearbyPlacesBrowser";

interface Props {
  trigger: ReactNode;
  defaultSlot?: TimeSlot;
  dayNumber: number;
  originLat?: number | null;
  originLng?: number | null;
  originName?: string | null;
  onSubmit: (draft: Partial<ItineraryItem> & { time_slot: TimeSlot }) => Promise<void> | void;
}

const PLACE_TYPES = ["attraction", "restaurant", "cafe", "hotel", "activity", "transport", "shopping", "nature"];

const TITLE_SUGGESTIONS: Record<string, string[]> = {
  attraction: ["City walking tour", "Museum visit", "Historic landmark", "Scenic viewpoint", "Art gallery", "Guided sightseeing"],
  restaurant: ["Local cuisine dinner", "Fine dining experience", "Street food tour", "Rooftop restaurant", "Traditional lunch", "Seafood dinner"],
  cafe: ["Morning coffee stop", "Brunch at local cafe", "Dessert & pastries", "Specialty coffee tasting", "Tea house visit"],
  hotel: ["Hotel check-in", "Hotel check-out", "Spa & wellness session", "Pool & lounge time", "Breakfast at hotel"],
  activity: ["Kayaking adventure", "Hiking excursion", "Bike tour", "Cooking class", "Yoga session", "Boat cruise", "Snorkeling trip"],
  transport: ["Airport transfer", "Train to next city", "Car rental pickup", "Ferry crossing", "Taxi to venue", "Metro day pass"],
  shopping: ["Local market visit", "Souvenir shopping", "Boutique browsing", "Mall shopping trip", "Artisan crafts market"],
  nature: ["National park visit", "Beach afternoon", "Mountain viewpoint", "Botanical garden", "Sunset watching", "Nature reserve walk"],
};

const FILTER_MAP: Record<string, OsmFilter[]> = {
  restaurant: [{ key: "amenity", value: "restaurant" }],
  cafe: [{ key: "amenity", value: "cafe" }],
  attraction: [
    { key: "tourism", value: "attraction" },
    { key: "tourism", value: "museum" },
    { key: "tourism", value: "gallery" },
    { key: "tourism", value: "viewpoint" },
    { key: "historic" },
  ],
  hotel: [
    { key: "tourism", value: "hotel" },
    { key: "tourism", value: "hostel" },
    { key: "tourism", value: "guest_house" },
  ],
  activity: [
    { key: "leisure", value: "sports_centre" },
    { key: "leisure", value: "fitness_centre" },
    { key: "leisure", value: "water_park" },
    { key: "sport" },
    { key: "tourism", value: "theme_park" },
  ],
  transport: [
    { key: "railway", value: "station" },
    { key: "amenity", value: "bus_station" },
    { key: "aeroway", value: "aerodrome" },
    { key: "amenity", value: "taxi" },
    { key: "amenity", value: "car_rental" },
  ],
  shopping: [
    { key: "shop", value: "mall" },
    { key: "shop", value: "supermarket" },
    { key: "shop", value: "department_store" },
    { key: "amenity", value: "marketplace" },
    { key: "shop", value: "gift" },
  ],
  nature: [
    { key: "leisure", value: "park" },
    { key: "leisure", value: "garden" },
    { key: "leisure", value: "nature_reserve" },
    { key: "natural", value: "beach" },
    { key: "natural", value: "peak" },
    { key: "tourism", value: "viewpoint" },
  ],
};

export function ActivityFormDialog({
  trigger, defaultSlot = "morning", dayNumber, originLat = null, originLng = null, originName = null, onSubmit,
}: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [slot, setSlot] = useState<TimeSlot>(defaultSlot);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [placeType, setPlaceType] = useState("attraction");
  const [address, setAddress] = useState("");
  const [startTime, setStartTime] = useState("");
  const [cost, setCost] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  function reset() {
    setSlot(defaultSlot);
    setTitle("");
    setDescription("");
    setPlaceType("attraction");
    setAddress("");
    setStartTime("");
    setCost("");
    setLat(null);
    setLng(null);
  }

  function handlePick(p: NearbyPlace) {
    setTitle(p.name);
    setAddress(p.address ?? "");
    setLat(p.lat);
    setLng(p.lng);
    const details = [p.cuisine ? `Cuisine: ${p.cuisine}` : null, p.phone ? `Phone: ${p.phone}` : null, p.website ? p.website : null]
      .filter(Boolean)
      .join(" · ");
    if (details) setDescription(details);
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
        lat,
        lng,
        start_time: startTime || null,
        cost: cost ? Number(cost) : 0,
      });
      reset();
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  const filters = FILTER_MAP[placeType] ?? [];
  const showBrowser = filters.length > 0;
  const suggestions = TITLE_SUGGESTIONS[placeType] ?? [];
  const titleInSuggestions = suggestions.includes(title);

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) setSlot(defaultSlot); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add planned activity · Day {dayNumber}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={placeType} onValueChange={(v) => { setPlaceType(v); setTitle(""); setLat(null); setLng(null); setAddress(""); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLACE_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Time of day</Label>
              <Select value={slot} onValueChange={(v) => setSlot(v as TimeSlot)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SLOTS.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="act-title">Title</Label>
            <Select value={titleInSuggestions ? title : ""} onValueChange={setTitle}>
              <SelectTrigger id="act-title"><SelectValue placeholder="Choose an activity" /></SelectTrigger>
              <SelectContent>
                {suggestions.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {title && !titleInSuggestions && (
              <p className="text-[11px] text-muted-foreground">Selected from map: {title}</p>
            )}
          </div>

          {showBrowser && (
            <NearbyPlacesBrowser
              originLat={originLat}
              originLng={originLng}
              originName={originName}
              filters={filters}
              titleKeyword={titleInSuggestions ? title : null}
              onPick={handlePick}
            />
          )}


          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="act-start">Start time</Label>
              <Input id="act-start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
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
