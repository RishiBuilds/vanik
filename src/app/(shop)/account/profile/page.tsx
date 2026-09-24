import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/account/page-header";
import { PasswordForm, ProfileForm } from "@/components/account/profile-forms";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser("/account/profile");
  const row = await db.query.user.findFirst({ where: eq(schema.user.id, user.id) });
  return (
    <div className="max-w-3xl">
      <PageHeader title="Profile" description="Manage your personal details and sign-in security." />
      <div className="space-y-6">
        <ProfileForm initial={{ name: row?.name ?? user.name, email: user.email, phone: row?.phone ?? "", image: row?.image ?? "" }} />
        <PasswordForm />
      </div>
    </div>
  );
}
