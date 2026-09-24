"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Globe2, Home, MoreHorizontal, Pencil, Plus, Trash2, Truck, X } from "lucide-react";
import { toast } from "sonner";
import { CARRIERS } from "@/lib/services/shipping";
import { deleteShippingRate, saveShippingRate, toggleShippingRate } from "@/lib/actions/vendor-store";
import { formatMoney } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/controls";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import { Dropdown, DropdownContent, DropdownItem, DropdownSeparator, DropdownTrigger } from "@/components/ui/dropdown";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, FormError, Input, Select } from "@/components/ui/field";
import { TBody, THead, Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";

export type Rate = {
  id: string;
  zone: string;
  regions: string[];
  name: string;
  carrier: string;
  price: number;
  freeOver: number | null;
  minDays: number;
  maxDays: number;
  active: boolean;
};

const REGION_SUGGESTIONS = ["IN", "AE", "SG", "GB", "US", "EU", "AU", "NP"];

const zoneOrder = (z: string) => (z === "Domestic" ? 0 : z === "International" ? 1 : 2);

export function ShippingManager({ rates }: { rates: Rate[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Rate | "new" | null>(null);
  const [deleting, setDeleting] = useState<Rate | null>(null);
  const [optimistic, setOptimistic] = useOptimistic(rates, (state, u: { id: string; active: boolean }) =>
    state.map((r) => (r.id === u.id ? { ...r, active: u.active } : r)),
  );
  const [pending, start] = useTransition();

  const zones = [...new Set(optimistic.map((r) => r.zone))].sort((a, b) => zoneOrder(a) - zoneOrder(b) || a.localeCompare(b));
  const activeDomestic = optimistic.filter((r) => r.zone === "Domestic" && r.active).length;

  const toggle = (r: Rate, active: boolean) =>
    start(async () => {
      setOptimistic({ id: r.id, active });
      const res = await toggleShippingRate(r.id, active);
      if (res.ok) toast.success(res.message ?? "Updated");
      else toast.error(res.error);
      router.refresh();
    });

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">
          {optimistic.length} rate{optimistic.length === 1 ? "" : "s"} across {zones.length} zone{zones.length === 1 ? "" : "s"}
        </p>
        <Button size="sm" onClick={() => setEditing("new")}>
          <Plus /> Add rate
        </Button>
      </div>

      {optimistic.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No shipping rates"
          description="Add at least one Domestic rate so buyers can check out."
          action={
            <Button onClick={() => setEditing("new")}>
              <Plus /> Add a rate
            </Button>
          }
          className="rounded-xl border-2 border-line bg-surface"
        />
      ) : (
        <div className="space-y-6">
          {zones.map((zone) => {
            const list = optimistic.filter((r) => r.zone === zone);
            const regions = [...new Set(list.flatMap((r) => r.regions))];
            return (
              <Card key={zone} className="min-w-0">
                <CardHeader
                  title={
                    <span className="flex items-center gap-2">
                      {zone === "Domestic" ? <Home className="size-4 text-ink-subtle" aria-hidden /> : <Globe2 className="size-4 text-ink-subtle" aria-hidden />}
                      {zone}
                    </span>
                  }
                  description={
                    <span className="mt-1 flex flex-wrap gap-1">
                      {regions.map((g) => (
                        <Badge key={g} size="sm" tone="outline">
                          {g}
                        </Badge>
                      ))}
                    </span>
                  }
                />
                <TableWrap className="relative">
                  <Table className="min-w-[680px] table-fixed">
                    <THead>
                      <tr>
                        <Th className="w-[26%]">Rate</Th>
                        <Th className="w-[15%]">Carrier</Th>
                        <Th className="w-[12%] text-right">Price</Th>
                        <Th className="w-[14%] pl-8">Free over</Th>
                        <Th>Delivery</Th>
                        <Th className="w-24">Active</Th>
                        <Th className="w-16">
                          <span className="sr-only">Actions</span>
                        </Th>
                      </tr>
                    </THead>
                    <TBody>
                      {list.map((r) => {
                        const lastDomestic = r.zone === "Domestic" && r.active && activeDomestic <= 1;
                        return (
                          <Tr key={r.id} className={r.active ? undefined : "text-ink-subtle"}>
                            <Td className="font-medium">{r.name}</Td>
                            <Td className="text-ink-muted">{r.carrier}</Td>
                            <Td className="text-right font-semibold tabular-nums">{r.price === 0 ? "Free" : formatMoney(r.price)}</Td>
                            <Td className="pl-8 tabular-nums text-ink-muted">{r.freeOver != null ? formatMoney(r.freeOver) : "—"}</Td>
                            <Td className="whitespace-nowrap text-ink-muted">
                              {r.minDays === r.maxDays ? r.minDays : `${r.minDays}–${r.maxDays}`} working day{r.maxDays === 1 ? "" : "s"}
                            </Td>
                            <Td>
                              <Switch
                                checked={r.active}
                                onCheckedChange={(v) => toggle(r, v)}
                                disabled={pending || (lastDomestic && r.active)}
                                aria-label={`${r.active ? "Deactivate" : "Activate"} ${r.zone} ${r.name}`}
                                title={lastDomestic ? "Your last active Domestic rate can’t be turned off" : undefined}
                              />
                            </Td>
                            <Td>
                              <Dropdown>
                                <DropdownTrigger
                                  className="inline-flex size-8 items-center justify-center rounded-md text-ink-subtle hover:bg-muted hover:text-ink"
                                  aria-label={`Actions for ${r.name}`}
                                >
                                  <MoreHorizontal className="size-4" />
                                </DropdownTrigger>
                                <DropdownContent>
                                  <DropdownItem onSelect={() => setEditing(r)}>
                                    <Pencil /> Edit
                                  </DropdownItem>
                                  <DropdownSeparator />
                                  <DropdownItem destructive disabled={lastDomestic} onSelect={() => setDeleting(r)}>
                                    <Trash2 /> {lastDomestic ? "Last Domestic rate" : "Delete"}
                                  </DropdownItem>
                                </DropdownContent>
                              </Dropdown>
                            </Td>
                          </Tr>
                        );
                      })}
                    </TBody>
                  </Table>
                </TableWrap>
              </Card>
            );
          })}
        </div>
      )}

      {editing && (
        <RateDialog
          key={editing === "new" ? "new" : editing.id}
          rate={editing === "new" ? null : editing}
          zones={zones}
          onClose={() => setEditing(null)}
        />
      )}

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        {deleting && (
          <DialogContent title="Delete this rate?" description={`${deleting.zone} · ${deleting.name} (${deleting.carrier}). Buyers won’t see it at checkout.`} size="sm">
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <Button
                variant="danger"
                loading={pending}
                onClick={() =>
                  start(async () => {
                    const r = await deleteShippingRate(deleting.id);
                    if (r.ok) toast.success(r.message ?? "Deleted");
                    else toast.error(r.error);
                    setDeleting(null);
                    router.refresh();
                  })
                }
              >
                Delete rate
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}

function RateDialog({ rate, zones, onClose }: { rate: Rate | null; zones: string[]; onClose: () => void }) {
  const router = useRouter();
  const allZones = [...new Set(["Domestic", "International", ...zones])];
  const [zoneMode, setZoneMode] = useState<"existing" | "new">("existing");
  const [v, setV] = useState({
    zone: rate?.zone ?? "Domestic",
    newZone: "",
    regions: rate?.regions ?? ["IN"],
    name: rate?.name ?? "",
    carrier: rate?.carrier ?? "Delhivery",
    price: rate ? String(rate.price / 100) : "",
    freeOver: rate?.freeOver != null ? String(rate.freeOver / 100) : "",
    minDays: rate ? String(rate.minDays) : "3",
    maxDays: rate ? String(rate.maxDays) : "6",
    active: rate?.active ?? true,
  });
  const [regionDraft, setRegionDraft] = useState("");
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const addRegion = (raw: string) => {
    const codes = raw
      .split(/[\s,]+/)
      .map((c) => c.trim().toUpperCase())
      .filter((c) => /^[A-Z]{2,3}$/.test(c));
    if (codes.length) setV((s) => ({ ...s, regions: [...new Set([...s.regions, ...codes])] }));
    setRegionDraft("");
  };

  const submit = () => {
    const minDays = Number(v.minDays);
    const maxDays = Number(v.maxDays);
    const local: Record<string, string[]> = {};
    if (v.minDays === "" || !Number.isInteger(minDays) || minDays < 0) local.minDays = ["Enter whole days"];
    if (v.maxDays === "" || !Number.isInteger(maxDays) || maxDays < 1) local.maxDays = ["Enter whole days"];
    else if (!local.minDays && minDays > maxDays) local.maxDays = ["Must be at least the minimum"];
    if (v.price === "" || Number.isNaN(Number(v.price))) local.price = ["Enter a price"];
    if (v.freeOver !== "" && Number.isNaN(Number(v.freeOver))) local.freeOver = ["Enter an amount"];
    if (Object.keys(local).length) {
      setErrors(local);
      setError(null);
      return;
    }
    start(async () => {
      const r = await saveShippingRate({
        id: rate?.id,
        zone: zoneMode === "new" ? v.newZone : v.zone,
        regions: v.regions,
        name: v.name,
        carrier: v.carrier as (typeof CARRIERS)[number],
        price: Number(v.price),
        freeOver: v.freeOver === "" ? null : Number(v.freeOver),
        minDays,
        maxDays,
        active: v.active,
      });
      if (r.ok) {
        toast.success(r.message ?? "Saved");
        router.refresh();
        onClose();
      } else {
        setError(r.error);
        setErrors(r.fieldErrors ?? {});
      }
    });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={rate ? "Edit shipping rate" : "Add shipping rate"} description="Prices are in ₹ (INR), inclusive of GST. Buyers see the exact cost before they pay." size="lg">
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          noValidate
        >
          <FormError message={error} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Zone"
              error={errors.zone}
              hint={
                <button type="button" className="underline underline-offset-2 hover:text-ink" onClick={() => setZoneMode(zoneMode === "new" ? "existing" : "new")}>
                  {zoneMode === "new" ? "Choose an existing zone" : "Create a new zone"}
                </button>
              }
            >
              {(p) =>
                zoneMode === "new" ? (
                  <Input {...p} value={v.newZone} onChange={(e) => setV({ ...v, newZone: e.target.value })} placeholder="e.g. Europe" autoFocus />
                ) : (
                  <Select {...p} value={v.zone} onChange={(e) => setV({ ...v, zone: e.target.value })}>
                    {allZones.map((z) => (
                      <option key={z}>{z}</option>
                    ))}
                  </Select>
                )
              }
            </Field>
            <Field label="Rate name" error={errors.name}>
              {(p) => <Input {...p} value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} placeholder="e.g. Standard" />}
            </Field>
          </div>

          <Field label="Regions" error={errors.regions} hint="Country or region codes. Press Enter or comma to add.">
            {(p) => (
              <div>
                <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-md border-2 border-line-strong bg-surface px-2 py-1.5 shadow-xs focus-within:border-ink focus-within:ring-3 focus-within:ring-accent/15">
                  {v.regions.map((g) => (
                    <span key={g} className="inline-flex h-7 items-center gap-1 rounded-sm bg-muted pl-2 pr-1 text-xs font-medium">
                      {g}
                      <button
                        type="button"
                        className="inline-flex size-5 items-center justify-center rounded-xs text-ink-subtle hover:bg-sunken hover:text-ink"
                        onClick={() => setV({ ...v, regions: v.regions.filter((x) => x !== g) })}
                        aria-label={`Remove ${g}`}
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    {...p}
                    value={regionDraft}
                    onChange={(e) => (/[,\s]$/.test(e.target.value) ? addRegion(e.target.value) : setRegionDraft(e.target.value))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addRegion(regionDraft);
                      } else if (e.key === "Backspace" && !regionDraft && v.regions.length) {
                        setV({ ...v, regions: v.regions.slice(0, -1) });
                      }
                    }}
                    onBlur={() => regionDraft && addRegion(regionDraft)}
                    className="h-7 min-w-24 flex-1 bg-transparent px-1 text-sm uppercase outline-none placeholder:normal-case placeholder:text-ink-subtle"
                    placeholder={v.regions.length ? "Add…" : "IN, AE…"}
                    maxLength={3}
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {REGION_SUGGESTIONS.filter((s) => !v.regions.includes(s)).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setV({ ...v, regions: [...v.regions, s] })}
                      className="rounded-full border-2 border-dashed border-line-strong px-2 py-0.5 text-2xs font-medium text-ink-muted hover:border-ink/40 hover:text-ink"
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Carrier" error={errors.carrier}>
              {(p) => (
                <Select {...p} value={v.carrier} onChange={(e) => setV({ ...v, carrier: e.target.value })}>
                  {CARRIERS.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Price" error={errors.price} hint="0 for free shipping">
              {(p) => (
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-subtle">₹</span>
                  <Input {...p} inputMode="decimal" className="pl-7 tabular-nums" value={v.price} onChange={(e) => setV({ ...v, price: e.target.value.replace(/[^\d.]/g, "") })} placeholder="79" />
                </div>
              )}
            </Field>
            <Field label="Free over" optional error={errors.freeOver} hint="Order subtotal">
              {(p) => (
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-subtle">₹</span>
                  <Input {...p} inputMode="decimal" className="pl-7 tabular-nums" value={v.freeOver} onChange={(e) => setV({ ...v, freeOver: e.target.value.replace(/[^\d.]/g, "") })} placeholder="999" />
                </div>
              )}
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Min. working days" error={errors.minDays}>
              {(p) => <Input {...p} type="number" min={0} max={90} className="tabular-nums" value={v.minDays} onChange={(e) => setV({ ...v, minDays: e.target.value })} />}
            </Field>
            <Field label="Max. working days" error={errors.maxDays}>
              {(p) => <Input {...p} type="number" min={1} max={120} className="tabular-nums" value={v.maxDays} onChange={(e) => setV({ ...v, maxDays: e.target.value })} />}
            </Field>
          </div>

          <label className="flex items-center justify-between gap-4 rounded-lg border-2 border-line px-4 py-3">
            <span>
              <span className="block text-sm font-medium">Offer at checkout</span>
              <span className="block text-xs text-ink-subtle">Inactive rates are saved but hidden from buyers.</span>
            </span>
            <Switch checked={v.active} onCheckedChange={(a) => setV({ ...v, active: a })} aria-label="Active" />
          </label>

          <div className="flex justify-end gap-2 border-t-2 border-line pt-5">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              {rate ? "Save rate" : "Add rate"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
