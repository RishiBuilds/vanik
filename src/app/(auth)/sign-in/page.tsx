import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { SignInForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage(props: PageProps<"/sign-in">) {
  const user = await getSessionUser();
  if (user) {
    const next = (await props.searchParams).next;
    redirect(typeof next === "string" && next.startsWith("/") ? next : user.role === "vendor" ? "/vendor" : "/account");
  }
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
