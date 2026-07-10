import { Sun, Sunrise, Moon, Plus } from "lucide-react";
import { PlaceCard } from "./PlaceCard";
import { Button } from "@/components/ui/button";
import { ActivityFormDialog } from "./ActivityFormDialog";
import type { ItineraryItem, TimeSlot } from "@/lib/trips/types";
import { SLOTS } from "@/lib/trips/types";

interface Props {
  items: ItineraryItem[];
  dayNumber: number;
  totalDays: number;
  activeItemId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onDayChange: (day: number) => void;
  onAdd: (draft: Partial<ItineraryItem> & { time_slot: TimeSlot }) => Promise<void> | void;
}

const slotMeta: Record<TimeSlot, { label: string; icon: typeof Sun }> = {
  morning: { label: "Morning", icon: Sunrise },
  afternoon: { label: "Afternoon", icon: Sun },
  evening: { label: "Evening", icon: Moon },
};

export function Timeline({ items, dayNumber, totalDays, activeItemId, onHover, onSelect, onDelete, onDayChange, onAdd }: Props) {
  const forDay = items.filter((i) => i.day_number === dayNumber);
  const bySlot = (slot: TimeSlot) => forDay.filter((i) => i.time_slot === slot);

  return (
    <div className="flex h-full flex-col">
      {/* Day picker */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-border/60 bg-card/40 px-4 py-3 myt-scrollbar">
        {Array.from({ length: Math.max(1, totalDays) }, (_, i) => i + 1).map((d) => (
          <button
            key={d}
            onClick={() => onDayChange(d)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              d === dayNumber
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card text-muted-foreground hover:bg-accent"
            }`}
          >
            Day {d}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto p-4 myt-scrollbar">
        {SLOTS.map((slot) => {
          const meta = slotMeta[slot];
          const Icon = meta.icon;
          const list = bySlot(slot);
          return (
            <section key={slot}>
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid size-6 place-items-center rounded-md bg-accent text-accent-foreground">
                    <Icon className="size-3.5" />
                  </span>
                  <h4 className="text-sm font-semibold">{meta.label}</h4>
                  <span className="text-xs text-muted-foreground">{list.length} planned</span>
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onAdd(slot)}>
                  <Plus className="mr-1 size-3.5" /> Add
                </Button>
              </div>

              {list.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                  Nothing planned for {meta.label.toLowerCase()}. Ask the Co-Pilot for ideas.
                </div>
              ) : (
                <div className="space-y-2">
                  {list.map((i) => (
                    <PlaceCard
                      key={i.id}
                      item={i}
                      active={activeItemId === i.id}
                      onHover={onHover}
                      onSelect={onSelect}
                      onDelete={onDelete}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
