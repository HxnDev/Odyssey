import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { TripFlightRow } from "@/lib/database.types";
import { useAuth } from "@/features/auth/AuthProvider";

export const flightKeys = {
  byTrip: (tripId: string) => ["trip_flights", tripId] as const,
};

export function useTripFlights(tripId: string) {
  const { session } = useAuth();
  return useQuery({
    queryKey: flightKeys.byTrip(tripId),
    enabled: !!session && !!tripId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trip_flights")
        .select("*")
        .eq("trip_id", tripId)
        .order("position", { ascending: true });
      if (error) throw error;
      return data as TripFlightRow[];
    },
  });
}

export interface TripFlightInput {
  trip_id: string;
  position: number;
  flight_number: string;
  flight_date: string | null;
  dep_time?: string | null;
  arr_time?: string | null;
  airline: string | null;
  origin_iata: string | null;
  origin_city: string | null;
  dest_iata: string | null;
  dest_city: string | null;
}

export function useAddTripFlight() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async (input: TripFlightInput) => {
      if (!session) throw new Error("Not signed in");
      const { error } = await supabase
        .from("trip_flights")
        .insert({ ...input, user_id: session.user.id });
      if (error) throw error;
    },
    onSettled: (_data, _err, input) =>
      queryClient.invalidateQueries({ queryKey: flightKeys.byTrip(input.trip_id) }),
  });
}

export function useUpdateTripFlight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, trip_id: _tripId, ...fields }: Partial<TripFlightRow> & { id: string; trip_id: string }) => {
      const { error } = await supabase.from("trip_flights").update(fields).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, trip_id, ...fields }) => {
      const key = flightKeys.byTrip(trip_id);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<TripFlightRow[]>(key);
      queryClient.setQueryData<TripFlightRow[]>(key, (old = []) =>
        old.map((f) => (f.id === id ? { ...f, ...fields } : f)),
      );
      return { previous };
    },
    onError: (_err, { trip_id }, context) => {
      if (context?.previous) queryClient.setQueryData(flightKeys.byTrip(trip_id), context.previous);
    },
    onSettled: (_data, _err, { trip_id }) =>
      queryClient.invalidateQueries({ queryKey: flightKeys.byTrip(trip_id) }),
  });
}

export function useDeleteTripFlight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string; trip_id: string }) => {
      const { error } = await supabase.from("trip_flights").delete().eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, trip_id }) => {
      const key = flightKeys.byTrip(trip_id);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<TripFlightRow[]>(key);
      queryClient.setQueryData<TripFlightRow[]>(key, (old = []) => old.filter((f) => f.id !== id));
      return { previous };
    },
    onError: (_err, { trip_id }, context) => {
      if (context?.previous) queryClient.setQueryData(flightKeys.byTrip(trip_id), context.previous);
    },
    onSettled: (_data, _err, { trip_id }) =>
      queryClient.invalidateQueries({ queryKey: flightKeys.byTrip(trip_id) }),
  });
}
