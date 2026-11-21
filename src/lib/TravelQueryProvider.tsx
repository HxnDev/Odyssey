import type { ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { queryClient } from "./queryClient";

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "odyssey-query-cache",
});

export function TravelQueryProvider({ children }: { children: ReactNode }) {
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister, maxAge: 7 * 24 * 60 * 60 * 1000 }}>
      {children}
    </PersistQueryClientProvider>
  );
}
