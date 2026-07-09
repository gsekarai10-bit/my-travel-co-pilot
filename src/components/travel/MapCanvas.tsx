import { useEffect, useMemo, useRef } from "react";
import type { ItineraryItem, Trip } from "@/lib/trips/types";

interface Props {
  trip: Trip | null;
  items: ItineraryItem[];
  activeItemId: string | null;
  onSelect: (id: string) => void;
}

/**
 * Leaflet-based interactive map. Client-only (dynamic import so SSR is safe).
 * Falls back to a stylized placeholder canvas until leaflet loads.
 */
export function MapCanvas({ trip, items, activeItemId, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const LRef = useRef<any>(null);

  const withCoords = useMemo(() => items.filter((i) => i.lat != null && i.lng != null), [items]);

  // Init map
  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;
      LRef.current = L;

      const center: [number, number] =
        trip?.destination_lat != null && trip?.destination_lng != null
          ? [trip.destination_lat, trip.destination_lng]
          : withCoords.length > 0
            ? [withCoords[0].lat!, withCoords[0].lng!]
            : [48.8566, 2.3522]; // Paris fallback

      const map = L.map(containerRef.current, { zoomControl: true, attributionControl: false }).setView(center, 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
      mapRef.current = map;
      setTimeout(() => map.invalidateSize(), 100);
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove?.();
      mapRef.current = null;
      markersRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip?.id]);

  // Sync markers
  useEffect(() => {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    // Remove stale
    for (const id of Object.keys(markersRef.current)) {
      if (!withCoords.find((i) => i.id === id)) {
        map.removeLayer(markersRef.current[id]);
        delete markersRef.current[id];
      }
    }

    // Add / update
    withCoords.forEach((item) => {
      const isActive = item.id === activeItemId;
      const icon = L.divIcon({
        className: "",
        html: `<div style="position:relative;width:20px;height:20px;">
          <div style="position:absolute;inset:0;border-radius:9999px;background:${isActive ? "oklch(0.62 0.16 25)" : "oklch(0.55 0.12 200)"};border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,.25);"></div>
          ${isActive ? '<div class="pin-pulse" style="position:absolute;inset:0;border-radius:9999px;"></div>' : ""}
        </div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      let m = markersRef.current[item.id];
      if (m) {
        m.setLatLng([item.lat!, item.lng!]);
        m.setIcon(icon);
      } else {
        m = L.marker([item.lat!, item.lng!], { icon }).addTo(map);
        m.on("click", () => onSelect(item.id));
        m.bindTooltip(item.title, { direction: "top", offset: [0, -8] });
        markersRef.current[item.id] = m;
      }
    });

    if (withCoords.length > 1) {
      const bounds = L.latLngBounds(withCoords.map((i) => [i.lat!, i.lng!] as [number, number]));
      map.fitBounds(bounds.pad(0.2), { animate: true });
    }
  }, [withCoords, activeItemId, onSelect]);

  // Fly to active
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !activeItemId) return;
    const active = withCoords.find((i) => i.id === activeItemId);
    if (active) map.flyTo([active.lat!, active.lng!], Math.max(map.getZoom(), 14), { duration: 0.8 });
  }, [activeItemId, withCoords]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-border bg-muted">
      <div ref={containerRef} className="absolute inset-0" />
      {withCoords.length === 0 && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div className="max-w-xs rounded-xl bg-background/70 p-4 text-sm text-muted-foreground backdrop-blur">
            Items with coordinates will pin here. Ask the Co-Pilot to add specific places.
          </div>
        </div>
      )}
    </div>
  );
}
