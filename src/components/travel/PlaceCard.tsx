import { Cloud, Clock, MapPin, Star, Trash2 } from "lucide-react";
import type { ItineraryItem } from "@/lib/trips/types";
import { Button } from "@/components/ui/button";

interface Props {
  item: ItineraryItem;
  active?: boolean;
  onHover?: (id: string | null) => void;
  onSelect?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function PlaceCard({ item, active, onHover, onSelect, onDelete }: Props) {
  const status = computeStatus(item);
  return (
    <div
      onMouseEnter={() => onHover?.(item.id)}
      onMouseLeave={() => onHover?.(null)}
      onClick={() => onSelect?.(item.id)}
      className={`group cursor-pointer overflow-hidden rounded-xl border bg-card transition-all ${
        active ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50"
      }`}
      style={{ boxShadow: active ? "var(--shadow-glow)" : "var(--shadow-card)" }}
    >
      <div className="flex gap-3 p-3">
        <div
          className="h-20 w-24 shrink-0 rounded-lg bg-muted bg-cover bg-center"
          style={{ backgroundImage: item.cover_photo_url ? `url(${item.cover_photo_url})` : "linear-gradient(135deg, var(--muted), var(--accent))" }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {item.start_time && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3" /> {item.start_time}
                  </span>
                )}
                {item.place_type && (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent-foreground">
                    {item.place_type}
                  </span>
                )}
              </div>
              <div className="mt-1 truncate text-sm font-semibold">{item.title}</div>
              {item.address && (
                <div className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                  <MapPin className="size-3 shrink-0" /> <span className="truncate">{item.address}</span>
                </div>
              )}
            </div>
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="size-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
            {item.rating != null && (
              <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <Star className="size-3 fill-current" /> {Number(item.rating).toFixed(1)}
              </span>
            )}
            {item.weather && (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Cloud className="size-3" /> {item.weather}
              </span>
            )}
            {item.cost != null && item.cost > 0 && (
              <span className="text-muted-foreground">${Number(item.cost).toFixed(0)}</span>
            )}
            <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium ${status.className}`}>
              {status.label}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function computeStatus(item: ItineraryItem): { label: string; className: string } {
  if (item.status_tag) {
    const s = item.status_tag.toLowerCase();
    if (s.includes("closed")) return { label: item.status_tag, className: "bg-destructive/10 text-destructive" };
    if (s.includes("open")) return { label: item.status_tag, className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" };
    return { label: item.status_tag, className: "bg-accent text-accent-foreground" };
  }
  const day = new Date().toLocaleDateString("en-US", { weekday: "long" });
  if (item.open_hours && typeof item.open_hours === "object") {
    const val = (item.open_hours as Record<string, string>)[day];
    if (val && /closed/i.test(val)) return { label: `Closed on ${day}s`, className: "bg-destructive/10 text-destructive" };
    if (val) return { label: `Open · ${val}`, className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" };
  }
  return { label: "Open now", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" };
}
