"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowRight } from "lucide-react";

export function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError("Those two passwords don't match.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: form.password }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Something went wrong");
      // The reset dropped every session, so signing in again is the next step.
      router.push("/login?reset=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <div>
        <h1 className="text-[22px] font-bold text-[var(--ink)]">That link looks incomplete</h1>
        <p className="mt-1.5 text-[15px] text-[var(--ink-2)]">
          Open the link straight from the email, or request a new one.
        </p>
        <p className="mt-6">
          <Link href="/forgot-password" className="font-semibold text-[var(--field)] underline">
            Request a new link
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-[22px] font-bold text-[var(--ink)]">Choose a new password</h1>
      <p className="mt-1.5 text-[15px] text-[var(--ink-2)]">
        This signs you out everywhere else, so anyone else using your account will need the new password.
      </p>

      <form onSubmit={submit} className="mt-6 grid gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type="password"
            required
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          />
          <p className="text-xs text-[var(--ink-2)]">At least 8 characters.</p>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="confirm">Confirm new password</Label>
          <Input
            id="confirm"
            type="password"
            required
            autoComplete="new-password"
            value={form.confirm}
            onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Saving…" : "Set new password"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
