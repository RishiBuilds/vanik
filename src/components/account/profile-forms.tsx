"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateProfile } from "@/lib/actions/account";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/card";
import { Field, FormError, Input } from "@/components/ui/field";
import { Avatar } from "@/components/ui/misc";

export function ProfileForm({ initial }: { initial: { name: string; email: string; phone: string; image: string } }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [pending, start] = useTransition();
  const dirty = v.name !== initial.name || v.phone !== initial.phone || v.image !== initial.image;

  return (
    <Card>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const res = await updateProfile({ name: v.name, phone: v.phone, image: v.image });
            if (res.ok) {
              toast.success(res.message ?? "Saved");
              setErrors({});
              router.refresh();
            } else setErrors(res.fieldErrors ?? {});
          });
        }}
      >
        <CardHeader title="Personal details" description="Shown on your reviews and used for delivery updates." />
        <CardBody className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar src={v.image || null} name={v.name || "?"} size={64} />
            <Field label="Profile photo URL" optional className="flex-1" error={errors.image} hint="Paste a link to a square image.">
              {(p) => <Input {...p} type="url" value={v.image} onChange={(e) => setV({ ...v, image: e.target.value })} placeholder="https://…" />}
            </Field>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Full name" error={errors.name}>
              {(p) => <Input {...p} autoComplete="name" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />}
            </Field>
            <Field label="Phone" optional error={errors.phone}>
              {(p) => <Input {...p} type="tel" autoComplete="tel" value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} />}
            </Field>
          </div>
          <Field label="Email" hint="Contact support to change the email on your account.">
            {(p) => <Input {...p} value={v.email} disabled readOnly />}
          </Field>
        </CardBody>
        <CardFooter>
          <Button type="button" variant="ghost" disabled={!dirty || pending} onClick={() => setV(initial)}>
            Discard
          </Button>
          <Button type="submit" loading={pending} disabled={!dirty}>
            Save changes
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <Card>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (next.length < 8) return setError("New password must be at least 8 characters.");
          if (next !== confirm) return setError("New passwords don’t match.");
          setError(null);
          start(async () => {
            const { error } = await authClient.changePassword({ currentPassword: current, newPassword: next, revokeOtherSessions: true });
            if (error) setError(error.message ?? "Couldn’t change your password.");
            else {
              toast.success("Password updated. Other devices were signed out.");
              setCurrent("");
              setNext("");
              setConfirm("");
            }
          });
        }}
      >
        <CardHeader title="Password" description="Use at least 8 characters. Changing it signs you out everywhere else." />
        <CardBody className="space-y-5">
          <FormError message={error} />
          <Field label="Current password">
            {(p) => <Input {...p} type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />}
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="New password">
              {(p) => <Input {...p} type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />}
            </Field>
            <Field label="Confirm new password">
              {(p) => <Input {...p} type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />}
            </Field>
          </div>
        </CardBody>
        <CardFooter>
          <Button type="submit" loading={pending} disabled={!current || !next}>
            Update password
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
