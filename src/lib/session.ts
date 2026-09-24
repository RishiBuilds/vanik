import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: "customer" | "vendor";
};

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const u = session.user as typeof session.user & { role?: string };
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    image: u.image ?? null,
    role: u.role === "vendor" ? "vendor" : "customer",
  };
});

export async function requireUser(next = "/account") {
  const user = await getSessionUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  return user;
}

export const getVendorStore = cache(async (userId: string) => {
  return db.query.stores.findFirst({ where: eq(schema.stores.ownerId, userId) });
});

export async function requireVendor() {
  const user = await requireUser("/vendor");
  if (user.role !== "vendor") redirect("/vendor/onboarding");
  const store = await getVendorStore(user.id);
  if (!store) redirect("/vendor/onboarding");
  return { user, store };
}

export async function getVendorContext() {
  const user = await getSessionUser();
  if (!user || user.role !== "vendor") return null;
  const store = await getVendorStore(user.id);
  if (!store) return null;
  return { user, store };
}
