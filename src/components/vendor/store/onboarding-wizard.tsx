"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, CircleCheck, CircleX, Loader2, MapPin, Rocket } from "lucide-react";
import { toast } from "sonner";
import { checkStoreSlug, createStore, type CreateStoreInput } from "@/lib/actions/vendor-store";
import { cn, slugify } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardFooter } from "@/components/ui/card";
import { Field, FormError, Input, Select, Textarea } from "@/components/ui/field";
import { BRAND_PRESETS, BrandColorPicker, ImageUpload } from "./image-upload";

type Values = {
  name: string;
  tagline: string;
  categoryId: string;
  location: string;
  logo: string | null;
  banner: string | null;
  brandColor: string;
  processingTime: string;
  shipping: string;
  returns: string;
};
type Errors = Partial<Record<keyof Values, string>>;

const STEPS = [
  { title: "Basics", description: "Name your shop and tell buyers what you sell." },
  { title: "Branding", description: "Add a logo, banner and colour. You can skip this and do it later." },
  { title: "Policies", description: "Set expectations up front — we’ve started you off with a template." },
  { title: "Review & launch", description: "Check everything looks right, then open your doors." },
] as const;

const STEP_FIELDS: (keyof Values)[][] = [
  ["name", "tagline", "categoryId", "location"],
  ["logo", "banner", "brandColor"],
  ["processingTime", "shipping", "returns"],
  [],
];

const DEFAULT_SHIPPING =
  "Orders ship from our studio within the processing time above, with tracking. Standard delivery across India is ₹79 (free on orders above ₹999) and usually arrives in 3–6 working days. Express delivery and cash on delivery are available at checkout.";
const DEFAULT_RETURNS =
  "Unused items in their original condition can be returned within 30 days of delivery for a full refund — just message us to start a return. If anything arrives damaged, send a photo within 7 days and we’ll replace it or refund you in full.";

