import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { requireVendor } from "@/lib/session";
import { getStoreStaff } from "@/lib/queries/vendor-store";
import { firstParam } from "@/lib/utils";
import { PageHeader } from "@/components/account/page-header";
import { Button } from "@/components/ui/button";
import { SettingsTabs, type SettingsTab } from "@/components/vendor/store/settings-forms";

export const metadata: Metadata = { title: "Settings · Seller" };

const TABS: SettingsTab[] = ["branding", "policies", "team", "status"];

export default async function VendorSettingsPage(props: PageProps<"/vendor/settings">) {
  const { user, store } = await requireVendor();
  const t = firstParam((await props.searchParams).tab) as SettingsTab | undefined;
  const tab = t && TABS.includes(t) ? t : "branding";
  const staff = await getStoreStaff(store.id);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Your shop’s branding, policies, team and visibility."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={`/s/${store.slug}`}>
              View storefront <ArrowUpRight />
            </Link>
          </Button>
        }
      />
      <SettingsTabs
        initialTab={tab}
        slug={store.slug}
        storefrontUrl={`${appUrl}/s/${store.slug}`}
        status={store.status}
        ownerEmail={user.email}
        branding={{
          name: store.name,
          tagline: store.tagline,
          description: store.description,
          brandColor: store.brandColor,
          location: store.location,
          supportEmail: store.supportEmail ?? "",
          logo: store.logo,
          banner: store.banner,
        }}
        policies={store.policies}
        staff={staff.map((s) => ({ id: s.id, name: s.name, email: s.email, role: s.role, status: s.status, createdAt: s.createdAt }))}
      />
    </div>
  );
}
