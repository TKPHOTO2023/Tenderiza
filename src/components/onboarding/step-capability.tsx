"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/multi-select";
import { PROVINCES } from "@/lib/constants";
import { Plus, X } from "lucide-react";
import type { CompanyFull } from "@/lib/api-types";

export interface ReferenceDraft {
  id?: string;
  clientName: string;
  projectDescription: string;
  value: string;
  year: string;
}

export interface CapabilityFormValue {
  categoryIds: string[];
  operatingProvinces: string[];
  teamSize: string;
  capacityNotes: string;
  references: ReferenceDraft[];
}

export function capabilityFromCompany(company?: CompanyFull): CapabilityFormValue {
  return {
    categoryIds: (company?.categories ?? []).map((c) => c.categoryId),
    operatingProvinces: company?.operatingProvinces ?? [],
    teamSize: company?.teamSize ? String(company.teamSize) : "",
    capacityNotes: company?.capacityNotes ?? "",
    references: (company?.references ?? []).map((r) => ({
      id: r.id,
      clientName: r.clientName,
      projectDescription: r.projectDescription,
      value: r.value ? String(r.value) : "",
      year: r.year ? String(r.year) : "",
    })),
  };
}

export function StepCapability({
  value,
  onChange,
  categories,
}: {
  value: CapabilityFormValue;
  onChange: (value: CapabilityFormValue) => void;
  categories: { id: string; name: string }[];
}) {
  const [local, setLocal] = useState(value);

  function set<K extends keyof CapabilityFormValue>(key: K, val: CapabilityFormValue[K]) {
    const next = { ...local, [key]: val };
    setLocal(next);
    onChange(next);
  }

  function addReference() {
    set("references", [
      ...local.references,
      { clientName: "", projectDescription: "", value: "", year: "" },
    ]);
  }

  function updateReference(index: number, field: keyof ReferenceDraft, val: string) {
    const next = local.references.map((r, i) => (i === index ? { ...r, [field]: val } : r));
    set("references", next);
  }

  function removeReference(index: number) {
    set("references", local.references.filter((_, i) => i !== index));
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-1.5">
        <Label>Sector / industry categories *</Label>
        <p className="text-sm text-muted-foreground">
          Select every category your business can realistically deliver on — this drives tender matching later.
        </p>
        <MultiSelect
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
          selected={local.categoryIds}
          onChange={(v) => set("categoryIds", v)}
          columns={2}
        />
      </div>

      <div className="grid gap-1.5">
        <Label>Provinces/regions willing to operate in</Label>
        <MultiSelect
          options={PROVINCES.map((p) => ({ value: p.value, label: p.label }))}
          selected={local.operatingProvinces}
          onChange={(v) => set("operatingProvinces", v)}
          columns={3}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="teamSize">Team size (approx. employees)</Label>
          <Input
            id="teamSize"
            type="number"
            min={0}
            placeholder="e.g. 15"
            value={local.teamSize}
            onChange={(e) => set("teamSize", e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="capacityNotes">Capacity notes</Label>
          <Input
            id="capacityNotes"
            placeholder="e.g. Can run 2-3 concurrent projects up to R5m each"
            value={local.capacityNotes}
            onChange={(e) => set("capacityNotes", e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-lg border border-border p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Past project references</p>
            <p className="text-sm text-muted-foreground">Used to demonstrate track record in proposals.</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addReference}>
            <Plus className="h-4 w-4" /> Add reference
          </Button>
        </div>
        <div className="grid gap-4">
          {local.references.map((r, i) => (
            <div key={i} className="grid gap-2 rounded-md border border-border p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="grid flex-1 gap-3 sm:grid-cols-3">
                  <div className="grid gap-1.5">
                    <Label>Client name</Label>
                    <Input
                      placeholder="e.g. City of Tshwane"
                      value={r.clientName}
                      onChange={(e) => updateReference(i, "clientName", e.target.value)}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Contract value (R)</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 2500000"
                      value={r.value}
                      onChange={(e) => updateReference(i, "value", e.target.value)}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Year</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 2023"
                      value={r.year}
                      onChange={(e) => updateReference(i, "year", e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-6"
                  onClick={() => removeReference(i)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-1.5">
                <Label>Project description</Label>
                <Textarea
                  rows={2}
                  placeholder="e.g. Resurfacing of 4km municipal road including stormwater upgrades"
                  value={r.projectDescription}
                  onChange={(e) => updateReference(i, "projectDescription", e.target.value)}
                />
              </div>
            </div>
          ))}
          {local.references.length === 0 && (
            <p className="text-sm text-muted-foreground">No references added yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
