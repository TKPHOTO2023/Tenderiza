import { redirect } from "next/navigation";
import { getOrCreateCurrentCompany } from "@/lib/current-company";

// This route depends on live database state (and creates a row as a side
// effect), so it must never be statically prerendered at build time.
export const dynamic = "force-dynamic";

export default async function RootPage() {
  const company = await getOrCreateCurrentCompany();
  if (company.onboardingComplete) {
    redirect("/dashboard");
  }
  redirect("/onboarding");
}
