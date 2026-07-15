import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { CountryStatusDb, CountryVisitRow } from "@/lib/database.types";
import { useAuth } from "@/features/auth/AuthProvider";

export const visitKeys = {
  all: ["country_visits"] as const,
};

export function useCountryVisits() {
  const { session } = useAuth();
  return useQuery({
    queryKey: visitKeys.all,
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("country_visits")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as CountryVisitRow[];
    },
  });
}

export function useVisitByIso(iso: string) {
  const query = useCountryVisits();
  return {
    ...query,
    visit: query.data?.find((v) => v.country_iso === iso) ?? null,
  };
}

interface SetStatusInput {
  iso: string;
  status: CountryStatusDb | null; // null clears the record
}

export function useSetCountryStatus() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async ({ iso, status }: SetStatusInput) => {
      if (!session) throw new Error("Not signed in");
      if (status === null) {
        const { error } = await supabase.from("country_visits").delete().eq("country_iso", iso);
        if (error) throw error;
        return;
      }
      const { error } = await supabase
        .from("country_visits")
        .upsert(
          { user_id: session.user.id, country_iso: iso, status },
          { onConflict: "user_id,country_iso" },
        );
      if (error) throw error;
    },
    onMutate: async ({ iso, status }) => {
      await queryClient.cancelQueries({ queryKey: visitKeys.all });
      const previous = queryClient.getQueryData<CountryVisitRow[]>(visitKeys.all);

      queryClient.setQueryData<CountryVisitRow[]>(visitKeys.all, (old = []) => {
        const rest = old.filter((v) => v.country_iso !== iso);
        if (status === null) return rest;
        const existing = old.find((v) => v.country_iso === iso);
        const optimistic: CountryVisitRow = existing
          ? { ...existing, status, updated_at: new Date().toISOString() }
          : {
              id: `optimistic-${iso}`,
              user_id: session?.user.id ?? "",
              country_iso: iso,
              status,
              favorite: false,
              first_visit_date: null,
              last_visit_date: null,
              total_days: null,
              visit_count: 1,
              notes: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
        return [optimistic, ...rest];
      });

      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) queryClient.setQueryData(visitKeys.all, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: visitKeys.all });
    },
  });
}

export interface VisitDetailsInput {
  iso: string;
  favorite?: boolean;
  first_visit_date?: string | null;
  last_visit_date?: string | null;
  total_days?: number | null;
  visit_count?: number;
  notes?: string | null;
}

export function useUpdateVisitDetails() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ iso, ...fields }: VisitDetailsInput) => {
      const { error } = await supabase.from("country_visits").update(fields).eq("country_iso", iso);
      if (error) throw error;
    },
    onMutate: async ({ iso, ...fields }) => {
      await queryClient.cancelQueries({ queryKey: visitKeys.all });
      const previous = queryClient.getQueryData<CountryVisitRow[]>(visitKeys.all);
      queryClient.setQueryData<CountryVisitRow[]>(visitKeys.all, (old = []) =>
        old.map((v) => (v.country_iso === iso ? { ...v, ...fields } : v)),
      );
      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) queryClient.setQueryData(visitKeys.all, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: visitKeys.all });
    },
  });
}
