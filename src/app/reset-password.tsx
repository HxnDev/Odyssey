import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthScreenShell } from "@/features/auth/AuthScreenShell";
import { useAuth } from "@/features/auth/AuthProvider";
import { updatePassword } from "@/features/auth/api";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { session, recoveryUserId, finishRecovery } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function savePassword() {
    if (!session || session.user.id !== recoveryUserId || busy) return;
    if (password.length < 8 || password !== confirmation) {
      setError(password.length < 8 ? "Use at least 8 characters." : "The passwords must match.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await updatePassword(password);
      finishRecovery();
      router.replace("/");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update your password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthScreenShell title="Reset password" subtitle="Choose a new password for Odyssey.">
      <View className="gap-4">
        {session && session.user.id === recoveryUserId ? (
          <>
            <Input label="New password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" />
            <Input label="Confirm password" value={confirmation} onChangeText={setConfirmation} secureTextEntry autoComplete="new-password" />
            {error ? <AppText className="text-danger dark:text-danger-dark">{error}</AppText> : null}
            <Button title="Save password" loading={busy} onPress={savePassword} />
          </>
        ) : (
          <>
            <AppText>Open a fresh password reset link from your email to continue.</AppText>
            <Button title={session ? "Back to Odyssey" : "Request a new link"} onPress={() => router.replace(session ? "/" : "/(auth)/forgot-password")} />
          </>
        )}
      </View>
    </AuthScreenShell>
  );
}
