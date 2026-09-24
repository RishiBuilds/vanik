import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { getAddresses } from "@/lib/queries/account";
import { PageHeader } from "@/components/account/page-header";
import { AddressManager } from "@/components/account/address-manager";

export const metadata: Metadata = { title: "Addresses" };

export default async function AddressesPage() {
  const user = await requireUser("/account/addresses");
  const addresses = await getAddresses(user.id);
  return (
    <div>
      <PageHeader title="Addresses" description="Your default address is pre-selected at checkout." />
      <AddressManager
        addresses={addresses.map((a) => ({
          id: a.id,
          isDefault: a.isDefault,
          label: a.label,
          fullName: a.fullName,
          line1: a.line1,
          line2: a.line2 ?? "",
          city: a.city,
          region: a.region,
          postalCode: a.postalCode,
          country: a.country,
          phone: a.phone ?? "",
        }))}
      />
    </div>
  );
}
