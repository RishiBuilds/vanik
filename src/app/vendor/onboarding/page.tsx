import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getVendorStore, requireUser } from "@/lib/session";
import { getCategoryTree } from "@/lib/queries/catalog";
import { BecomeVendorCard } from "@/components/vendor/store/become-vendor";
import { OnboardingWizard } from "@/components/vendor/store/onboarding-wizard";

export const metadata: Metadata = { title: "Open your shop" };

export default async function OnboardingPage() {
  const user = await requireUser("/vendor/onboarding");
  if (await getVendorStore(user.id)) redirect("/vendor");

  if (user.role === "customer") return <BecomeVendorCard name={user.name} email={user.email} />;

  const categories = (await getCategoryTree()).map((c) => ({ id: c.id, name: c.name }));
  return <OnboardingWizard categories={categories} ownerName={user.name} />;
}
