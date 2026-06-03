import { Alert, AlertDescription, AlertTitle } from "@corral/ui/components/alert";
import { Button } from "@corral/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@corral/ui/components/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@corral/ui/components/field";
import { Input } from "@corral/ui/components/input";
import { Spinner } from "@corral/ui/components/spinner";
import { createFileRoute } from "@tanstack/react-router";
import type { FormEvent } from "react";
import { useId, useState } from "react";

import { getSafeRedirectPath } from "../lib/auth";

type LoginSearch = {
  redirect?: string;
};

type LoginMode = "idle" | "email" | "google";

export const Route = createFileRoute("/login")({
  validateSearch: (search): LoginSearch => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  component: LoginPage,
});

function authErrorMessage(error: { message?: string; code?: string } | null | undefined) {
  return error?.message ?? "Authentication failed. Check your credentials and try again.";
}

function LoginPage() {
  const emailId = useId();
  const passwordId = useId();
  const { authClient } = Route.useRouteContext();
  const navigate = Route.useNavigate();
  const { redirect } = Route.useSearch();
  const redirectPath = getSafeRedirectPath(redirect);
  const [mode, setMode] = useState<LoginMode>("idle");
  const [error, setError] = useState<string | null>(null);

  const isSubmitting = mode !== "idle";

  async function handleEmailSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    setMode("email");
    setError(null);

    const result = await authClient.signIn.email({
      email,
      password,
      callbackURL: redirectPath,
    });

    if (result.error) {
      setError(authErrorMessage(result.error));
      setMode("idle");
      return;
    }

    await navigate({ href: redirectPath });
  }

  async function handleGoogleSignIn() {
    setMode("google");
    setError(null);

    const result = await authClient.signIn.social({
      provider: "google",
      callbackURL: redirectPath,
    });

    if (result.error) {
      setError(authErrorMessage(result.error));
      setMode("idle");
    }
  }

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full gap-8 lg:grid-cols-[1fr_28rem] lg:items-center">
          <section className="rounded-4xl border border-border/70 bg-card/80 p-8 shadow-2xl shadow-slate-950/10">
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-primary">
              Corral console
            </p>
            <h1 className="mt-4 font-display text-5xl font-black uppercase tracking-tight md:text-7xl">
              Sign in to race command
            </h1>
            <p className="mt-5 max-w-2xl text-muted-foreground">
              Use your admin-created Corral account to monitor race-day systems, brief captains, and
              manage console access.
            </p>
          </section>

          <Card className="rounded-4xl shadow-2xl shadow-slate-950/10">
            <CardHeader>
              <CardTitle className="font-display text-3xl uppercase">Welcome back</CardTitle>
              <CardDescription>Email/password and Google sign-in are supported.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={ handleEmailSignIn }>
                <FieldGroup>
                  { error ? (
                    <Alert variant="destructive">
                      <AlertTitle>Sign-in failed</AlertTitle>
                      <AlertDescription>{ error }</AlertDescription>
                    </Alert>
                  ) : null }

                  <Field>
                    <FieldLabel htmlFor={ emailId }>Email</FieldLabel>
                    <Input
                      id={ emailId }
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="captain@example.com"
                      disabled={ isSubmitting }
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor={ passwordId }>Password</FieldLabel>
                    <Input
                      id={ passwordId }
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      disabled={ isSubmitting }
                      required
                    />
                    <FieldDescription>Accounts are created by Corral admins.</FieldDescription>
                  </Field>

                  <FieldError>{ error }</FieldError>

                  <Button type="submit" className="w-full" disabled={ isSubmitting }>
                    { mode === "email" ? <Spinner /> : null }
                    Sign in with email
                  </Button>

                  <FieldSeparator>or</FieldSeparator>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={ handleGoogleSignIn }
                    disabled={ isSubmitting }
                  >
                    { mode === "google" ? <Spinner /> : null }
                    Sign in with Google
                  </Button>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
