import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Pressable, View } from "react-native";
import { z } from "zod";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { sendPasswordReset } from "@/features/auth/api";
import { AuthScreenShell } from "@/features/auth/AuthScreenShell";

const schema = z.object({ email: z.email("Enter a valid email") });

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordScreen() {
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setFormError(null);
    try {
      await sendPasswordReset(values.email.trim());
      setSent(true);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not send reset email");
    }
  };

  return (
    <AuthScreenShell
      title="Reset password"
      subtitle={sent ? "Email sent — check your inbox." : "We'll send you a reset link."}
    >
      <View className="gap-4">
        {!sent ? (
          <>
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
            {formError ? (
              <AppText variant="caption" className="text-danger dark:text-danger-dark">
                {formError}
              </AppText>
            ) : null}
            <Button title="Send reset link" loading={isSubmitting} onPress={handleSubmit(onSubmit)} />
          </>
        ) : null}

        <Link href="/(auth)/sign-in" asChild>
          <Pressable className="self-center">
            <AppText variant="label" className="text-primary dark:text-primary-dark">
              Back to sign in
            </AppText>
          </Pressable>
        </Link>
      </View>
    </AuthScreenShell>
  );
}
