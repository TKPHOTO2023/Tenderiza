"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BBBEE_LEVELS, CIDB_CLASSES_OF_WORK, CIDB_GRADES, CSD_STATUSES } from "@/lib/constants";
import { Plus, X } from "lucide-react";
import type { CompanyFull } from "@/lib/api-types";

export interface AccreditationDraft {
  id?: string;
  name: string;
  referenceNo: string;
  expiryDate: string;
}

export interface ComplianceFormValue {
  csdRegistrationNumber: string;
  csdStatus: string;
  taxComplianceStatusPin: string;
  taxComplianceExpiry: string;
  bbbeeLevel: string;
  bbbeeCertificateExpiry: string;
  cidbRegistrationNumber: string;
  cidbGrade: string;
  cidbClassOfWork: string;
  accreditations: AccreditationDraft[];
}

function toDateInput(value: Date | string | null | undefined) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export function complianceFromCompany(company?: CompanyFull): ComplianceFormValue {
  return {
    csdRegistrationNumber: company?.csdRegistrationNumber ?? "",
    csdStatus: company?.csdStatus ?? "",
    taxComplianceStatusPin: company?.taxComplianceStatusPin ?? "",
    taxComplianceExpiry: toDateInput(company?.taxComplianceExpiry),
    bbbeeLevel: company?.bbbeeLevel ?? "",
    bbbeeCertificateExpiry: toDateInput(company?.bbbeeCertificateExpiry),
    cidbRegistrationNumber: company?.cidbRegistrationNumber ?? "",
    cidbGrade: company?.cidbGrade ?? "",
    cidbClassOfWork: company?.cidbClassOfWork ?? "",
    accreditations: (company?.accreditations ?? []).map((a) => ({
      id: a.id,
      name: a.name,
      referenceNo: a.referenceNo ?? "",
      expiryDate: toDateInput(a.expiryDate),
    })),
  };
}

export function StepCompliance({
  value,
  onChange,
}: {
  value: ComplianceFormValue;
  onChange: (value: ComplianceFormValue) => void;
}) {
  const [local, setLocal] = useState(value);

  function set<K extends keyof ComplianceFormValue>(key: K, val: ComplianceFormValue[K]) {
    const next = { ...local, [key]: val };
    setLocal(next);
    onChange(next);
  }

  function addAccreditation() {
    set("accreditations", [...local.accreditations, { name: "", referenceNo: "", expiryDate: "" }]);
  }

  function updateAccreditation(index: number, field: keyof AccreditationDraft, val: string) {
    const next = local.accreditations.map((a, i) => (i === index ? { ...a, [field]: val } : a));
    set("accreditations", next);
  }

  function removeAccreditation(index: number) {
    set("accreditations", local.accreditations.filter((_, i) => i !== index));
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="csdRegistrationNumber">CSD registration number</Label>
          <Input
            id="csdRegistrationNumber"
            placeholder="e.g. MAAA0123456"
            value={local.csdRegistrationNumber}
            onChange={(e) => set("csdRegistrationNumber", e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="csdStatus">CSD status</Label>
          <Select value={local.csdStatus} onValueChange={(v) => set("csdStatus", v)}>
            <SelectTrigger id="csdStatus">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {CSD_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="taxComplianceStatusPin">Tax Compliance Status (TCS) PIN</Label>
          <Input
            id="taxComplianceStatusPin"
            placeholder="e.g. 1234567890"
            value={local.taxComplianceStatusPin}
            onChange={(e) => set("taxComplianceStatusPin", e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="taxComplianceExpiry">TCS PIN expiry date</Label>
          <Input
            id="taxComplianceExpiry"
            type="date"
            value={local.taxComplianceExpiry}
            onChange={(e) => set("taxComplianceExpiry", e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="bbbeeLevel">B-BBEE level</Label>
          <Select value={local.bbbeeLevel} onValueChange={(v) => set("bbbeeLevel", v)}>
            <SelectTrigger id="bbbeeLevel">
              <SelectValue placeholder="Select B-BBEE level" />
            </SelectTrigger>
            <SelectContent>
              {BBBEE_LEVELS.map((l) => (
                <SelectItem key={l.value} value={l.value}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="bbbeeCertificateExpiry">B-BBEE certificate expiry date</Label>
          <Input
            id="bbbeeCertificateExpiry"
            type="date"
            value={local.bbbeeCertificateExpiry}
            onChange={(e) => set("bbbeeCertificateExpiry", e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-lg border border-border p-4">
        <p className="mb-3 text-sm font-medium">CIDB registration (construction-related only)</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-1.5">
            <Label htmlFor="cidbRegistrationNumber">CIDB registration number</Label>
            <Input
              id="cidbRegistrationNumber"
              placeholder="e.g. 10029384"
              value={local.cidbRegistrationNumber}
              onChange={(e) => set("cidbRegistrationNumber", e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="cidbGrade">Grading</Label>
            <Select value={local.cidbGrade} onValueChange={(v) => set("cidbGrade", v)}>
              <SelectTrigger id="cidbGrade">
                <SelectValue placeholder="Select grade" />
              </SelectTrigger>
              <SelectContent>
                {CIDB_GRADES.map((g) => (
                  <SelectItem key={g} value={g}>
                    Grade {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="cidbClassOfWork">Class of work</Label>
            <Select value={local.cidbClassOfWork} onValueChange={(v) => set("cidbClassOfWork", v)}>
              <SelectTrigger id="cidbClassOfWork">
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {CIDB_CLASSES_OF_WORK.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium">Sector-specific accreditations</p>
          <Button type="button" variant="outline" size="sm" onClick={addAccreditation}>
            <Plus className="h-4 w-4" /> Add accreditation
          </Button>
        </div>
        {local.accreditations.length === 0 && (
          <p className="text-sm text-muted-foreground">
            e.g. NHBRC enrolment, ISO 9001 certification — add any that apply to your sector.
          </p>
        )}
        <div className="grid gap-3">
          {local.accreditations.map((a, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end">
              <div className="grid gap-1.5">
                <Label>Accreditation name</Label>
                <Input
                  placeholder="e.g. NHBRC"
                  value={a.name}
                  onChange={(e) => updateAccreditation(i, "name", e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Reference no.</Label>
                <Input
                  value={a.referenceNo}
                  onChange={(e) => updateAccreditation(i, "referenceNo", e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Expiry date</Label>
                <Input
                  type="date"
                  value={a.expiryDate}
                  onChange={(e) => updateAccreditation(i, "expiryDate", e.target.value)}
                />
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => removeAccreditation(i)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
