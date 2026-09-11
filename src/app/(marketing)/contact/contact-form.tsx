"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "" });
  const [status, setStatus] = useState<"idle" | "submitting" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Something went wrong");
      setStatus("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-[#007A4D]/20 bg-[#007A4D]/5 p-10 text-center">
        <CheckCircle2 className="h-8 w-8 text-[#007A4D]" />
        <p className="font-semibold text-slate-900">Message sent</p>
        <p className="text-sm text-slate-500">We&apos;ll get back to you as soon as we can.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <label className="text-sm font-medium text-slate-700">Name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#002395] focus:ring-2 focus:ring-[#002395]/20"
          />
        </div>
        <div className="grid gap-1.5">
          <label className="text-sm font-medium text-slate-700">Email</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#002395] focus:ring-2 focus:ring-[#002395]/20"
          />
        </div>
      </div>
      <div className="grid gap-1.5">
        <label className="text-sm font-medium text-slate-700">Company (optional)</label>
        <input
          value={form.company}
          onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#002395] focus:ring-2 focus:ring-[#002395]/20"
        />
      </div>
      <div className="grid gap-1.5">
        <label className="text-sm font-medium text-slate-700">Message</label>
        <textarea
          required
          rows={4}
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#002395] focus:ring-2 focus:ring-[#002395]/20"
        />
      </div>
      {error && <p className="text-sm text-[#DE3831]">{error}</p>}
      <button
        type="submit"
        disabled={status === "submitting"}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-[#002395] px-6 py-3 text-sm font-semibold text-white transition-transform hover:scale-105 disabled:opacity-60"
      >
        {status === "submitting" ? "Sending…" : "Send message"}
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}
