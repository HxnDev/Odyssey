import { Platform } from "react-native";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import { supabase } from "@/lib/supabase";

function authRedirect(path = "") {
  if (Platform.OS === "web") return new URL(`/${path}`, window.location.origin).href;
  const nativeRedirect = makeRedirectUri({ scheme: "odyssey" });
  return path ? `${nativeRedirect}${path}` : nativeRedirect;
}

export async function signUpWithEmail(email: string, password: string, displayName: string) {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: authRedirect(),
      data: { display_name: displayName },
    },
  });
  if (error) throw error;
}

export async function signInWithEmail(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: authRedirect("reset-password"),
  });
  if (error) throw error;
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function deleteAccount() {
  const { error } = await supabase.rpc("delete_own_account");
  if (error) throw error;
  await supabase.auth.signOut();
}

/**
 * Google Sign-In via Supabase OAuth + in-app browser deep link.
 * Requires the Google provider to be enabled in the Supabase dashboard.
 */
export async function signInWithGoogle() {
  const redirectTo = authRedirect();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, skipBrowserRedirect: Platform.OS !== "web" },
  });
  if (error) throw error;

  if (Platform.OS === "web") return true;

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== "success") return false;

  const url = Linking.parse(result.url);
  const params = url.queryParams ?? {};

  // PKCE flow returns ?code=..., implicit flow returns tokens in the fragment.
  if (typeof params.code === "string") {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(params.code);
    if (exchangeError) throw exchangeError;
    return true;
  }

  const fragment = result.url.split("#")[1];
  if (fragment) {
    const fragmentParams = new URLSearchParams(fragment);
    const accessToken = fragmentParams.get("access_token");
    const refreshToken = fragmentParams.get("refresh_token");
    if (accessToken && refreshToken) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (sessionError) throw sessionError;
      return true;
    }
  }

  return false;
}
