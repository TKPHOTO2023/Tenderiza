"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowRight } from "lucide-react";
import { readJson } from "@/lib/api-client";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignup = mode === "signup";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      await readJson(res);

      // A new account goes to onboarding; a returning one to wherever it was headed.
      const next = params.get("next");
      router.push(isSignup ? "/onboarding" : next || "/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="text-[22px] font-bold text-[var(--ink)]">
        {isSignup ? "Start your free trial" : "Welcome back"}
      </h1>
      <p className="mt-1.5 text-[15px] text-[var(--ink-2)]">
        {isSignup
          ? "No card needed. Two AI-drafted bids a month on the free plan."
          : "Sign in to your Tenderiza account."}
      </p>

      {!isSignup && params.get("reset") === "1" && (
        <Alert className="mt-5">
          <AlertDescription>Password changed. Sign in with your new one.</AlertDescription>
        </Alert>
      )}

      <form onSubmit={submit} className="mt-6 grid gap-4">
        {isSignup && (
          <div className="grid gap-1.5">
            <Label htmlFor="name">Your name</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
        )}

        <div className="grid gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </div>

        <div className="grid gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            {!isSignup && (
              <Link href="/forgot-password" className="text-xs font-semibold text-[var(--field)] underline">
                Forgot password?
              </Link>
            )}
          </div>
          <Input
            id="password"
            type="password"
            required
            autoComplete={isSignup ? "new-password" : "current-password"}
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          />
          {isSignup && <p className="text-xs text-[var(--ink-2)]">At least 8 characters.</p>}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Just a moment…" : isSignup ? "Create account" : "Sign in"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--ink-2)]">
        {isSignup ? "Already have an account? " : "New to Tenderiza? "}
        <Link href={isSignup ? "/login" : "/signup"} className="font-semibold text-[var(--field)] underline">
          {isSignup ? "Sign in" : "Start free"}
        </Link>
      </p>
    </div>
  );
}
