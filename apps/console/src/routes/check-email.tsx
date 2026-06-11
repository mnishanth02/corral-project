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
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { authClient } from "../lib/auth";

type CheckEmailSearch = {
  email?: string;
};

export const Route = createFileRoute("/check-email")({
  validateSearch: (search): CheckEmailSearch => ({
    email: typeof search.email === "string" ? search.email : undefined,
  }),
  component: CheckEmailPage,
});

function CheckEmailPage() {
  const { email } = Route.useSearch();
  const [status, setStatus] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [isResending, setIsResending] = useState(false);

  async function handleResend() {
    if (!email) {
      setStatus({
        tone: "error",
        message: "Enter your email again on signup so we know where to resend the link.",
      });
      return;
    }

    setIsResending(true);
    setStatus(null);

    const callbackURL =
      typeof window === "undefined"
        ? "/login?verified=1"
        : `${window.location.origin}/login?verified=1`;
    const result = await authClient.sendVerificationEmail({ email, callbackURL });

    setIsResending(false);

    if (result.error) {
      setStatus({
        tone: "error",
        message: result.error.message || "Could not resend the verification link. Try again.",
      });
      return;
    }

    setStatus({
      tone: "success",
      message: "Verification link resent. Check your inbox again.",
    });
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#101827] px-6 py-10 text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(255,90,0,0.22),transparent_32%),radial-gradient(circle_at_82%_15%,rgba(255,255,255,0.08),transparent_26%)]" />
      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl items-center">
        <Card className="w-full rounded-[2rem] border-white/10 bg-white text-foreground shadow-2xl shadow-slate-950/30">
          <CardHeader>
            <Badge className="w-fit">Email verification</Badge>
            <CardTitle className="font-display text-5xl uppercase leading-none">
              Check your inbox
            </CardTitle>
            <CardDescription className="text-base">
              {email
                ? `We sent a verification link to ${email}.`
                : "We sent a verification link to the email you used for signup."}{" "}
              Verify first, then sign in to create your organizer profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            <Alert className="border-info/30 bg-info/10 text-info-text">
              <AlertTitle>Local development note</AlertTitle>
              <AlertDescription>
                In local mode, the API logs verification links instead of sending real email. Use a
                real provider before enabling public signup outside development.
              </AlertDescription>
            </Alert>
            {status ? (
              <Alert
                variant={status.tone === "error" ? "destructive" : "default"}
                aria-live="polite"
              >
                <AlertTitle>
                  {status.tone === "error" ? "Resend failed" : "Verification email sent"}
                </AlertTitle>
                <AlertDescription>{status.message}</AlertDescription>
              </Alert>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={handleResend} disabled={isResending || !email}>
                {isResending ? "Resending..." : "Resend verification email"}
              </Button>
              <Button asChild>
                <Link to="/login" search={{ demo: "default" }}>
                  Back to sign in
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/signup">Use a different email</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
