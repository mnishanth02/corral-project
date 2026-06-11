import { Alert, AlertDescription, AlertTitle } from "@corral/ui/components/alert";
import { Badge } from "@corral/ui/components/badge";
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
import { Skeleton } from "@corral/ui/components/skeleton";
import { Spinner } from "@corral/ui/components/spinner";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { authClient, getSafeRedirectPath } from "../lib/auth";

type LoginDemo = "default" | "loading" | "validation-error" | "auth-error";

type LoginSearch = {
  redirect?: string;
  demo: LoginDemo;
  verified?: string;
};

type LoginMode = "idle" | "email" | "google";

const loginDemos = ["default", "loading", "validation-error", "auth-error"] as const;

export const Route = createFileRoute("/login")({
  validateSearch: (search): LoginSearch => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
    verified: typeof search.verified === "string" ? search.verified : undefined,
    demo:
      typeof search.demo === "string" && loginDemos.includes(search.demo as LoginDemo)
        ? (search.demo as LoginDemo)
        : "default",
  }),
  component: LoginPage,
});

function LoginPage() {
  const emailId = useId();
  const passwordId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const { redirect, demo, verified } = Route.useSearch();
  const redirectPath = getSafeRedirectPath(redirect);
  const [mode, setMode] = useState<LoginMode>(demo === "loading" ? "email" : "idle");
  const [error, setError] = useState<string | null>(
    demo === "auth-error"
      ? "Incorrect email or password."
      : demo === "validation-error"
        ? "Enter an email and password to continue."
        : null,
  );

  const isSubmitting = mode !== "idle";

  const focusError = useCallback(() => {
    window.requestAnimationFrame(() => errorRef.current?.focus());
  }, []);

  const submitEmailSignIn = useCallback(
    async (form: HTMLFormElement) => {
      const formData = new FormData(form);
      const email = String(formData.get("email") ?? "").trim();
      const password = String(formData.get("password") ?? "");

      if (!email || !password || demo === "validation-error") {
        setError("Enter an email and password to continue.");
        focusError();
        return;
      }

      if (demo === "auth-error") {
        setError("Incorrect email or password.");
        focusError();
        return;
      }

      setMode("email");
      setError(null);

      const result = await authClient.signIn.email({
        email,
        password,
      });

      if (result.error) {
        setMode("idle");
        setError(getLoginErrorMessage(result.error));
        focusError();
        return;
      }

      window.location.assign(redirectPath);
    },
    [demo, focusError, redirectPath],
  );

  useEffect(() => {
    const currentForm = formRef.current;

    if (!currentForm) {
      return;
    }

    const form = currentForm;

    function handleSubmit(event: SubmitEvent) {
      event.preventDefault();
      void submitEmailSignIn(form);
    }

    currentForm.addEventListener("submit", handleSubmit);
    return () => currentForm.removeEventListener("submit", handleSubmit);
  }, [submitEmailSignIn]);

  async function handleGoogleSignIn() {
    if (demo === "auth-error") {
      setError("Google sign-in is unavailable for this demo state.");
      focusError();
      return;
    }

    setMode("google");
    setError(null);

    const callbackURL =
      typeof window === "undefined" ? redirectPath : `${window.location.origin}${redirectPath}`;
    const result = await authClient.signIn.social({ provider: "google", callbackURL });

    if (result.error) {
      setMode("idle");
      setError(getLoginErrorMessage(result.error));
      focusError();
    }
  }

  if (demo === "loading") {
    return (
      <main className="min-h-screen bg-background px-6 py-10 text-foreground">
        <div className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-6xl gap-8 lg:grid-cols-[1fr_28rem] lg:items-center">
          <Skeleton className="h-[28rem] rounded-[2rem]" />
          <Skeleton className="h-[32rem] rounded-[2rem]" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-background px-6 py-10 text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,90,0,0.14),transparent_32%),radial-gradient(circle_at_85%_15%,rgba(15,23,42,0.10),transparent_28%)]" />
      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full gap-8 lg:grid-cols-[1fr_28rem] lg:items-stretch">
          <section className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-[#0f172a] p-8 text-white shadow-2xl shadow-slate-950/20">
            <div className="absolute right-8 top-8 h-24 w-24 rounded-full border border-white/15" />
            <div className="absolute bottom-8 right-12 font-display text-[10rem] font-black leading-none text-white/5">
              CBE
            </div>
            <Badge variant="outline" className="border-white/20 text-white">
              Corral console
            </Badge>
            <h1 className="mt-8 max-w-xl font-display text-6xl font-black uppercase leading-[0.92] tracking-tight md:text-7xl">
              Sign in to Corral
            </h1>
            <p className="mt-6 max-w-2xl text-slate-300">
              Organizer access for Kovai race teams: registration, payments, WhatsApp ops, results,
              and certificates in one navy command shell.
            </p>
            <div className="mt-10 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <span className="block font-display text-3xl text-white">T+2</span>Settlement ready
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <span className="block font-display text-3xl text-white">5K</span>10K · 21K
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <span className="block font-display text-3xl text-white">1042</span>BIB-safe ops
              </div>
            </div>
          </section>

          <Card className="rounded-[2rem] shadow-2xl shadow-slate-950/10">
            <CardHeader>
              <CardTitle className="font-display text-3xl uppercase">Welcome back</CardTitle>
              <CardDescription>
                Use your Corral account. New organizers can self-register and verify email before
                creating an organizer profile.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form ref={formRef} noValidate>
                <FieldGroup>
                  {error ? (
                    <Alert ref={errorRef} tabIndex={-1} variant="destructive" aria-live="polite">
                      <AlertTitle>Sign-in failed</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  ) : null}
                  {verified ? (
                    <Alert className="border-success/30 bg-success/10 text-success-text">
                      <AlertTitle>Email verified</AlertTitle>
                      <AlertDescription>
                        Sign in to continue to organizer onboarding.
                      </AlertDescription>
                    </Alert>
                  ) : null}

                  <Field>
                    <FieldLabel htmlFor={emailId}>Email</FieldLabel>
                    <Input
                      id={emailId}
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="priya@kovairoadclub.in"
                      disabled={isSubmitting}
                      aria-invalid={Boolean(error && demo === "validation-error")}
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor={passwordId}>Password</FieldLabel>
                    <Input
                      id={passwordId}
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      disabled={isSubmitting}
                      aria-invalid={Boolean(error && demo === "validation-error")}
                      required
                    />
                    <FieldDescription>
                      Participants stay passwordless; this console is for organizer teams.
                    </FieldDescription>
                  </Field>

                  <FieldError>{error}</FieldError>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {mode === "email" ? <Spinner /> : null}
                    Sign in with email
                  </Button>

                  <FieldSeparator>or</FieldSeparator>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleSignIn}
                    disabled={isSubmitting}
                  >
                    {mode === "google" ? <Spinner /> : null}
                    Continue with Google
                  </Button>

                  <p className="text-center text-sm text-muted-foreground">
                    New organizer?{" "}
                    <Link
                      to="/signup"
                      className="font-semibold text-brand-orange-strong underline underline-offset-4"
                    >
                      Create an account
                    </Link>
                  </p>

                  {import.meta.env.DEV ? (
                    <div className="flex flex-wrap justify-between gap-2 text-sm">
                      <Link
                        to="/login"
                        search={{ demo: "validation-error" }}
                        className="text-brand-orange-strong underline underline-offset-4"
                      >
                        Validation demo
                      </Link>
                      <Link
                        to="/login"
                        search={{ demo: "auth-error" }}
                        className="text-brand-orange-strong underline underline-offset-4"
                      >
                        Auth error demo
                      </Link>
                      <Link
                        to="/onboarding"
                        search={{ demo: "default" }}
                        className="text-brand-orange-strong underline underline-offset-4"
                      >
                        Open onboarding
                      </Link>
                    </div>
                  ) : null}
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

function getLoginErrorMessage(error: { code?: string; message?: string }) {
  if (
    error.code === "INVALID_EMAIL_OR_PASSWORD" ||
    error.code === "INVALID_CREDENTIALS" ||
    error.message?.toLowerCase().includes("password")
  ) {
    return "Incorrect email or password.";
  }

  if (error.code === "USER_BANNED") {
    return "This account is disabled. Contact a Corral admin.";
  }

  if (
    error.code === "EMAIL_NOT_VERIFIED" ||
    error.message?.toLowerCase().includes("verify") ||
    error.message?.toLowerCase().includes("verified")
  ) {
    return "Verify your email before signing in. Check your inbox for the Corral verification link.";
  }

  return error.message || "Sign-in failed. Try again.";
}
