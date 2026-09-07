"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StepBasics, basicsFromCompany, type BasicsFormValue } from "@/components/onboarding/step-basics";
import {
  StepCompliance,
  complianceFromCompany,
  type ComplianceFormValue,
} from "@/components/onboarding/step-compliance";
import {
  StepCapability,
  capabilityFromCompany,
  type CapabilityFormValue,
} from "@/components/onboarding/step-capability";
import { useCompany, useCategories } from "@/lib/use-company";
import { syncAccreditations, syncReferences } from "@/lib/sync-collections";
import { Check } from "lucide-react";
import type { CompanyFull } from "@/lib/api-types";

export default function ProfilePage() {
  const { company } = useCompany();
  const categories = useCategories();

  if (!company) {
    return <p className="text-sm text-muted-foreground">Loading profile…</p>;
  }

  return <ProfileEditor key={company.id} company={company} categories={categories} />;
}

function ProfileEditor({
  company,
  categories,
}: {
  company: CompanyFull;
  categories: { id: string; name: string }[];
}) {
  const { updateCompany, mutate } = useCompany();

  const [basics, setBasics] = useState<BasicsFormValue>(() => basicsFromCompany(company));
  const [compliance, setCompliance] = useState<ComplianceFormValue>(() => complianceFromCompany(company));
  const [capability, setCapability] = useState<CapabilityFormValue>(() => capabilityFromCompany(company));
  const [savedTab, setSavedTab] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function saveBasics() {
    setSaving(true);
    await updateCompany(basics);
    setSaving(false);
    flashSaved("basics");
  }

  async function saveCompliance() {
    setSaving(true);
    const { accreditations, ...rest } = compliance;
    await updateCompany(rest);
    await syncAccreditations(company.accreditations.map((a) => a.id), accreditations);
    await mutate();
    setSaving(false);
    flashSaved("compliance");
  }

  async function saveCapability() {
    setSaving(true);
    const { references, ...rest } = capability;
    await updateCompany(rest);
    await syncReferences(company.references.map((r) => r.id), references);
    await mutate();
    setSaving(false);
    flashSaved("capability");
  }

  function flashSaved(tab: string) {
    setSavedTab(tab);
    setTimeout(() => setSavedTab(null), 2000);
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Company profile</h1>
        <p className="text-sm text-muted-foreground">
          This data is checked directly against tender eligibility criteria — keep it up to date.
        </p>
      </div>

      <Tabs defaultValue="basics">
        <TabsList>
          <TabsTrigger value="basics">Basics</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="capability">Capability</TabsTrigger>
        </TabsList>

        <TabsContent value="basics">
          <Card>
            <CardContent className="pt-6">
              <StepBasics value={basics} onChange={setBasics} />
            </CardContent>
            <CardFooter className="justify-end gap-2">
              {savedTab === "basics" && (
                <span className="flex items-center gap-1 text-sm text-success">
                  <Check className="h-4 w-4" /> Saved
                </span>
              )}
              <Button onClick={saveBasics} disabled={saving}>
                Save changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="compliance">
          <Card>
            <CardContent className="pt-6">
              <StepCompliance value={compliance} onChange={setCompliance} />
            </CardContent>
            <CardFooter className="justify-end gap-2">
              {savedTab === "compliance" && (
                <span className="flex items-center gap-1 text-sm text-success">
                  <Check className="h-4 w-4" /> Saved
                </span>
              )}
              <Button onClick={saveCompliance} disabled={saving}>
                Save changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="capability">
          <Card>
            <CardContent className="pt-6">
              <StepCapability value={capability} onChange={setCapability} categories={categories} />
            </CardContent>
            <CardFooter className="justify-end gap-2">
              {savedTab === "capability" && (
                <span className="flex items-center gap-1 text-sm text-success">
                  <Check className="h-4 w-4" /> Saved
                </span>
              )}
              <Button onClick={saveCapability} disabled={saving}>
                Save changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
