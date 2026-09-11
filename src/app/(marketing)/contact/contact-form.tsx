"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const FIELD =
  "h-11 w-full border border-[var(--rule)] bg-white px-3 text-[15px] outline-none transition-colors focus:border-[var(--field)] focus:ring-2 focus:ring-[var(--field)]/15";

export function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "That didn't send. Try again.");
      setStatus("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn't send. Try again.");
      setStatus("idle");
    }
  }

  if (status === "sent") {
    return (
      <div className="flex flex-col items-start gap-3 border-l-4 border-[var(--green)] bg-[var(--green)]/5 p-6">
        <CheckCircle2 className="h-6 w-6 text-[var(--green)]" />
        <p className="text-[17px] font-bold text-[var(--ink)]">Message received</p>
        <p className="text-[15px] text-[var(--ink-2)]">We&apos;ll reply within one business day.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="name" className="field-label text-[var(--ink-2)]">
            Name
          </label>
          <input id="name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={FIELD} />
        </div>
        <div className="grid gap-2">
          <label htmlFor="email" className="field-label text-[var(--ink-2)]">
            Email
          </label>
          <input id="email" type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className={FIELD} />
        </div>
      </div>
      <div className="grid gap-2">
        <label htmlFor="company" className="field-label text-[var(--ink-2)]">
          Company · optional
        </label>
        <input id="company" value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} className={FIELD} />
      </div>
      <div className="grid gap-2">
        <label htmlFor="message" className="field-label text-[var(--ink-2)]">
          Message
        </label>
        <textarea
          id="message"
          required
          rows={5}
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          className="w-full border border-[var(--rule)] bg-white p-3 text-[15px] outline-none transition-colors focus:border-[var(--field)] focus:ring-2 focus:ring-[var(--field)]/15"
        />
      </div>

      {error && (
        <p role="alert" className="border-l-4 border-[var(--red)] bg-[var(--red)]/5 px-3 py-2 text-[14px] text-[var(--red)]">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="group inline-flex items-center justify-center gap-2 bg-[var(--field)] px-7 py-4 text-[15px] font-bold text-white transition-transform hover:scale-[1.02] disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : "Send message"}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </button>
    </form>
  );
}
