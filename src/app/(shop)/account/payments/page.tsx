import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { getPaymentMethods } from "@/lib/queries/account";
import { PageHeader } from "@/components/account/page-header";
import { PaymentManager } from "@/components/account/payment-manager";

export const metadata: Metadata = { title: "Payment methods" };

export default async function PaymentsPage() {
  const user = await requireUser("/account/payments");
  const methods = await getPaymentMethods(user.id);
  return (
    <div>
      <PageHeader title="Payment methods" description="Your default method is pre-selected at checkout." />
      <PaymentManager
        holderName={user.name}
        methods={methods.map((m) => ({
          id: m.id,
          type: m.type,
          brand: m.brand,
          last4: m.last4,
          expMonth: m.expMonth,
          expYear: m.expYear,
          holderName: m.holderName,
          email: m.email,
          isDefault: m.isDefault,
        }))}
      />
    </div>
  );
}
