import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getCart } from "@/lib/queries/cart";
import { getAddresses, getPaymentMethods } from "@/lib/queries/account";
import { CheckoutFlow } from "@/components/checkout/checkout-flow";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const user = await requireUser("/checkout");
  const cart = await getCart();
  if (cart.groups.length === 0) redirect("/cart");
  if (cart.hasUnavailable) redirect("/cart");
  const [addresses, methods] = await Promise.all([getAddresses(user.id), getPaymentMethods(user.id)]);

  return (
    <CheckoutFlow
      email={user.email}
      name={user.name}
      groups={cart.groups.map((g) => ({
        store: g.store,
        subtotal: g.subtotal,
        rates: g.rates,
        lines: g.lines.map((l) => ({ id: l.id, title: l.title, image: l.image, variantLabel: l.variantLabel, quantity: l.quantity, unitPrice: l.unitPrice })),
      }))}
      subtotal={cart.totals.subtotal}
      promo={cart.promo}
      addresses={addresses.map((a) => ({
        id: a.id,
        label: a.label,
        fullName: a.fullName,
        line1: a.line1,
        line2: a.line2,
        city: a.city,
        region: a.region,
        postalCode: a.postalCode,
        phone: a.phone,
        isDefault: a.isDefault,
      }))}
      methods={methods.map((m) => ({
        id: m.id,
        type: m.type,
        brand: m.brand,
        last4: m.last4,
        expMonth: m.expMonth,
        expYear: m.expYear,
        email: m.email,
        isDefault: m.isDefault,
      }))}
    />
  );
}
