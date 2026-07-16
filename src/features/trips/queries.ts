import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { TripRow, TripStopRow } from "@/lib/database.types";
import { useAuth } from "@/features/auth/AuthProvider";

export const tripKeys = {
  all: ["trips"] as const,
  stops: (tripId: string) => ["trip_stops", tripId] as const,
};

// ============ Trips ============

export function useTrips() {
  const { session } = useAuth();
  return useQuery({
    queryKey: tripKeys.all,
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .order("start_date", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data as TripRow[];
    },
  });
}

export function useTrip(id: string) {
  const query = useTrips();
  return { ...query, trip: query.data?.find((t) => t.id === id) ?? null };
}

export interface TripInput {
  name: string;
  transport: string;
  start_date: string | null;
  end_date: string | null;
  cover_emoji: string;
  notes?: string | null;
  group_name?: string | null;
  flight_number?: string | null;
}

export function useCreateTrip() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async (input: TripInput) => {
      if (!session) throw new Error("Not signed in");
      const { data, error } = await supabase
        .from("trips")
        .insert({ ...input, user_id: session.user.id })
        .select()
        .single();
      if (error) throw error;
      return data as TripRow;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tripKeys.all }),
  });
}

export function useUpdateTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...fields }: Partial<TripRow> & { id: string }) => {
      const { error } = await supabase.from("trips").update(fields).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, ...fields }) => {
      await queryClient.cancelQueries({ queryKey: tripKeys.all });
      const previous = queryClient.getQueryData<TripRow[]>(tripKeys.all);
      queryClient.setQueryData<TripRow[]>(tripKeys.all, (old = []) =>
        old.map((t) => (t.id === id ? { ...t, ...fields } : t)),
      );
      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) queryClient.setQueryData(tripKeys.all, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: tripKeys.all }),
  });
}

export function useDeleteTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("trips").delete().eq("id", id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: tripKeys.all });
      const previous = queryClient.getQueryData<TripRow[]>(tripKeys.all);
      queryClient.setQueryData<TripRow[]>(tripKeys.all, (old = []) =>
        old.filter((t) => t.id !== id),
      );
      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) queryClient.setQueryData(tripKeys.all, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: tripKeys.all }),
  });
}

// ============ Trip stops ============

export function useTripStops(tripId: string) {
  const { session } = useAuth();
  return useQuery({
    queryKey: tripKeys.stops(tripId),
    enabled: !!session && !!tripId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trip_stops")
        .select("*")
        .eq("trip_id", tripId)
        .order("position", { ascending: true });
      if (error) throw error;
      return data as TripStopRow[];
    },
  });
}

/** All stops across all trips — used for statistics. */
export function useAllTripStops() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ["trip_stops", "all"],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trip_stops")
        .select("*")
        .order("position", { ascending: true });
      if (error) throw error;
      return data as TripStopRow[];
    },
  });
}

export interface TripStopInput {
  trip_id: string;
  city_name: string;
  country_iso: string;
  lat?: number | null;
  lng?: number | null;
  position: number;
  arrival_date?: string | null;
  departure_date?: string | null;
  transport?: string | null;
}

export function useAddTripStop() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async (input: TripStopInput) => {
      if (!session) throw new Error("Not signed in");
      const { error } = await supabase
        .from("trip_stops")
        .insert({ ...input, user_id: session.user.id });
      if (error) throw error;
    },
    onSettled: (_data, _err, input) => {
      queryClient.invalidateQueries({ queryKey: tripKeys.stops(input.trip_id) });
      queryClient.invalidateQueries({ queryKey: ["trip_stops", "all"] });
    },
  });
}

export function useUpdateTripStop() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      trip_id: _tripId,
      ...fields
    }: Partial<TripStopRow> & { id: string; trip_id: string }) => {
      const { error } = await supabase.from("trip_stops").update(fields).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, trip_id, ...fields }) => {
      const key = tripKeys.stops(trip_id);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<TripStopRow[]>(key);
      queryClient.setQueryData<TripStopRow[]>(key, (old = []) =>
        old.map((s) => (s.id === id ? { ...s, ...fields } : s)),
      );
      return { previous, key };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) queryClient.setQueryData(context.key, context.previous);
    },
    onSettled: (_data, _err, input) => {
      queryClient.invalidateQueries({ queryKey: tripKeys.stops(input.trip_id) });
      queryClient.invalidateQueries({ queryKey: ["trip_stops", "all"] });
    },
  });
}

export function useDeleteTripStop() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string; trip_id: string }) => {
      const { error } = await supabase.from("trip_stops").delete().eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, trip_id }) => {
      const key = tripKeys.stops(trip_id);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<TripStopRow[]>(key);
      queryClient.setQueryData<TripStopRow[]>(key, (old = []) => old.filter((s) => s.id !== id));
      return { previous, key };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) queryClient.setQueryData(context.key, context.previous);
    },
    onSettled: (_data, _err, input) => {
      queryClient.invalidateQueries({ queryKey: tripKeys.stops(input.trip_id) });
      queryClient.invalidateQueries({ queryKey: ["trip_stops", "all"] });
    },
  });
}
