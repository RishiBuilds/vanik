"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, ShoppingBag, Store } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { claimGuestCart } from "@/lib/actions/cart";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, FormError, Input } from "@/components/ui/field";

function safeNext(next: string | null, fallback: string) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

function PasswordInput(props: React.ComponentProps<typeof Input>) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={show ? "text" : "password"} className="pr-11" />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-1.5 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-ink-subtle hover:bg-muted hover:text-ink"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

const DEMO = [
  { label: "Shopper", email: "customer@vanik.dev", hint: "Rishi · orders, wishlist, UPI & cards" },
  { label: "Vendor", email: "vendor@vanik.dev", hint: "Priya · Mitti Studio dashboard" },
];

export function SignInForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function signIn(e?: React.FormEvent, creds?: { email: string; password: string }) {
    e?.preventDefault();
    const c = creds ?? { email, password };
    setError(null);
    start(async () => {
      const { data, error } = await authClient.signIn.email({ email: c.email.trim(), password: c.password });
      if (error) {
        setError(error.status === 401 ? "That email and password don’t match." : (error.message ?? "Couldn’t sign you in."));
        return;
      }
      await claimGuestCart();
      const role = (data?.user as { role?: string } | undefined)?.role;
      router.push(safeNext(sp.get("next"), role === "vendor" ? "/vendor" : "/account"));
      router.refresh();
    });
  }

  return (
    <div>
      <h1 className="font-display font-bold text-4xl tracking-display">Welcome back</h1>
      <p className="mt-2 text-sm text-ink-muted">
        New to Vanik?{" "}
        <Link href={`/sign-up${sp.get("next") ? `?next=${encodeURIComponent(sp.get("next")!)}` : ""}`} className="font-medium text-ink underline underline-offset-4">
          Create an account
        </Link>
      </p>

      <form onSubmit={signIn} className="mt-8 space-y-4" noValidate>
        <FormError message={error} />
        <Field label="Email">
          {(p) => <Input {...p} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />}
        </Field>
        <Field label="Password">
          {(p) => <PasswordInput {...p} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />}
        </Field>
        <Button type="submit" block size="lg" loading={pending}>
          Sign in
        </Button>
      </form>

      <div className="mt-10 rounded-xl border-2 border-dashed border-line-strong p-4">
        <p className="eyebrow">Demo accounts</p>
        <p className="mt-1 text-xs text-ink-subtle">Password for both: vanik-demo</p>
        <div className="mt-3 grid gap-2">
          {DEMO.map((d) => (
            <button
              key={d.email}
              type="button"
              disabled={pending}
              onClick={() => {
                setEmail(d.email);
                setPassword("vanik-demo");
                signIn(undefined, { email: d.email, password: "vanik-demo" });
              }}
              className="flex items-center gap-3 rounded-lg border-2 border-line bg-surface px-3 py-2.5 text-left transition-colors hover:border-line-strong hover:bg-muted/50 disabled:opacity-60"
            >
              <span className="inline-flex size-8 items-center justify-center rounded-full bg-muted">
                {d.label === "Vendor" ? <Store className="size-4" /> : <ShoppingBag className="size-4" />}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium">Continue as {d.label.toLowerCase()}</span>
                <span className="block truncate text-xs text-ink-subtle">{d.hint}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SignUpForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const [role, setRole] = useState<"customer" | "vendor">(sp.get("role") === "vendor" ? "vendor" : "customer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const fe: Record<string, string> = {};
    if (name.trim().length < 2) fe.name = "Enter your name.";
    if (!/^\S+@\S+\.\S+$/.test(email)) fe.email = "Enter a valid email address.";
    if (password.length < 8) fe.password = "Use at least 8 characters.";
    setFieldErrors(fe);
    if (Object.keys(fe).length) return;
    setError(null);
    start(async () => {
      const { error } = await authClient.signUp.email({ name: name.trim(), email: email.trim(), password, role });
      if (error) {
        setError(error.code === "USER_ALREADY_EXISTS" || error.status === 422 ? "An account with that email already exists." : (error.message ?? "Couldn’t create your account."));
        return;
      }
      await claimGuestCart();
      router.push(role === "vendor" ? "/vendor/onboarding" : safeNext(sp.get("next"), "/account"));
      router.refresh();
    });
  }

  return (
    <div>
      <h1 className="font-display font-bold text-4xl tracking-display">Create your account</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Already have one?{" "}
        <Link href="/sign-in" className="font-medium text-ink underline underline-offset-4">
          Sign in
        </Link>
      </p>

      <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">I want to…</legend>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { v: "customer", icon: ShoppingBag, title: "Shop", body: "Buy from independent makers" },
                { v: "vendor", icon: Store, title: "Sell", body: "Open a shop (you can shop too)" },
              ] as const
            ).map(({ v, icon: Icon, title, body }) => (
              <button
                key={v}
                type="button"
                aria-pressed={role === v}
                onClick={() => setRole(v)}
                className={cn(
                  "rounded-lg border-2 p-3.5 text-left transition-[border-color,box-shadow]",
                  role === v ? "border-ink shadow-[0_0_0_1px_var(--ink)]" : "border-line-strong hover:border-ink/40",
                )}
              >
                <Icon className="size-5 text-accent" strokeWidth={1.75} />
                <span className="mt-2 block text-sm font-semibold">{title}</span>
                <span className="mt-0.5 block text-xs text-ink-subtle">{body}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <FormError message={error} />
        <Field label="Full name" error={fieldErrors.name}>
          {(p) => <Input {...p} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />}
        </Field>
        <Field label="Email" error={fieldErrors.email}>
          {(p) => <Input {...p} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />}
        </Field>
        <Field label="Password" error={fieldErrors.password} hint="At least 8 characters.">
          {(p) => <PasswordInput {...p} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />}
        </Field>
        <Button type="submit" block size="lg" loading={pending}>
          {role === "vendor" ? "Create account & set up shop" : "Create account"}
        </Button>
        <p className="text-center text-xs text-ink-subtle">
          By continuing you agree to our{" "}
          <Link href="/legal/terms" className="underline underline-offset-2">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/legal/privacy" className="underline underline-offset-2">
            Privacy Policy
          </Link>
          .
        </p>
      </form>
    </div>
  );
}
