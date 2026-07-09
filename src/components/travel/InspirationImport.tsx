import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Link2, Loader2, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlaceCard } from "./PlaceCard";
import type { ItineraryItem } from "@/lib/trips/types";

interface Props {
  onAppend: (draft: Partial<ItineraryItem>) => void;
}

export function InspirationImport({ onAppend }: Props) {
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<any | null>(null);

  const scrape = useMutation({
    mutationFn: async (payload: { url: string; note?: string }) => {
      const res = await fetch("/api/scrape-inspiration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      return data.card;
    },
    onSuccess: (card) => {
      setPreview(card);
      toast.success(`Imported from ${card.source.platform}`);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const text = e.dataTransfer.getData("text/plain");
    if (text && /^https?:\/\//.test(text)) {
      setUrl(text);
      scrape.mutate({ url: text });
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Sparkles className="size-4 text-primary" />
        Import inspiration
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
          dragOver ? "border-primary bg-primary/5" : "border-border"
        }`}
      >
        <Upload className="mx-auto size-5 text-muted-foreground" />
        <div className="mt-1 text-xs text-muted-foreground">Drop a TikTok / Reel / YouTube / article link</div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://tiktok.com/..." className="pl-9" />
        </div>
        <Button
          onClick={() => url && scrape.mutate({ url, note: note || undefined })}
          disabled={scrape.isPending || !url}
        >
          {scrape.isPending ? <Loader2 className="size-4 animate-spin" /> : "Parse"}
        </Button>
      </div>
      <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note (why you saved it)" />

      {preview && (
        <div className="space-y-2 rounded-lg bg-muted/40 p-2">
          <PlaceCard
            item={{
              id: "preview",
              trip_id: "",
              user_id: "",
              day_number: 1,
              time_slot: "afternoon",
              start_time: null,
              title: preview.title,
              description: preview.description,
              place_type: preview.place_type,
              address: preview.address,
              lat: null,
              lng: null,
              cover_photo_url: preview.cover_photo_url,
              rating: preview.rating,
              weather: preview.weather,
              cost: 0,
              status_tag: null,
              open_hours: null,
              order_index: 0,
              created_at: new Date().toISOString(),
            }}
          />
          <Button
            size="sm"
            className="w-full"
            onClick={() => {
              onAppend({
                title: preview.title,
                description: preview.description,
                place_type: preview.place_type,
                address: preview.address,
                cover_photo_url: preview.cover_photo_url,
                rating: preview.rating,
                weather: preview.weather,
                time_slot: "afternoon",
              });
              setPreview(null);
              setUrl("");
              setNote("");
            }}
          >
            Add to itinerary
          </Button>
        </div>
      )}
    </div>
  );
}
