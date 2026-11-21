import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { queryClient } from "./queryClient";

export function TravelQueryProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  return <AccountQueryProvider key={session?.user.id}>{children}</AccountQueryProvider>;
}

function AccountQueryProvider({ children }: { children: ReactNode }) {
  // Start with an empty cache when the browser signs out or switches accounts.
  const [client] = useState(() => new QueryClient({ defaultOptions: queryClient.getDefaultOptions() }));
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
