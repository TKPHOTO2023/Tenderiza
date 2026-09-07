import { redirect } from "next/navigation";
import { getOrCreateCurrentCompany } from "@/lib/current-company";

export default async function RootPage() {
  const company = await getOrCreateCurrentCompany();
  if (company.onboardingComplete) {
    redirect("/dashboard");
  }
  redirect("/onboarding");
}
