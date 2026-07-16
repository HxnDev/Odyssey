import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { CityVisitRow } from "@/lib/database.types";
import { useAuth } from "@/features/auth/AuthProvider";

export const cityKeys = {
  all: ["city_visits"] as const,
};

export function useCityVisits() {
  const { session } = useAuth();
  return useQuery({
    queryKey: cityKeys.all,
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("city_visits")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as CityVisitRow[];
    },
  });
}

export function useCityVisit(id: string) {
  const query = useCityVisits();
  return { ...query, city: query.data?.find((c) => c.id === id) ?? null };
}

export interface CityVisitInput {
  city_id?: number | null;
  name: string;
  country_iso: string;
  lat?: number | null;
  lng?: number | null;
}

export function useAddCityVisit() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async (input: CityVisitInput) => {
      if (!session) throw new Error("Not signed in");
      const { error } = await supabase
        .from("city_visits")
        .upsert(
          { ...input, user_id: session.user.id },
          { onConflict: "user_id,name,country_iso", ignoreDuplicates: true },
        );
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: cityKeys.all }),
  });
}

export function useUpdateCityVisit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...fields }: Partial<CityVisitRow> & { id: string }) => {
      const { error } = await supabase.from("city_visits").update(fields).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, ...fields }) => {
      await queryClient.cancelQueries({ queryKey: cityKeys.all });
      const previous = queryClient.getQueryData<CityVisitRow[]>(cityKeys.all);
      queryClient.setQueryData<CityVisitRow[]>(cityKeys.all, (old = []) =>
        old.map((c) => (c.id === id ? { ...c, ...fields } : c)),
      );
      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) queryClient.setQueryData(cityKeys.all, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: cityKeys.all }),
  });
}

export function useDeleteCityVisit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("city_visits").delete().eq("id", id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: cityKeys.all });
      const previous = queryClient.getQueryData<CityVisitRow[]>(cityKeys.all);
      queryClient.setQueryData<CityVisitRow[]>(cityKeys.all, (old = []) =>
        old.filter((c) => c.id !== id),
      );
      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) queryClient.setQueryData(cityKeys.all, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: cityKeys.all }),
  });
}
