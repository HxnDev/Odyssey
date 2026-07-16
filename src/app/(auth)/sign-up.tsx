import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Pressable, View } from "react-native";
import { z } from "zod";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { signUpWithEmail } from "@/features/auth/api";
import { AuthScreenShell } from "@/features/auth/AuthScreenShell";

const schema = z
  .object({
    displayName: z.string().min(2, "Tell us your name"),
    email: z.email("Enter a valid email"),
    password: z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export default function SignUpScreen() {
  const [formError, setFormError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { displayName: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setFormError(null);
    try {
      await signUpWithEmail(values.email.trim(), values.password, values.displayName.trim());
      setEmailSent(true);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not sign up");
    }
  };

  if (emailSent) {
    return (
      <AuthScreenShell title="Check your inbox" subtitle="One more step before takeoff.">
        <AppText variant="body" className="mb-6">
          We sent a confirmation link to your email. Confirm it, then come back and sign in.
        </AppText>
        <Link href="/(auth)/sign-in" asChild>
          <Pressable>
            <AppText variant="label" className="text-primary dark:text-primary-dark">
              Back to sign in
            </AppText>
          </Pressable>
        </Link>
      </AuthScreenShell>
    );
  }

  return (
    <AuthScreenShell title="Create account" subtitle="Start the archive of everywhere you've been.">
      <View className="gap-4">
        <Controller
          control={control}
          name="displayName"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Name"
              autoComplete="name"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.displayName?.message}
            />
          )}
        />
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
              autoComplete="new-password"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Confirm password"
              secureTextEntry
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.confirmPassword?.message}
            />
          )}
        />

        {formError ? (
          <AppText variant="caption" className="text-danger dark:text-danger-dark">
            {formError}
          </AppText>
        ) : null}

        <Button title="Create account" loading={isSubmitting} onPress={handleSubmit(onSubmit)} />

        <View className="mt-4 flex-row justify-center gap-1">
          <AppText variant="label">Already have an account?</AppText>
          <Link href="/(auth)/sign-in" asChild>
            <Pressable>
              <AppText variant="label" className="text-primary dark:text-primary-dark">
                Sign in
              </AppText>
            </Pressable>
          </Link>
        </View>
      </View>
    </AuthScreenShell>
  );
}
