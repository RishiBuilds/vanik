"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Copy, ExternalLink, MoreHorizontal, PauseCircle, PlayCircle, Trash2, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import type { StorePolicies } from "@/lib/db/schema";
import { inviteStaff, removeStaff, setStoreStatus, updateBranding, updatePolicies, updateStaffRole } from "@/lib/actions/vendor-store";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from "@/components/ui/dropdown";
import { Field, FormError, Input, Select, Textarea } from "@/components/ui/field";
import { Avatar } from "@/components/ui/misc";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TBody, THead, Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { BrandColorPicker, ImageUpload } from "./image-upload";

type Errors = Record<string, string[] | undefined>;

export type SettingsTab = "branding" | "policies" | "team" | "status";

export function SettingsTabs({
  initialTab,
  branding,
  policies,
  staff,
  ownerEmail,
  status,
  slug,
  storefrontUrl,
}: {
  initialTab: SettingsTab;
  branding: BrandingValues;
  policies: StorePolicies;
  staff: StaffMember[];
  ownerEmail: string;
  status: "active" | "paused";
  slug: string;
  storefrontUrl: string;
}) {
  const [tab, setTab] = useState<SettingsTab>(initialTab);
  return (
    <Tabs
      value={tab}
      onValueChange={(v) => {
        setTab(v as SettingsTab);
        window.history.replaceState(null, "", v === "branding" ? "/vendor/settings" : `/vendor/settings?tab=${v}`);
      }}
    >
      <TabsList aria-label="Store settings">
        <TabsTrigger value="branding">Branding</TabsTrigger>
        <TabsTrigger value="policies">Policies</TabsTrigger>
        <TabsTrigger value="team">Team</TabsTrigger>
        <TabsTrigger value="status" className="inline-flex items-center gap-2">
          Store status {status === "paused" && <Badge size="sm" tone="warning">Paused</Badge>}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="branding">
        <BrandingForm initial={branding} slug={slug} storefrontUrl={storefrontUrl} />
      </TabsContent>
      <TabsContent value="policies">
        <PoliciesForm initial={policies} />
      </TabsContent>
      <TabsContent value="team">
        <TeamManager staff={staff} ownerEmail={ownerEmail} />
      </TabsContent>
      <TabsContent value="status">
        <StoreStatusCard status={status} slug={slug} />
      </TabsContent>
    </Tabs>
  );
}

export type BrandingValues = {
  name: string;
  tagline: string;
  description: string;
  brandColor: string;
  location: string;
  supportEmail: string;
  logo: string | null;
  banner: string | null;
};

