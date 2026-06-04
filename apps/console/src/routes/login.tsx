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
import type { FormEvent } from "react";
import { useId, useRef, useState } from "react";

import { getSafeRedirectPath } from "../lib/auth";
import { personaStorageKey } from "../mocks";

type LoginDemo = "default" | "loading" | "validation-error" | "auth-error";

type LoginSearch = {
  redirect?: string;
  demo: LoginDemo;
};

type LoginMode = "idle" | "email" | "google";

const loginDemos = ["default", "loading", "validation-error", "auth-error"] as const;

export const Route = createFileRoute("/login")({
  validateSearch: (search): LoginSearch => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
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
  const errorRef = useRef<HTMLDivElement>(null);
  const { redirect, demo } = Route.useSearch();
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

  async function finishMockSignIn(nextMode: LoginMode) {
    setMode(nextMode);
    setError(null);
    window.localStorage.setItem(personaStorageKey, "org-owner");
    await new Promise((resolve) => window.setTimeout(resolve, 250));
    window.location.assign(redirectPath);
  }

  async function handleEmailSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password || demo === "validation-error") {
      setError("Enter an email and password to continue.");
      window.requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }

    if (demo === "auth-error") {
      setError("Incorrect email or password.");
      window.requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }

    await finishMockSignIn("email");
  }

  async function handleGoogleSignIn() {
    if (demo === "auth-error") {
      setError("Google sign-in is unavailable for this demo state.");
      window.requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }

    await finishMockSignIn("google");
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
                Email/password and Google sign-in are mocked locally. No backend or provider network
                call is made.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEmailSignIn} noValidate>
                <FieldGroup>
                  {error ? (
                    <Alert ref={errorRef} tabIndex={-1} variant="destructive" aria-live="polite">
                      <AlertTitle>Sign-in failed</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
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
                      Accounts are created by Corral admins. Participants stay passwordless.
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
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
