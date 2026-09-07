"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/multi-select";
import { COMPANY_TYPES, PROVINCES } from "@/lib/constants";
import type { CompanyFull } from "@/lib/api-types";

export interface BasicsFormValue {
  companyName: string;
  tradingName: string;
  registrationNumber: string;
  vatNumber: string;
  companyType: string;
  contactPersonName: string;
  contactEmail: string;
  contactPhone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postalCode: string;
  operatingProvinces: string[];
  website: string;
  description: string;
}

export function basicsFromCompany(company?: CompanyFull): BasicsFormValue {
  return {
    companyName: company?.companyName ?? "",
    tradingName: company?.tradingName ?? "",
    registrationNumber: company?.registrationNumber ?? "",
    vatNumber: company?.vatNumber ?? "",
    companyType: company?.companyType ?? "",
    contactPersonName: company?.contactPersonName ?? "",
    contactEmail: company?.contactEmail ?? "",
    contactPhone: company?.contactPhone ?? "",
    addressLine1: company?.addressLine1 ?? "",
    addressLine2: company?.addressLine2 ?? "",
    city: company?.city ?? "",
    postalCode: company?.postalCode ?? "",
    operatingProvinces: company?.operatingProvinces ?? [],
    website: company?.website ?? "",
    description: company?.description ?? "",
  };
}

export function StepBasics({
  value,
  onChange,
}: {
  value: BasicsFormValue;
  onChange: (value: BasicsFormValue) => void;
}) {
  const [local, setLocal] = useState(value);

  function set<K extends keyof BasicsFormValue>(key: K, val: BasicsFormValue[K]) {
    const next = { ...local, [key]: val };
    setLocal(next);
    onChange(next);
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="companyName">Registered company name *</Label>
          <Input
            id="companyName"
            placeholder="e.g. Ubuntu Civil Works (Pty) Ltd"
            value={local.companyName}
            onChange={(e) => set("companyName", e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="tradingName">Trading name</Label>
          <Input
            id="tradingName"
            placeholder="e.g. Ubuntu Civils"
            value={local.tradingName}
            onChange={(e) => set("tradingName", e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="registrationNumber">CIPC registration number *</Label>
          <Input
            id="registrationNumber"
            placeholder="e.g. 2018/123456/07"
            value={local.registrationNumber}
            onChange={(e) => set("registrationNumber", e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="vatNumber">VAT number</Label>
          <Input
            id="vatNumber"
            placeholder="e.g. 4123456789"
            value={local.vatNumber}
            onChange={(e) => set("vatNumber", e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="companyType">Company type</Label>
          <Select value={local.companyType} onValueChange={(v) => set("companyType", v)}>
            <SelectTrigger id="companyType">
              <SelectValue placeholder="Select company type" />
            </SelectTrigger>
            <SelectContent>
              {COMPANY_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            placeholder="e.g. www.ubuntucivils.co.za"
            value={local.website}
            onChange={(e) => set("website", e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="grid gap-1.5">
          <Label htmlFor="contactPersonName">Contact person *</Label>
          <Input
            id="contactPersonName"
            placeholder="e.g. Thandiwe Mokoena"
            value={local.contactPersonName}
            onChange={(e) => set("contactPersonName", e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="contactEmail">Contact email *</Label>
          <Input
            id="contactEmail"
            type="email"
            placeholder="e.g. thandiwe@ubuntucivils.co.za"
            value={local.contactEmail}
            onChange={(e) => set("contactEmail", e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="contactPhone">Contact phone</Label>
          <Input
            id="contactPhone"
            placeholder="e.g. 011 234 5678"
            value={local.contactPhone}
            onChange={(e) => set("contactPhone", e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="addressLine1">Physical address *</Label>
          <Input
            id="addressLine1"
            placeholder="e.g. 12 Church Street"
            value={local.addressLine1}
            onChange={(e) => set("addressLine1", e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="addressLine2">Address line 2</Label>
          <Input
            id="addressLine2"
            placeholder="e.g. Silverton Industrial"
            value={local.addressLine2}
            onChange={(e) => set("addressLine2", e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="city">City / Town</Label>
          <Input
            id="city"
            placeholder="e.g. Pretoria"
            value={local.city}
            onChange={(e) => set("city", e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="postalCode">Postal code</Label>
          <Input
            id="postalCode"
            placeholder="e.g. 0184"
            value={local.postalCode}
            onChange={(e) => set("postalCode", e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label>Province(s) of operation *</Label>
        <MultiSelect
          options={PROVINCES.map((p) => ({ value: p.value, label: p.label }))}
          selected={local.operatingProvinces}
          onChange={(v) => set("operatingProvinces", v)}
          columns={3}
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="description">Company description / bio</Label>
        <Textarea
          id="description"
          placeholder="A short description of your business, used later to help draft tender proposals — e.g. 'Ubuntu Civil Works is a Gauteng-based civil engineering contractor specialising in road maintenance and stormwater infrastructure for municipalities.'"
          rows={4}
          value={local.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>
    </div>
  );
}