function BrandingForm({ initial, slug, storefrontUrl }: { initial: BrandingValues; slug: string; storefrontUrl: string }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const dirty = (Object.keys(initial) as (keyof BrandingValues)[]).some((k) => initial[k] !== v[k]);

  return (
    <form
      className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await updateBranding({ ...v, logo: v.logo ?? "", banner: v.banner ?? "" });
          if (r.ok) {
            toast.success(r.message ?? "Saved");
            setErrors({});
            setError(null);
            router.refresh();
          } else {
            setError(r.error);
            setErrors(r.fieldErrors ?? {});
          }
        });
      }}
    >
      <Card className="min-w-0">
        <CardHeader title="Shop details" description="How your shop appears to buyers across Vanik." />
        <CardBody className="space-y-5">
          <FormError message={error} />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Store name" error={errors.name} hint="Renaming won’t change your storefront link.">
              {(p) => <Input {...p} value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} maxLength={60} />}
            </Field>
            <Field label="Storefront URL" hint="Fixed when your shop was created.">
              {(p) => (
                <div className="flex gap-2">
                  <Input {...p} value={`vanik.shop/s/${slug}`} readOnly disabled className="flex-1" />
                  <CopyLink value={storefrontUrl} />
                </div>
              )}
            </Field>
          </div>
          <Field label="Tagline" optional error={errors.tagline} hint={`${v.tagline.length}/120`}>
            {(p) => <Input {...p} value={v.tagline} onChange={(e) => setV({ ...v, tagline: e.target.value })} maxLength={120} placeholder="Small-batch stoneware, thrown in Pondicherry" />}
          </Field>
          <Field label="About your shop" optional error={errors.description}>
            {(p) => (
              <Textarea {...p} value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} maxLength={2000} className="min-h-36" placeholder="Tell buyers who you are and how you make things." />
            )}
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Location" optional error={errors.location}>
              {(p) => <Input {...p} value={v.location} onChange={(e) => setV({ ...v, location: e.target.value })} placeholder="City, State" />}
            </Field>
            <Field label="Support email" optional error={errors.supportEmail} hint="Shown to buyers with questions.">
              {(p) => <Input {...p} type="email" value={v.supportEmail} onChange={(e) => setV({ ...v, supportEmail: e.target.value })} />}
            </Field>
          </div>
          <BrandColorPicker value={v.brandColor} onChange={(c) => setV({ ...v, brandColor: c })} error={errors.brandColor?.[0]} />
        </CardBody>
        <CardFooter>
          <Button type="button" variant="ghost" disabled={!dirty || pending} onClick={() => { setV(initial); setErrors({}); setError(null); }}>
            Discard
          </Button>
          <Button type="submit" loading={pending} disabled={!dirty}>
            Save changes
          </Button>
        </CardFooter>
      </Card>

      <Card className="self-start">
        <CardHeader title="Logo & banner" description="Changes apply when you save." />
        <CardBody className="space-y-6">
          <ImageUpload kind="logo" label="Logo" value={v.logo} onChange={(logo) => setV((s) => ({ ...s, logo }))} name={v.name} brandColor={v.brandColor} />
          <ImageUpload kind="banner" label="Banner" value={v.banner} onChange={(banner) => setV((s) => ({ ...s, banner }))} name={v.name} brandColor={v.brandColor} />
          <a
            href={`/s/${slug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink"
          >
            Preview storefront <ExternalLink className="size-3.5" aria-hidden />
          </a>
        </CardBody>
      </Card>
    </form>
  );
}

function PoliciesForm({ initial }: { initial: StorePolicies }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [pending, start] = useTransition();
  const dirty = v.processingTime !== initial.processingTime || v.shipping !== initial.shipping || v.returns !== initial.returns;
  return (
    <Card className="max-w-3xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const r = await updatePolicies(v);
            if (r.ok) {
              toast.success(r.message ?? "Saved");
              setErrors({});
              router.refresh();
            } else {
              setErrors(r.fieldErrors ?? {});
              toast.error(r.error);
            }
          });
        }}
      >
        <CardHeader title="Shop policies" description="Shown on your storefront and every product page. Clear policies mean fewer questions." />
        <CardBody className="space-y-5">
          <Field label="Processing time" error={errors.processingTime} hint="How long before an order ships, e.g. “Ships in 2–4 working days”.">
            {(p) => <Input {...p} value={v.processingTime} onChange={(e) => setV({ ...v, processingTime: e.target.value })} maxLength={60} />}
          </Field>
          <Field label="Shipping policy" error={errors.shipping}>
            {(p) => <Textarea {...p} value={v.shipping} onChange={(e) => setV({ ...v, shipping: e.target.value })} maxLength={2000} className="min-h-32" />}
          </Field>
          <Field label="Returns & exchanges" error={errors.returns}>
            {(p) => <Textarea {...p} value={v.returns} onChange={(e) => setV({ ...v, returns: e.target.value })} maxLength={2000} className="min-h-32" />}
          </Field>
        </CardBody>
        <CardFooter>
          <Button type="button" variant="ghost" disabled={!dirty || pending} onClick={() => setV(initial)}>
            Discard
          </Button>
          <Button type="submit" loading={pending} disabled={!dirty}>
            Save policies
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export type StaffMember = { id: string; name: string; email: string; role: "admin" | "editor" | "fulfillment"; status: "active" | "invited"; createdAt: Date };

const ROLE_INFO = {
  admin: "Everything, including payouts and team",
  editor: "Products, inventory and reviews",
  fulfillment: "Orders and shipping only",
} as const;

function TeamManager({ staff, ownerEmail }: { staff: StaffMember[]; ownerEmail: string }) {
  const router = useRouter();
  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState<StaffMember | null>(null);
  const [pending, start] = useTransition();
  const isOwner = (m: StaffMember) => m.email.toLowerCase() === ownerEmail.toLowerCase();

  return (
    <Card className="min-w-0">
      <CardHeader
        title="Team"
        description="Invite people to help run your shop. They sign in with their own Vanik account."
        action={
          <Button size="sm" onClick={() => setInviting(true)}>
            <UserPlus /> Invite
          </Button>
        }
      />
      {staff.length === 0 ? (
        <CardBody className="flex flex-col items-center gap-2 py-10 text-center text-sm text-ink-muted">
          <Users className="size-6 text-ink-subtle" aria-hidden /> Just you for now.
        </CardBody>
      ) : (
        <TableWrap className="relative">
          <Table className="min-w-[640px]">
            <THead>
              <tr>
                <Th>Member</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th>Added</Th>
                <Th className="w-12">
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </THead>
            <TBody>
              {staff.map((m) => (
                <Tr key={m.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar name={m.name} size={34} />
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 font-medium">
                          <span className="truncate">{m.name}</span>
                          {isOwner(m) && (
                            <Badge size="sm" tone="solid">
                              Owner
                            </Badge>
                          )}
                        </p>
                        <p className="truncate text-xs text-ink-subtle">{m.email}</p>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    {isOwner(m) ? (
                      <span className="text-sm text-ink-muted">Admin</span>
                    ) : (
                      <Select
                        aria-label={`Role for ${m.name}`}
                        value={m.role}
                        disabled={pending}
                        className="w-40 [&_select]:h-9"
                        onChange={(e) =>
                          start(async () => {
                            const r = await updateStaffRole(m.id, e.target.value as StaffMember["role"]);
                            if (r.ok) toast.success(r.message ?? "Role updated");
                            else toast.error(r.error);
                            router.refresh();
                          })
                        }
                      >
                        <option value="admin">Admin</option>
                        <option value="editor">Editor</option>
                        <option value="fulfillment">Fulfillment</option>
                      </Select>
                    )}
                  </Td>
                  <Td>
                    <Badge size="sm" tone={m.status === "active" ? "success" : "warning"} dot>
                      {m.status === "active" ? "Active" : "Invited"}
                    </Badge>
                  </Td>
                  <Td className="whitespace-nowrap text-ink-muted">{formatDate(m.createdAt)}</Td>
                  <Td>
                    {!isOwner(m) && (
                      <Dropdown>
                        <DropdownTrigger className="inline-flex size-8 items-center justify-center rounded-md text-ink-subtle hover:bg-muted hover:text-ink" aria-label={`Actions for ${m.name}`}>
                          <MoreHorizontal className="size-4" />
                        </DropdownTrigger>
                        <DropdownContent>
                          <DropdownItem destructive onSelect={() => setRemoving(m)}>
                            <Trash2 /> {m.status === "invited" ? "Revoke invitation" : "Remove from team"}
                          </DropdownItem>
                        </DropdownContent>
                      </Dropdown>
                    )}
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </TableWrap>
      )}
      <CardFooter className="justify-start">
        <ul className="grid w-full gap-1.5 text-xs text-ink-muted sm:grid-cols-3">
          {(Object.keys(ROLE_INFO) as (keyof typeof ROLE_INFO)[]).map((k) => (
            <li key={k}>
              <span className="font-medium capitalize text-ink">{k}</span> · {ROLE_INFO[k]}
            </li>
          ))}
        </ul>
      </CardFooter>

      {inviting && <InviteDialog onClose={() => setInviting(false)} />}

      <Dialog open={!!removing} onOpenChange={(o) => !o && setRemoving(null)}>
        {removing && (
          <DialogContent
            title={removing.status === "invited" ? "Revoke this invitation?" : `Remove ${removing.name}?`}
            description={removing.status === "invited" ? `${removing.email} won’t be able to join your shop.` : `${removing.email} will lose access to your seller dashboard immediately.`}
            size="sm"
          >
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <Button
                variant="danger"
                loading={pending}
                onClick={() =>
                  start(async () => {
                    const r = await removeStaff(removing.id);
                    if (r.ok) toast.success(r.message ?? "Removed");
                    else toast.error(r.error);
                    setRemoving(null);
                    router.refresh();
                  })
                }
              >
                {removing.status === "invited" ? "Revoke" : "Remove"}
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </Card>
  );
}

function InviteDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [v, setV] = useState({ name: "", email: "", role: "editor" as StaffMember["role"] });
  const [errors, setErrors] = useState<Errors>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Invite a team member" description="We’ll email them an invitation to join your shop.">
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const r = await inviteStaff(v);
              if (r.ok) {
                toast.success(r.message ?? "Invitation sent");
                router.refresh();
                onClose();
              } else {
                setError(r.error);
                setErrors(r.fieldErrors ?? {});
              }
            });
          }}
        >
          <FormError message={error} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" error={errors.name}>
              {(p) => <Input {...p} value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} autoFocus />}
            </Field>
            <Field label="Email" error={errors.email}>
              {(p) => <Input {...p} type="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} />}
            </Field>
          </div>
          <Field label="Role" error={errors.role} hint={ROLE_INFO[v.role]}>
            {(p) => (
              <Select {...p} value={v.role} onChange={(e) => setV({ ...v, role: e.target.value as StaffMember["role"] })}>
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
                <option value="fulfillment">Fulfillment</option>
              </Select>
            )}
          </Field>
          <div className="flex justify-end gap-2 border-t-2 border-line pt-5">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              Send invitation
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function StoreStatusCard({ status, slug }: { status: "active" | "paused"; slug: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();
  const paused = status === "paused";
  const next = paused ? "active" : "paused";

  return (
    <Card className="max-w-3xl">
      <CardHeader
        title="Store status"
        description="Pause your shop while you’re away or restocking."
        action={
          <Badge tone={paused ? "warning" : "success"} dot>
            {paused ? "Paused" : "Live"}
          </Badge>
        }
      />
      <CardBody className="space-y-4">
        {paused ? (
          <div role="status" className="flex items-start gap-3 rounded-lg border-2 border-warning/25 bg-warning-soft px-4 py-3 text-sm text-warning">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <p>
              Your shop is paused. Your storefront and products are hidden from search, categories and the home page, and buyers can’t place new orders. Existing orders still need to be fulfilled.
            </p>
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-ink-muted">
            Your shop is live at{" "}
            <a href={`/s/${slug}`} className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
              vanik.shop/s/{slug}
            </a>
            . Pausing hides your storefront and every product from the marketplace until you resume. Nothing is deleted, and open orders stay in your dashboard.
          </p>
        )}
      </CardBody>
      <CardFooter>
        <Button variant={paused ? "primary" : "danger"} onClick={() => setConfirming(true)}>
          {paused ? <PlayCircle /> : <PauseCircle />} {paused ? "Resume shop" : "Pause shop"}
        </Button>
      </CardFooter>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent
          title={paused ? "Resume your shop?" : "Pause your shop?"}
          description={paused ? "Your storefront and products will be visible to buyers again right away." : "Buyers won’t be able to find your shop or buy your products until you resume it."}
          size="sm"
        >
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button
              variant={paused ? "primary" : "danger"}
              loading={pending}
              onClick={() =>
                start(async () => {
                  const r = await setStoreStatus(next);
                  if (r.ok) toast.success(r.message ?? "Updated");
                  else toast.error(r.error);
                  setConfirming(false);
                  router.refresh();
                })
              }
            >
              {paused ? "Resume shop" : "Pause shop"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function CopyLink({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="size-11"
      aria-label={copied ? "Copied" : "Copy storefront link"}
      title={copied ? "Copied" : "Copy storefront link"}
      onClick={async () => {
        await navigator.clipboard?.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }}
    >
      {copied ? <Check className="text-success" /> : <Copy />}
    </Button>
  );
}
