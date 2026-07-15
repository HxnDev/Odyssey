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