function validate(step: number, v: Values): Errors {
  const e: Errors = {};
  if (step === 0) {
    if (v.name.trim().length < 2) e.name = "Store names need at least 2 characters";
    else if (v.name.trim().length > 60) e.name = "Keep it under 60 characters";
    else if (!slugify(v.name)) e.name = "Use at least one letter or number";
    if (v.tagline.trim().length < 4) e.tagline = "Add a one-line tagline";
    else if (v.tagline.trim().length > 120) e.tagline = "Keep it under 120 characters";
    if (!v.categoryId) e.categoryId = "Choose a primary category";
    if (v.location.trim().length < 2) e.location = "Where are you based?";
  }
  if (step === 1 && !/^#[0-9a-fA-F]{6}$/.test(v.brandColor)) e.brandColor = "Use a 6-digit hex colour like #a8461f";
  if (step === 2) {
    if (v.processingTime.trim().length < 2) e.processingTime = "Tell buyers how long you take to ship";
    if (v.shipping.trim().length < 10) e.shipping = "Describe how you ship";
    if (v.returns.trim().length < 10) e.returns = "Describe your returns policy";
  }
  return e;
}

type SlugState = { status: "idle" | "checking" | "done"; slug: string; available: boolean; suggestion: string };

export function OnboardingWizard({ categories, ownerName }: { categories: { id: string; name: string }[]; ownerName: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [v, setV] = useState<Values>({
    name: "",
    tagline: "",
    categoryId: "",
    location: "",
    logo: null,
    banner: null,
    brandColor: BRAND_PRESETS[0]!,
    processingTime: "Ships in 1–3 working days",
    shipping: DEFAULT_SHIPPING,
    returns: DEFAULT_RETURNS,
  });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [slug, setSlug] = useState<SlugState>({ status: "idle", slug: "", available: true, suggestion: "" });
  const [launching, startLaunch] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reqId = useRef(0);

  const set = <K extends keyof Values>(k: K, val: Values[K]) => {
    setV((s) => ({ ...s, [k]: val }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const onNameChange = (name: string) => {
    set("name", name);
    if (timer.current) clearTimeout(timer.current);
    const s = slugify(name);
    if (!s) return setSlug({ status: "idle", slug: "", available: true, suggestion: "" });
    setSlug((p) => ({ ...p, status: "checking", slug: s }));
    const id = ++reqId.current;
    timer.current = setTimeout(async () => {
      const r = await checkStoreSlug(name);
      if (id === reqId.current) setSlug({ status: "done", ...r });
    }, 350);
  };

  const next = () => {
    const e = validate(step, v);
    setErrors(e);
    if (Object.keys(e).length) return;
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const back = () => setStep((s) => Math.max(0, s - 1));

  const launch = () =>
    startLaunch(async () => {
      setFormError(null);
      for (let i = 0; i < 3; i++) {
        const e = validate(i, v);
        if (Object.keys(e).length) {
          setErrors(e);
          setStep(i);
          return;
        }
      }
      const input: CreateStoreInput = { ...v, logo: v.logo ?? "", banner: v.banner ?? "" };
      const r = await createStore(input);
      if (r.ok) {
        toast.success(r.message ?? "Your shop is live!");
        router.push("/vendor/products/new?welcome=1");
        router.refresh();
        return;
      }
      setFormError(r.error);
      const fe: Errors = {};
      for (const [k, msgs] of Object.entries(r.fieldErrors ?? {})) if (msgs?.[0]) fe[k as keyof Values] = msgs[0];
      setErrors(fe);
      const bad = STEP_FIELDS.findIndex((fields) => fields.some((f) => fe[f]));
      if (bad >= 0) setStep(bad);
    });

  const previewSlug = slug.status === "done" && !slug.available ? slug.suggestion : slugify(v.name);
  const category = categories.find((c) => c.id === v.categoryId);

  return (
    <div>
      <p className="eyebrow mb-2">Open your shop</p>
      <h1 className="font-display font-bold text-3xl tracking-display sm:text-4xl">{step === 3 ? "Ready to launch" : `Let’s set up your shop, ${ownerName.split(" ")[0]}`}</h1>
      <p className="mt-2 text-sm text-ink-muted">{STEPS[step]!.description}</p>


      <ol className="mt-8 grid grid-cols-4 gap-2" aria-label="Setup progress">
        {STEPS.map((s, i) => {
          const done = i < step;
          const current = i === step;
          return (
            <li key={s.title} aria-current={current ? "step" : undefined}>
              <button
                type="button"
                disabled={i > step}
                onClick={() => i < step && setStep(i)}
                className="group flex w-full flex-col gap-2 text-left disabled:cursor-default"
              >
                <span className={cn("h-1 w-full rounded-full transition-colors", done || current ? "bg-ink" : "bg-sunken")} />
                <span className="flex items-center gap-1.5 text-xs">
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full text-2xs font-semibold tabular-nums",
                      done ? "bg-main text-main-foreground" : current ? "border-2 border-ink text-ink" : "border-2 border-line-strong text-ink-subtle",
                    )}
                  >
                    {done ? <Check className="size-3" strokeWidth={3} aria-hidden /> : i + 1}
                  </span>
                  <span className={cn("hidden truncate sm:inline", current ? "font-medium text-ink" : "text-ink-muted", done && "group-hover:underline")}>{s.title}</span>
                  <span className="sr-only">{done ? " (completed)" : current ? " (current step)" : ""}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <Card className="mt-6">
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (step < 3) next();
            else launch();
          }}
        >
          <CardBody className="space-y-5 py-6">
            <FormError message={formError} />
            {step === 0 && (
              <>
                <Field
                  label="Store name"
                  error={errors.name}
                  hint={
                    slugify(v.name) ? (
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono">vanik.shop/s/{previewSlug}</span>
                        {slug.status === "checking" && <Loader2 className="size-3 animate-spin" aria-label="Checking availability" />}
                        {slug.status === "done" &&
                          (slug.available ? (
                            <span className="inline-flex items-center gap-1 text-success">
                              <CircleCheck className="size-3" aria-hidden /> Available
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-warning">
                              <CircleX className="size-3" aria-hidden /> “{slug.slug}” is taken — we’ll use this instead
                            </span>
                          ))}
                      </span>
                    ) : (
                      "Your storefront link is based on this and won’t change later."
                    )
                  }
                >
                  {(p) => <Input {...p} value={v.name} onChange={(e) => onNameChange(e.target.value)} maxLength={60} placeholder="e.g. Mitti Studio" autoFocus autoComplete="organization" />}
                </Field>
                <Field label="Tagline" error={errors.tagline} hint={`One line that sums up your shop · ${v.tagline.length}/120`}>
                  {(p) => <Input {...p} value={v.tagline} onChange={(e) => set("tagline", e.target.value)} maxLength={120} placeholder="Small-batch stoneware, thrown by hand" />}
                </Field>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Primary category" error={errors.categoryId}>
                    {(p) => (
                      <Select {...p} value={v.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
                        <option value="" disabled>
                          Choose a category
                        </option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </Select>
                    )}
                  </Field>
                  <Field label="Location" error={errors.location} hint="Shown on your storefront">
                    {(p) => <Input {...p} value={v.location} onChange={(e) => set("location", e.target.value)} placeholder="Jaipur, Rajasthan" autoComplete="address-level2" />}
                  </Field>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <ImageUpload kind="logo" label="Logo" value={v.logo} onChange={(u) => set("logo", u)} name={v.name} brandColor={v.brandColor} />
                <ImageUpload kind="banner" label="Banner" value={v.banner} onChange={(u) => set("banner", u)} name={v.name} brandColor={v.brandColor} />
                <BrandColorPicker value={v.brandColor} onChange={(c) => set("brandColor", c)} error={errors.brandColor} />
              </>
            )}

            {step === 2 && (
              <>
                <Field label="Processing time" error={errors.processingTime} hint="How long before an order leaves your hands.">
                  {(p) => (
                    <Select {...p} value={v.processingTime} onChange={(e) => set("processingTime", e.target.value)}>
                      {["Ships in 1 working day", "Ships in 1–3 working days", "Ships in 2–4 working days", "Ships in 3–5 working days", "Made to order: ships in 1–2 weeks"].map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field label="Shipping policy" error={errors.shipping}>
                  {(p) => <Textarea {...p} value={v.shipping} onChange={(e) => set("shipping", e.target.value)} maxLength={2000} className="min-h-32" />}
                </Field>
                <Field label="Returns & exchanges" error={errors.returns}>
                  {(p) => <Textarea {...p} value={v.returns} onChange={(e) => set("returns", e.target.value)} maxLength={2000} className="min-h-32" />}
                </Field>
                <p className="rounded-md bg-muted px-3.5 py-2.5 text-xs leading-relaxed text-ink-muted">
                  We’ll also create two shipping rates for you — Standard (Delhivery, ₹79, free above ₹999) and Express (Blue Dart, ₹149). Change them any time under Shipping.
                </p>
              </>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="overflow-hidden rounded-xl border-2 border-line">
                  <div
                    className="relative aspect-[4/1] w-full"
                    style={v.banner ? undefined : { background: `linear-gradient(135deg, ${v.brandColor} 0%, ${v.brandColor}99 45%, ${v.brandColor}33 100%)` }}
                  >
                    {v.banner && <Image src={v.banner} alt="" fill sizes="768px" className="object-cover" />}
                  </div>
                  <div className="flex items-end gap-4 px-5 pb-5">
                    <span
                      className="relative -mt-8 flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full font-display text-2xl font-bold text-white ring-4 ring-surface"
                      style={v.logo ? undefined : { backgroundColor: v.brandColor }}
                    >
                      {v.logo ? <Image src={v.logo} alt="" fill sizes="64px" className="object-cover" /> : (v.name.trim()[0] ?? "V").toUpperCase()}
                    </span>
                    <div className="min-w-0 pt-3">
                      <p className="truncate text-lg font-semibold tracking-tightish">{v.name}</p>
                      <p className="truncate text-sm text-ink-muted">{v.tagline}</p>
                    </div>
                  </div>
                </div>
                <dl className="divide-y divide-line rounded-xl border-2 border-line text-sm">
                  {[
                    { k: "Storefront", val: <span className="font-mono text-xs">vanik.shop/s/{previewSlug}</span>, step: 0 },
                    { k: "Category", val: category?.name ?? "—", step: 0 },
                    {
                      k: "Location",
                      val: (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3.5 text-ink-subtle" aria-hidden /> {v.location}
                        </span>
                      ),
                      step: 0,
                    },
                    {
                      k: "Brand colour",
                      val: (
                        <span className="inline-flex items-center gap-2">
                          <span className="size-4 rounded-full border-2 border-black/10" style={{ backgroundColor: v.brandColor }} aria-hidden />
                          <span className="font-mono text-xs uppercase">{v.brandColor}</span>
                        </span>
                      ),
                      step: 1,
                    },
                    { k: "Processing", val: v.processingTime, step: 2 },
                    { k: "Shipping", val: <span className="line-clamp-2">{v.shipping}</span>, step: 2 },
                    { k: "Returns", val: <span className="line-clamp-2">{v.returns}</span>, step: 2 },
                  ].map((row) => (
                    <div key={row.k} className="grid grid-cols-[6.5rem_1fr_auto] items-start gap-3 px-4 py-3">
                      <dt className="text-ink-subtle">{row.k}</dt>
                      <dd className="min-w-0 text-ink">{row.val}</dd>
                      <dd>
                        <button type="button" onClick={() => setStep(row.step)} className="text-xs font-medium text-ink-muted underline underline-offset-4 hover:text-ink">
                          Edit<span className="sr-only"> {row.k}</span>
                        </button>
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </CardBody>
          <CardFooter className="justify-between">
            <Button type="button" variant="ghost" onClick={back} disabled={step === 0 || launching} className={step === 0 ? "invisible" : undefined}>
              <ArrowLeft /> Back
            </Button>
            <div className="flex items-center gap-3">
              <span className="hidden text-xs tabular-nums text-ink-subtle sm:inline">
                Step {step + 1} of {STEPS.length}
              </span>
              {step === 1 && (
                <Button type="button" variant="ghost" onClick={next}>
                  Skip for now
                </Button>
              )}
              {step < 3 ? (
                <Button type="submit">
                  Continue <ArrowRight />
                </Button>
              ) : (
                <Button type="submit" variant="accent" loading={launching}>
                  <Rocket /> Launch my shop
                </Button>
              )}
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
