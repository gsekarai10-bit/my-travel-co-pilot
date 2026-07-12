import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, MapPin, Star, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface NearbyPlace {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string | null;
  cuisine: string | null;
  phone: string | null;
  website: string | null;
  stars: number | null;
  category: string | null;
}

export interface OsmFilter {
  key: string;
  value?: string; // omit for any value
}

interface Props {
  originLat: number | null;
  originLng: number | null;
  originName: string | null;
  filters: OsmFilter[];
  titleKeyword?: string | null;
  onPick: (p: NearbyPlace) => void;
}

async function geocode(query: string): Promise<[number, number] | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
      { headers: { "Accept-Language": "en" } },
    );
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!data.length) return null;
    return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  } catch {
    return null;
  }
}

async function fetchNearby(lat: number, lng: number, filters: OsmFilter[]): Promise<NearbyPlace[]> {
  const clauses = filters
    .map((f) => {
      const tag = f.value ? `["${f.key}"="${f.value}"]` : `["${f.key}"]`;
      // include nodes, ways, relations for broader coverage
      return `node${tag}(around:3500,${lat},${lng});way${tag}(around:3500,${lat},${lng});`;
    })
    .join("");
  const query = `[out:json][timeout:25];(${clauses});out center 60;`;
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: "data=" + encodeURIComponent(query),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  if (!res.ok) throw new Error("Overpass request failed");
  const data = await res.json();
  const els: any[] = data.elements ?? [];
  const seen = new Set<string>();
  return els
    .filter((e) => e.tags?.name)
    .map((e) => {
      const t = e.tags ?? {};
      const addrParts = [t["addr:housenumber"], t["addr:street"], t["addr:city"]].filter(Boolean);
      const category = t.amenity ?? t.tourism ?? t.leisure ?? t.shop ?? t.natural ?? null;
      const center = e.center ?? { lat: e.lat, lon: e.lon };
      return {
        id: `${e.type}/${e.id}`,
        name: t.name as string,
        lat: center.lat,
        lng: center.lon,
        address: addrParts.length ? addrParts.join(" ") : t["addr:full"] ?? null,
        cuisine: t.cuisine ?? null,
        phone: t.phone ?? t["contact:phone"] ?? null,
        website: t.website ?? t["contact:website"] ?? null,
        stars: t.stars ? Number(t.stars) : null,
        category,
      } as NearbyPlace;
    })
    .filter((p) => {
      const key = `${p.name}|${p.lat.toFixed(4)}|${p.lng.toFixed(4)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 40);
}

export function NearbyPlacesBrowser({ originLat, originLng, originName, filters, titleKeyword, onPick }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [center, setCenter] = useState<[number, number] | null>(
    originLat != null && originLng != null ? [originLat, originLng] : null,
  );
  const [activeId, setActiveId] = useState<string | null>(null);

  const mapDiv = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const LRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});

  const filtersKey = useMemo(() => filters.map((f) => `${f.key}=${f.value ?? "*"}`).join(","), [filters]);

  // Load center if not provided
  useEffect(() => {
    if (center || !originName) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const c = await geocode(originName);
      if (!cancelled && c) setCenter(c);
      if (!cancelled && !c) setError("Could not locate destination");
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [originName, center]);

  // Fetch nearby
  useEffect(() => {
    if (!center || filters.length === 0) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const results = await fetchNearby(center[0], center[1], filters);
        if (!cancelled) setPlaces(results);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to search");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [center, filtersKey]);

  // Filter results by title keyword
  const visible = useMemo(() => {
    if (!titleKeyword) return places;
    const words = titleKeyword.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    if (!words.length) return places;
    const scored = places
      .map((p) => {
        const hay = `${p.name} ${p.category ?? ""} ${p.cuisine ?? ""}`.toLowerCase();
        const score = words.reduce((s, w) => s + (hay.includes(w) ? 1 : 0), 0);
        return { p, score };
      })
      .sort((a, b) => b.score - a.score);
    return scored.map((x) => x.p);
  }, [places, titleKeyword]);

  // Init map
  useEffect(() => {
    if (!center || !mapDiv.current || mapRef.current) return;
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !mapDiv.current) return;
      LRef.current = L;
      const map = L.map(mapDiv.current, { zoomControl: true, attributionControl: false }).setView(center, 14);
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
  }, [center]);

  // Sync markers
  useEffect(() => {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    for (const id of Object.keys(markersRef.current)) {
      map.removeLayer(markersRef.current[id]);
      delete markersRef.current[id];
    }
    visible.forEach((p) => {
      const isActive = p.id === activeId;
      const icon = L.divIcon({
        className: "",
        html: `<div style="width:16px;height:16px;border-radius:9999px;background:${isActive ? "oklch(0.62 0.16 25)" : "oklch(0.55 0.12 200)"};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      const m = L.marker([p.lat, p.lng], { icon }).addTo(map);
      m.bindTooltip(p.name, { direction: "top", offset: [0, -6] });
      m.on("click", () => setActiveId(p.id));
      markersRef.current[p.id] = m;
    });
    if (visible.length > 1) {
      const bounds = L.latLngBounds(visible.map((p) => [p.lat, p.lng] as [number, number]));
      map.fitBounds(bounds.pad(0.2), { animate: false });
    }
  }, [visible, activeId]);

  // Fly to active
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !activeId) return;
    const p = visible.find((x) => x.id === activeId);
    if (p) map.flyTo([p.lat, p.lng], 16, { duration: 0.6 });
  }, [activeId, visible]);

  const label = filters.map((f) => f.value ?? f.key).join(" / ");

  return (
    <div className="space-y-2 rounded-lg border border-border bg-card/40 p-2">
      <div className="flex items-center justify-between px-1">
        <div className="text-xs font-medium text-muted-foreground">
          Nearby {label} {originName ? `near ${originName}` : ""}
        </div>
        {loading && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
      </div>
      <div ref={mapDiv} className="h-40 w-full overflow-hidden rounded-md border border-border bg-muted" />
      {error && <div className="px-1 text-xs text-destructive">{error}</div>}
      <div className="max-h-52 space-y-1.5 overflow-y-auto pr-1 myt-scrollbar">
        {visible.length === 0 && !loading && !error && (
          <div className="p-3 text-center text-xs text-muted-foreground">No places found nearby.</div>
        )}
        {visible.map((p) => {
          const isActive = p.id === activeId;
          return (
            <div
              key={p.id}
              onMouseEnter={() => setActiveId(p.id)}
              className={`group flex items-start gap-2 rounded-md border p-2 text-xs transition-colors ${
                isActive ? "border-primary bg-accent" : "border-border bg-background hover:bg-accent/50"
              }`}
            >
              <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <div className="truncate font-medium text-foreground">{p.name}</div>
                  {p.stars != null && (
                    <span className="inline-flex items-center gap-0.5 text-amber-500">
                      <Star className="size-3 fill-current" />
                      {p.stars}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex flex-wrap gap-x-2 text-[11px] text-muted-foreground">
                  {p.category && <span className="capitalize">{p.category.replace(/_/g, " ")}</span>}
                  {p.cuisine && <span className="capitalize">{p.cuisine.replace(/;/g, ", ")}</span>}
                  {p.address && <span className="truncate">{p.address}</span>}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-[11px]"
                    onClick={() => onPick(p)}
                  >
                    Use this place
                  </Button>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name + (p.address ? " " + p.address : ""))}%40${p.lat},${p.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-0.5 rounded border border-border bg-background px-1.5 py-0.5 text-[11px] font-medium text-primary hover:bg-accent"
                    title="Open exact location in Google Maps"
                  >
                    <MapPin className="size-3" /> Google Maps <ExternalLink className="size-2.5" />
                  </a>
                  {p.website ? (
                    <a
                      href={p.website.startsWith("http") ? p.website : `https://${p.website}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex max-w-[160px] items-center gap-0.5 truncate rounded border border-border bg-background px-1.5 py-0.5 text-[11px] font-medium text-primary hover:bg-accent"
                      title={p.website}
                    >
                      Website <ExternalLink className="size-2.5" />
                    </a>
                  ) : (
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(p.name + " " + (p.address ?? ""))}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-0.5 rounded border border-border bg-background px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-accent"
                      title="Search the web for this place"
                    >
                      Search web <ExternalLink className="size-2.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
