/**
 * Hand-written types for the Odyssey schema (see supabase/migrations).
 * Regenerate with `npx supabase gen types typescript` once the CLI is linked.
 *
 * Note: rows use `type` (not `interface`) so they satisfy supabase-js's
 * Record<string, unknown> constraint.
 */

export type CountryStatusDb = "visited" | "lived" | "wishlist" | "transit";

export type ProfileRow = {
  id: string;
  display_name: string | null;
  home_country: string | null;
  created_at: string;
  updated_at: string;
};

export type CountryVisitRow = {
  id: string;
  user_id: string;
  country_iso: string;
  status: CountryStatusDb;
  favorite: boolean;
  first_visit_date: string | null;
  last_visit_date: string | null;
  total_days: number | null;
  visit_count: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type SettingsRow = {
  user_id: string;
  theme: "system" | "light" | "dark";
  map_theme: "auto" | "light" | "dark";
  units: "metric" | "imperial";
  updated_at: string;
};

export type TripRow = {
  id: string;
  user_id: string;
  name: string;
  transport: string;
  start_date: string | null;
  end_date: string | null;
  cancelled: boolean;
  rating: number | null;
  highlights: string | null;
  notes: string | null;
  cover_emoji: string;
  cover_photo_url: string | null;
  group_name: string | null;
  flight_number: string | null;
  created_at: string;
  updated_at: string;
};

export type TripStopRow = {
  id: string;
  trip_id: string;
  user_id: string;
  position: number;
  city_name: string;
  country_iso: string;
  lat: number | null;
  lng: number | null;
  arrival_date: string | null;
  departure_date: string | null;
  transport: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type CityVisitRow = {
  id: string;
  user_id: string;
  city_id: number | null;
  name: string;
  country_iso: string;
  lat: number | null;
  lng: number | null;
  favorite: boolean;
  first_visit_date: string | null;
  last_visit_date: string | null;
  total_days: number | null;
  visit_count: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & { id: string };
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      country_visits: {
        Row: CountryVisitRow;
        Insert: Partial<CountryVisitRow> & {
          country_iso: string;
          status: CountryStatusDb;
          user_id: string;
        };
        Update: Partial<CountryVisitRow>;
        Relationships: [];
      };
      settings: {
        Row: SettingsRow;
        Insert: Partial<SettingsRow> & { user_id: string };
        Update: Partial<SettingsRow>;
        Relationships: [];
      };
      trips: {
        Row: TripRow;
        Insert: Partial<TripRow> & { user_id: string; name: string };
        Update: Partial<TripRow>;
        Relationships: [];
      };
      trip_stops: {
        Row: TripStopRow;
        Insert: Partial<TripStopRow> & {
          user_id: string;
          trip_id: string;
          city_name: string;
          country_iso: string;
        };
        Update: Partial<TripStopRow>;
        Relationships: [];
      };
      city_visits: {
        Row: CityVisitRow;
        Insert: Partial<CityVisitRow> & {
          user_id: string;
          name: string;
          country_iso: string;
        };
        Update: Partial<CityVisitRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      delete_own_account: {
        Args: Record<string, never>;
        Returns: undefined;
      };
    };
    Enums: {
      country_status: CountryStatusDb;
    };
    CompositeTypes: Record<string, never>;
  };
};
