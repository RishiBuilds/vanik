import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { SignUpForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Create account" };

export default async function SignUpPage() {
  const user = await getSessionUser();
  if (user) redirect(user.role === "vendor" ? "/vendor" : "/account");
  return (
    <Suspense>
      <SignUpForm />
    </Suspense>
  );
}
