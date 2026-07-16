import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Pressable, View } from "react-native";
import { z } from "zod";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { signInWithEmail, signInWithGoogle } from "@/features/auth/api";
import { AuthScreenShell } from "@/features/auth/AuthScreenShell";

const schema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export default function SignInScreen() {
  const [formError, setFormError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setFormError(null);
    try {
      await signInWithEmail(values.email.trim(), values.password);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not sign in");
    }
  };

  const onGoogle = async () => {
    setFormError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Google sign-in failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <AuthScreenShell title="Odyssey" subtitle="Every journey matters. Welcome back.">
      <View className="gap-4">
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Email"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.email?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Password"
              secureTextEntry
              autoComplete="password"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
            />
          )}
        />

        <Link href="/(auth)/forgot-password" asChild>
          <Pressable className="self-end">
            <AppText variant="label" className="text-primary dark:text-primary-dark">
              Forgot password?
            </AppText>
          </Pressable>
        </Link>

        {formError ? (
          <AppText variant="caption" className="text-danger dark:text-danger-dark">
            {formError}
          </AppText>
        ) : null}

        <Button title="Sign in" loading={isSubmitting} onPress={handleSubmit(onSubmit)} />
        <Button
          title="Continue with Google"
          variant="secondary"
          loading={googleLoading}
          onPress={onGoogle}
        />

        <View className="mt-4 flex-row justify-center gap-1">
          <AppText variant="label">New here?</AppText>
          <Link href="/(auth)/sign-up" asChild>
            <Pressable>
              <AppText variant="label" className="text-primary dark:text-primary-dark">
                Create an account
              </AppText>
            </Pressable>
          </Link>
        </View>
      </View>
    </AuthScreenShell>
  );
}
