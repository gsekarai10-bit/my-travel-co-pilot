export type TimeSlot = "morning" | "afternoon" | "evening";
export type TripVibe = "Adventure" | "Relaxing" | "Cultural" | "Foodie";

export interface Trip {
  id: string;
  user_id: string;
  destination: string;
  destination_lat: number | null;
  destination_lng: number | null;
  start_date: string;
  end_date: string;
  budget: number;
  spent: number;
  vibe: TripVibe;
  cover_photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ItineraryItem {
  id: string;
  trip_id: string;
  user_id: string;
  day_number: number;
  time_slot: TimeSlot;
  start_time: string | null;
  title: string;
  description: string | null;
  place_type: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  cover_photo_url: string | null;
  rating: number | null;
  weather: string | null;
  cost: number | null;
  status_tag: string | null;
  open_hours: Record<string, string> | null;
  order_index: number;
  created_at: string;
}

export const VIBES: TripVibe[] = ["Adventure", "Relaxing", "Cultural", "Foodie"];
export const SLOTS: TimeSlot[] = ["morning", "afternoon", "evening"];

export function dayNumberFor(trip: Trip, date: Date): number {
  const start = new Date(trip.start_date + "T00:00:00");
  return Math.max(1, Math.floor((date.getTime() - start.getTime()) / 86400000) + 1);
}
