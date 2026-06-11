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
import { Spinner } from "@corral/ui/components/spinner";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { FormEvent } from "react";
import { useId, useRef, useState } from "react";

import { authClient } from "../lib/auth";

type SignupErrors = Partial<Record<"name" | "email" | "password", string>>;

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function SignupPage() {
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const errorRef = useRef<HTMLDivElement>(null);
  const [errors, setErrors] = useState<SignupErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const nextErrors: SignupErrors = {};

    if (!name) nextErrors.name = "Enter your name.";
    if (!email) {
      nextErrors.email = "Enter your work email.";
    } else if (!isEmail(email)) {
      nextErrors.email = "Enter a valid work email.";
    }
    if (password.length < 10) nextErrors.password = "Use at least 10 characters.";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setError("Fix the highlighted fields to create your account.");
      window.requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    setError(null);

    const callbackURL =
      typeof window === "undefined"
        ? "/login?verified=1"
        : `${window.location.origin}/login?verified=1`;
    const result = await authClient.signUp.email({ name, email, password, callbackURL });

    if (result.error) {
      setIsSubmitting(false);
      setError(getSignupErrorMessage(result.error));
      window.requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }

    window.location.assign(`/check-email?email=${encodeURIComponent(email)}`);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#faf7f0] px-6 py-10 text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(115deg,rgba(15,23,42,0.08)_0_1px,transparent_1px_72px),radial-gradient(circle_at_18%_12%,rgba(255,90,0,0.18),transparent_30%),radial-gradient(circle_at_82%_20%,rgba(15,23,42,0.10),transparent_26%)]" />
      <div className="relative mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-6xl gap-8 lg:grid-cols-[1fr_29rem] lg:items-center">
        <section className="relative overflow-hidden rounded-[2rem] bg-[#101827] p-8 text-white shadow-2xl shadow-slate-950/20">
          <div className="absolute -right-16 top-12 h-56 w-56 rounded-full border border-white/10" />
          <div className="absolute -bottom-10 left-8 font-display text-[12rem] font-black leading-none text-white/5">
            01
          </div>
          <Badge variant="outline" className="border-white/20 text-white">
            Organizer self-signup
          </Badge>
          <h1 className="mt-8 max-w-2xl font-display text-6xl font-black uppercase leading-[0.9] tracking-tight md:text-7xl">
            Build your race command room
          </h1>
          <p className="mt-6 max-w-2xl text-slate-300">
            Create your Corral owner account, verify email, then submit the organizer profile for
            platform review before public launch.
          </p>
          <div className="mt-10 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <span className="block font-display text-3xl text-white">Verify</span>Email first
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <span className="block font-display text-3xl text-white">Owner</span>Auto-assigned
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <span className="block font-display text-3xl text-white">Review</span>Before launch
            </div>
          </div>
        </section>

        <Card className="rounded-[2rem] shadow-2xl shadow-slate-950/10">
          <CardHeader>
            <CardTitle className="font-display text-3xl uppercase">
              Create organizer account
            </CardTitle>
            <CardDescription>
              Start with identity only. Club, GST, billing, and support details come after email
              verification.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} noValidate>
              <FieldGroup>
                {error ? (
                  <Alert ref={errorRef} tabIndex={-1} variant="destructive" aria-live="polite">
                    <AlertTitle>Signup needs attention</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : null}

                <Field>
                  <FieldLabel htmlFor={nameId}>Your name</FieldLabel>
                  <Input
                    id={nameId}
                    name="name"
                    autoComplete="name"
                    placeholder="Priya Raman"
                    disabled={isSubmitting}
                    aria-invalid={Boolean(errors.name)}
                    required
                  />
                  <FieldError>{errors.name}</FieldError>
                </Field>

                <Field>
                  <FieldLabel htmlFor={emailId}>Work email</FieldLabel>
                  <Input
                    id={emailId}
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="priya@kovairoadclub.in"
                    disabled={isSubmitting}
                    aria-invalid={Boolean(errors.email)}
                    required
                  />
                  <FieldError>{errors.email}</FieldError>
                </Field>

                <Field>
                  <FieldLabel htmlFor={passwordId}>Password</FieldLabel>
                  <Input
                    id={passwordId}
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    minLength={10}
                    disabled={isSubmitting}
                    aria-invalid={Boolean(errors.password)}
                    required
                  />
                  <FieldDescription>Use at least 10 characters.</FieldDescription>
                  <FieldError>{errors.password}</FieldError>
                </Field>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Spinner /> : null}
                  Create account
                </Button>

                <FieldSeparator>already registered?</FieldSeparator>

                <Button asChild type="button" variant="outline" className="w-full">
                  <Link to="/login" search={{ demo: "default" }}>
                    Sign in
                  </Link>
                </Button>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function getSignupErrorMessage(error: { code?: string; message?: string }) {
  const message = error.message?.toLowerCase() ?? "";

  if (message.includes("already") || message.includes("exists")) {
    return "If an account exists for this email, sign in or use password reset.";
  }

  if (message.includes("password")) {
    return "Use a stronger password with at least 10 characters.";
  }

  return error.message || "Could not create the account. Try again.";
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
