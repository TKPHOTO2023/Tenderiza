"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowRight, MailCheck } from "lucide-react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Something went wrong");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div>
        <MailCheck className="h-8 w-8 text-[var(--field)]" />
        <h1 className="mt-4 text-[22px] font-bold text-[var(--ink)]">Check your email</h1>
        <p className="mt-1.5 text-[15px] text-[var(--ink-2)]">
          If <span className="font-semibold text-[var(--ink)]">{email}</span> has an account, a reset link is on
          its way. It works once and expires in an hour.
        </p>
        <p className="mt-4 text-sm text-[var(--ink-2)]">
          Nothing after a few minutes? Check your spam folder, or{" "}
          <button onClick={() => setSent(false)} className="font-semibold text-[var(--field)] underline">
            try a different address
          </button>
          .
        </p>
        <p className="mt-6 text-center text-sm text-[var(--ink-2)]">
          <Link href="/login" className="font-semibold text-[var(--field)] underline">
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-[22px] font-bold text-[var(--ink)]">Reset your password</h1>
      <p className="mt-1.5 text-[15px] text-[var(--ink-2)]">
        Enter your email address and we&apos;ll send you a link to choose a new password.
      </p>

      <form onSubmit={submit} className="mt-6 grid gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Sending…" : "Send reset link"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--ink-2)]">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-[var(--field)] underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
