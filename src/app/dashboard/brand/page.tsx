"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCompany } from "@/lib/use-company";
import { Upload, Trash2, Check } from "lucide-react";

const DEFAULT_PRIMARY = "#053B2C";
const DEFAULT_ACCENT = "#FFB612";

const BANK_FIELDS = [
  { key: "bankAccountName", label: "Account holder" },
  { key: "bankName", label: "Bank" },
  { key: "bankAccountNumber", label: "Account number" },
  { key: "bankBranchCode", label: "Branch code" },
  { key: "bankAccountType", label: "Account type" },
] as const;

/** Local storage keys need the API route to serve them; blob URLs are direct. */
function logoSrc(logoUrl: string) {
  return logoUrl.startsWith("http") ? logoUrl : `/api/documents/file/${logoUrl}`;
}

export default function BrandPage() {
  const { company, isLoading, updateCompany, mutate } = useCompany();
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isLoading || !company) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const primary = company.brandPrimaryColor || DEFAULT_PRIMARY;
  const accent = company.brandAccentColor || DEFAULT_ACCENT;

  async function save(fields: Record<string, unknown>) {
    setError(null);
    try {
      await updateCompany(fields);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save that. Try again.");
    }
  }

  async function uploadLogo(file: File) {
    setUploading(true);
    setError(null);
    try {
      const data = new FormData();
      data.append("file", file);
      const res = await fetch("/api/company/logo", { method: "POST", body: data });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Upload failed");
      await mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function removeLogo() {
    await fetch("/api/company/logo", { method: "DELETE" });
    await mutate();
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Brand</h1>
        <p className="text-sm text-muted-foreground">
          Your logo, colours and banking details go onto every document Tenderiza generates for you —
          quotations, proposals and checklists. A procuring entity&apos;s own forms are never restyled.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {saved && (
        <Alert>
          <AlertDescription className="flex items-center gap-2">
            <Check className="h-4 w-4 text-success" /> Saved
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Logo</CardTitle>
              <CardDescription>PNG or JPEG, under 2MB. Appears top-left on your letterhead.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {company.logoUrl ? (
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-40 shrink-0 border border-border bg-white">
                    <Image
                      src={logoSrc(company.logoUrl)}
                      alt="Your logo"
                      fill
                      unoptimized
                      className="object-contain p-1"
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={removeLogo}>
                    <Trash2 className="h-4 w-4" /> Remove
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No logo yet.</p>
              )}
              <input
                ref={fileInput}
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadLogo(file);
                  e.target.value = "";
                }}
              />
              <Button onClick={() => fileInput.current?.click()} disabled={uploading} className="justify-self-start">
                <Upload className="h-4 w-4" />
                {uploading ? "Uploading…" : company.logoUrl ? "Replace logo" : "Upload logo"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Colours</CardTitle>
              <CardDescription>Used for headings and rules on your documents.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {[
                { key: "brandPrimaryColor", label: "Primary", value: primary },
                { key: "brandAccentColor", label: "Accent", value: accent },
              ].map((field) => (
                <div key={field.key} className="grid gap-1.5">
                  <Label htmlFor={field.key}>{field.label}</Label>
                  <div className="flex items-center gap-2">
                    <input
                      id={field.key}
                      type="color"
                      value={field.value}
                      onChange={(e) => save({ [field.key]: e.target.value })}
                      className="h-9 w-12 cursor-pointer rounded border border-input bg-card"
                    />
                    <Input
                      value={field.value}
                      onChange={(e) => save({ [field.key]: e.target.value })}
                      className="font-mono"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Banking details</CardTitle>
              <CardDescription>
                Quotations and several SBD forms ask for these directly, so they&apos;re filled in for you.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {BANK_FIELDS.map((field) => (
                <div key={field.key} className="grid gap-1.5">
                  <Label htmlFor={field.key}>{field.label}</Label>
                  <Input
                    id={field.key}
                    defaultValue={(company[field.key] as string) ?? ""}
                    onBlur={(e) => save({ [field.key]: e.target.value })}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Live letterhead preview — mirrors src/lib/letterhead.ts */}
        <Card className="h-fit lg:sticky lg:top-6">
          <CardHeader>
            <CardTitle className="text-base">Letterhead preview</CardTitle>
            <CardDescription>How the top of your generated documents will look.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border border-border bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                {company.logoUrl ? (
                  <div className="relative h-12 w-32 shrink-0">
                    <Image src={logoSrc(company.logoUrl)} alt="" fill unoptimized className="object-contain object-left" />
                  </div>
                ) : (
                  <p className="text-lg font-bold" style={{ color: primary }}>
                    {company.companyName || "Your company"}
                  </p>
                )}
                <div className="text-right text-[10px] leading-relaxed text-neutral-600">
                  {company.companyName && <p className="font-semibold text-neutral-900">{company.companyName}</p>}
                  {company.registrationNumber && <p>Reg: {company.registrationNumber}</p>}
                  {company.vatNumber && <p>VAT: {company.vatNumber}</p>}
                  {company.contactEmail && <p>{company.contactEmail}</p>}
                  {company.contactPhone && <p>{company.contactPhone}</p>}
                  {company.website && <p>{company.website}</p>}
                </div>
              </div>
              <div className="mt-4 h-1" style={{ background: primary }} />
              <div className="h-1 w-24" style={{ background: accent }} />
              <p className="mt-6 text-base font-bold" style={{ color: primary }}>
                Quotation
              </p>
              <p className="mt-1 text-[11px] text-neutral-500">
                RFQ · Supply of office furniture to regional offices
              </p>
              <div className="mt-4 grid gap-1.5">
                {[100, 88, 94, 70].map((w, i) => (
                  <div key={i} className="h-1.5 rounded bg-neutral-200" style={{ width: `${w}%` }} />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
