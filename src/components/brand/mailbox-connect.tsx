"use client";

import { useState } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Mail, Trash2 } from "lucide-react";
import { fetchJson, readJson } from "@/lib/api-client";


type Provider = "GMAIL" | "OUTLOOK" | "SMTP";

interface MailState {
  connected: boolean;
  encryptionConfigured: boolean;
  presets: Record<Provider, { label: string; host: string; port: number; secure: boolean; help: string }>;
  account: {
    provider: Provider;
    fromName: string | null;
    fromAddress: string;
    host: string;
    port: number;
    username: string;
    verifiedAt: string | null;
    lastError: string | null;
  } | null;
}

export function MailboxConnect() {
  const { data, mutate } = useSWR<MailState>("/api/mail-account", fetchJson);
  const [provider, setProvider] = useState<Provider>("GMAIL");
  const [form, setForm] = useState({ fromName: "", fromAddress: "", username: "", password: "", host: "", port: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!data) return null;
  const preset = data.presets[provider];

  async function connect(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/mail-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          fromName: form.fromName,
          fromAddress: form.fromAddress,
          username: form.username || form.fromAddress,
          password: form.password,
          host: form.host || preset.host,
          port: form.port ? Number(form.port) : preset.port,
        }),
      });
      const body = await readJson(res);
      if (!res.ok || body.verified === false) throw new Error(body.error || "Couldn't connect to that mailbox");
      setForm({ fromName: "", fromAddress: "", username: "", password: "", host: "", port: "" });
      await mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't connect to that mailbox");
      await mutate();
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    await fetch("/api/mail-account", { method: "DELETE" });
    await mutate();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sending mailbox</CardTitle>
        <CardDescription>
          Connect the mailbox your bids should go out from, so a buyer sees the bid arrive from your own
          address. Tenderiza only ever sends when you click send on a specific bid.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {!data.encryptionConfigured && (
          <Alert variant="destructive">
            <AlertDescription>
              <code>MAIL_ENCRYPTION_KEY</code> isn&apos;t set on the server, so a mailbox password can&apos;t be
              stored safely yet. Add it as an environment variable, then connect a mailbox.
            </AlertDescription>
          </Alert>
        )}

        {data.account ? (
          <div className="grid gap-3">
            <div className="flex items-start justify-between gap-4 border border-border p-4">
              <div className="flex gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-medium">{data.account.fromAddress}</p>
                  <p className="text-xs text-muted-foreground">
                    {data.presets[data.account.provider].label} · {data.account.host}:{data.account.port}
                  </p>
                  {data.account.verifiedAt ? (
                    <p className="mt-1 flex items-center gap-1 text-xs text-success">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Connection tested {new Date(data.account.verifiedAt).toLocaleDateString("en-ZA")}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-destructive">{data.account.lastError || "Not verified yet"}</p>
                  )}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={disconnect}>
                <Trash2 className="h-4 w-4" /> Disconnect
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={connect} className="grid gap-4">
            <div className="grid gap-1.5">
              <Label>Provider</Label>
              <Select value={provider} onValueChange={(v) => setProvider(v as Provider)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(data.presets) as Provider[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {data.presets[key].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{preset.help}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="fromAddress">Your email address</Label>
                <Input
                  id="fromAddress"
                  type="email"
                  required
                  value={form.fromAddress}
                  onChange={(e) => setForm((f) => ({ ...f, fromAddress: e.target.value }))}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="password">
                  {provider === "GMAIL" ? "App password" : "Password"}
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                />
              </div>
            </div>

            {provider === "SMTP" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="host">Outgoing server (SMTP)</Label>
                  <Input
                    id="host"
                    required
                    placeholder="mail.yourdomain.co.za"
                    value={form.host}
                    onChange={(e) => setForm((f) => ({ ...f, host: e.target.value }))}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="port">Port</Label>
                  <Input
                    id="port"
                    placeholder="587"
                    value={form.port}
                    onChange={(e) => setForm((f) => ({ ...f, port: e.target.value }))}
                  />
                </div>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={busy || !data.encryptionConfigured} className="justify-self-start">
              {busy ? "Testing connection…" : "Connect mailbox"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Your password is encrypted before it&apos;s stored and is never shown again. We test the connection
              immediately so you know it works before a deadline depends on it.
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
