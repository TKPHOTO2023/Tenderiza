"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { WizardProgress } from "@/components/onboarding/wizard-progress";
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
import { StepReview } from "@/components/onboarding/step-review";
import { DocumentsManager } from "@/components/documents/documents-manager";
import { useCompany, useCategories } from "@/lib/use-company";
import { syncAccreditations, syncReferences } from "@/lib/sync-collections";
import { ONBOARDING_STEPS } from "@/lib/constants";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { CompanyFull } from "@/lib/api-types";

export default function OnboardingPage() {
  const { company, mutate } = useCompany();
  const categories = useCategories();

  if (!company) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading your profile…</p>
      </div>
    );
  }

  return (
    <OnboardingWizard
      key={company.id}
      company={company}
      categories={categories}
      onCompanyChange={mutate}
    />
  );
}

function OnboardingWizard({
  company,
  categories,
  onCompanyChange,
}: {
  company: CompanyFull;
  categories: { id: string; name: string }[];
  onCompanyChange: () => Promise<CompanyFull | undefined>;
}) {
  const router = useRouter();
  const { updateCompany } = useCompany();

  const [stepIndex, setStepIndex] = useState(() => {
    const idx = ONBOARDING_STEPS.findIndex((s) => s.key === company.currentStep);
    return idx >= 0 ? idx : 0;
  });
  const [saving, setSaving] = useState(false);

  const [basics, setBasics] = useState<BasicsFormValue>(() => basicsFromCompany(company));
  const [compliance, setCompliance] = useState<ComplianceFormValue>(() => complianceFromCompany(company));
  const [capability, setCapability] = useState<CapabilityFormValue>(() => capabilityFromCompany(company));
  const [reviewCompany, setReviewCompany] = useState(company);

  const currentStep = ONBOARDING_STEPS[stepIndex];
  const canGoBack = stepIndex > 0;
  const isLastStep = stepIndex === ONBOARDING_STEPS.length - 1;

  async function persistCurrentStep() {
    setSaving(true);
    try {
      if (currentStep.key === "COMPANY_BASICS") {
        await updateCompany(basics);
      } else if (currentStep.key === "COMPLIANCE") {
        const { accreditations, ...rest } = compliance;
        await updateCompany(rest);
        await syncAccreditations(
          reviewCompany.accreditations.map((a) => a.id),
          accreditations
        );
      } else if (currentStep.key === "CAPABILITY") {
        const { references, ...rest } = capability;
        await updateCompany(rest);
        await syncReferences(
          reviewCompany.references.map((r) => r.id),
          references
        );
      }
      const fresh = await onCompanyChange();
      if (fresh) setReviewCompany(fresh);
    } finally {
      setSaving(false);
    }
  }

  async function goNext() {
    await persistCurrentStep();
    if (isLastStep) {
      await fetch("/api/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboardingComplete: true, currentStep: "COMPLETE" }),
      });
      router.push("/dashboard");
      return;
    }
    const nextIndex = stepIndex + 1;
    setStepIndex(nextIndex);
    await fetch("/api/onboarding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentStep: ONBOARDING_STEPS[nextIndex].key }),
    });
  }

  async function goBack() {
    if (!canGoBack) return;
    const prevIndex = stepIndex - 1;
    setStepIndex(prevIndex);
    await fetch("/api/onboarding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentStep: ONBOARDING_STEPS[prevIndex].key }),
    });
  }

  async function saveAndExit() {
    await persistCurrentStep();
    router.push("/dashboard");
  }

  const stepDescription = useMemo(() => {
    switch (currentStep?.key) {
      case "COMPANY_BASICS":
        return "Tell us the basics — who you are, and how tenders should reach you.";
      case "COMPLIANCE":
        return "Your compliance and registration status is checked against every tender's eligibility criteria.";
      case "CAPABILITY":
        return "What can your business actually deliver, and where?";
      case "DOCUMENTS":
        return "Upload your compliance documents so they're ready when you bid.";
      case "REVIEW":
        return "Here's how your profile looks. You can always come back and edit it later.";
      default:
        return "";
    }
  }, [currentStep]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Tenderiza</p>
          <h1 className="text-2xl font-semibold">Company profile setup</h1>
        </div>
        <Button variant="ghost" onClick={saveAndExit} disabled={saving}>
          Save &amp; finish later
        </Button>
      </div>

      <div className="mb-8">
        <WizardProgress currentIndex={stepIndex} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{currentStep.label}</CardTitle>
          <CardDescription>{stepDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          {currentStep.key === "COMPANY_BASICS" && (
            <StepBasics value={basics} onChange={setBasics} />
          )}
          {currentStep.key === "COMPLIANCE" && (
            <StepCompliance value={compliance} onChange={setCompliance} />
          )}
          {currentStep.key === "CAPABILITY" && (
            <StepCapability value={capability} onChange={setCapability} categories={categories} />
          )}
          {currentStep.key === "DOCUMENTS" && <DocumentsManager />}
          {currentStep.key === "REVIEW" && <StepReview company={reviewCompany} />}
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-between">
        <Button variant="outline" onClick={goBack} disabled={!canGoBack || saving}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button onClick={goNext} disabled={saving}>
          {isLastStep ? "Go to Dashboard" : "Continue"} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
