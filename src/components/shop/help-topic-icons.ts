import { CreditCard, PackageSearch, Receipt, RotateCcw, Store, Truck, UserRound, type LucideIcon } from "lucide-react";
import type { HelpTopicSlug } from "@/lib/help-content";

export const HELP_TOPIC_ICONS: Record<HelpTopicSlug, LucideIcon> = {
  shipping: Truck,
  returns: RotateCcw,
  payments: CreditCard,
  orders: PackageSearch,
  selling: Store,
  fees: Receipt,
  account: UserRound,
};
