"use client";

import { useState } from "react";
import { Plus, Trash2, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, Input, Label } from "@/components/ui/field";
import { Table, TableWrap, TBody, Td, Th, THead, Tr } from "@/components/ui/table";
import { ChipInput } from "./chip-input";
import { MAX_OPTIONS, stockState } from "./shared";

export type FormOption = { key: string; name: string; values: string[] };
export type FormVariant = {
  id?: string;
  attributes: Record<string, string>;
  sku: string;
  price: string;
  compareAtPrice: string;
  stock: string;
  lowStockThreshold: string;
};
type Errors = Record<string, string[] | undefined>;

export function matrixOptions(options: FormOption[]) {
  return options
    .map((o, i) => ({ ...o, name: o.name.trim() || `Option ${i + 1}` }))
    .filter((o) => o.values.length > 0);
}

export function comboKey(attributes: Record<string, string>) {
  return Object.values(attributes)
    .map((v) => v.toLowerCase())
    .sort()
    .join("\u0000");
}

function cartesian(options: { name: string; values: string[] }[]): Record<string, string>[] {
  return options.reduce<Record<string, string>[]>(
    (acc, o) => acc.flatMap((combo) => o.values.map((val) => ({ ...combo, [o.name]: val }))),
    [{}],
  );
}

export function syncVariants(options: FormOption[], prev: FormVariant[], memory: Map<string, FormVariant>): FormVariant[] {
  const opts = matrixOptions(options);
  const combos = cartesian(opts);
  const byKey = new Map(prev.map((v) => [comboKey(v.attributes), v]));
  const template = prev[0];
  return combos.map((attributes) => {
    const key = comboKey(attributes);
    const hit = byKey.get(key) ?? memory.get(key);
    if (hit) return { ...hit, attributes };
    const vals = new Set(Object.values(attributes).map((v) => v.toLowerCase()));
    let relative = template;
    let best = 0;
    for (const p of [...prev, ...memory.values()]) {
      const shared = Object.values(p.attributes).filter((v) => vals.has(v.toLowerCase())).length;
      if (shared > best) {
        best = shared;
        relative = p;
      }
    }
    return {
      attributes,
      sku: "",
      price: relative?.price ?? "",
      compareAtPrice: relative?.compareAtPrice ?? "",
      stock: "0",
      lowStockThreshold: relative?.lowStockThreshold ?? "5",
    };
  });
}

function MoneyInput({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <div className={cn("relative", className)}>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-subtle" aria-hidden>
        ₹
      </span>
      <Input inputMode="decimal" autoComplete="off" placeholder="0" className="pl-7 tabular-nums" {...props} />
    </div>
  );
}

function CellError({ msg }: { msg?: string[] }) {
  if (!msg?.[0]) return null;
  return (
    <p className="mt-1 max-w-48 text-2xs leading-tight text-danger" role="alert">
      {msg[0]}
    </p>
  );
}

export function OptionBuilder({
  options,
  onChange,
  errors,
}: {
  options: FormOption[];
  onChange: (options: FormOption[]) => void;
  errors: Errors;
}) {
  const update = (i: number, patch: Partial<FormOption>) => onChange(options.map((o, j) => (j === i ? { ...o, ...patch } : o)));
  const presets = ["Size", "Color", "Material", "Style"].filter((n) => !options.some((o) => o.name.toLowerCase() === n.toLowerCase()));

  return (
    <div className="space-y-4">
      {options.length === 0 && (
        <p className="text-sm text-ink-muted">
          Does this product come in different sizes, colors or materials? Add options and we’ll build every combination for you.
        </p>
      )}
      {options.map((o, i) => (
        <div key={o.key} className="rounded-lg border-2 border-line bg-muted/30 p-4">
          <div className="grid gap-4 sm:grid-cols-[12rem_minmax(0,1fr)_auto] sm:items-start">
            <Field label={`Option ${i + 1} name`} error={errors[`options.${i}.name`]}>
              {(f) => (
                <Input
                  {...f}
                  value={o.name}
                  maxLength={30}
                  placeholder="e.g. Size"
                  list="option-name-presets"
                  onChange={(e) => update(i, { name: e.target.value })}
                />
              )}
            </Field>
            <Field label="Values" hint="Press Enter or comma to add" error={errors[`options.${i}.values`]}>
              {(f) => (
                <ChipInput
                  id={f.id}
                  invalid={f["aria-invalid"]}
                  describedBy={f["aria-describedby"]}
                  values={o.values}
                  onChange={(values) => update(i, { values })}
                  placeholder={o.name.toLowerCase() === "size" ? "S, M, L" : o.name.toLowerCase() === "color" ? "Sand, Ink" : "Add a value"}
                />
              )}
            </Field>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-ink-subtle hover:text-danger sm:mt-7"
              onClick={() => onChange(options.filter((_, j) => j !== i))}
              aria-label={`Remove option ${o.name || i + 1}`}
            >
              <Trash2 />
            </Button>
          </div>
        </div>
      ))}
      <datalist id="option-name-presets">
        {presets.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>
      {options.length < MAX_OPTIONS && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...options, { key: crypto.randomUUID(), name: "", values: [] }])}
        >
          <Plus /> {options.length ? "Add another option" : "Add options like size or color"}
        </Button>
      )}
      {errors.options?.[0] && <p className="text-xs text-danger">{errors.options[0]}</p>}
    </div>
  );
}

export function SingleVariantFields({
  variant,
  onChange,
  errors,
}: {
  variant: FormVariant;
  onChange: (v: FormVariant) => void;
  errors: Errors;
}) {
  const set = (patch: Partial<FormVariant>) => onChange({ ...variant, ...patch });
  const e = (k: string) => errors[`variants.0.${k}`];
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <Field label="Price" error={e("price")}>
        {(f) => <MoneyInput {...f} value={variant.price} onChange={(ev) => set({ price: ev.target.value })} />}
      </Field>
      <Field label="Compare-at price" optional hint="Shown struck through when on sale" error={e("compareAtPrice")}>
        {(f) => <MoneyInput {...f} value={variant.compareAtPrice} onChange={(ev) => set({ compareAtPrice: ev.target.value })} />}
      </Field>
      <Field label="SKU" hint="Leave blank to auto-generate" error={e("sku")}>
        {(f) => (
          <Input {...f} value={variant.sku} maxLength={40} className="font-mono uppercase" onChange={(ev) => set({ sku: ev.target.value })} />
        )}
      </Field>
      <Field label="Stock on hand" error={e("stock")}>
        {(f) => (
          <Input {...f} type="number" min={0} step={1} inputMode="numeric" className="tabular-nums" value={variant.stock} onChange={(ev) => set({ stock: ev.target.value })} />
        )}
      </Field>
      <Field label="Low-stock alert at" hint="We’ll flag it when stock reaches this" error={e("lowStockThreshold")}>
        {(f) => (
          <Input
            {...f}
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            className="tabular-nums"
            value={variant.lowStockThreshold}
            onChange={(ev) => set({ lowStockThreshold: ev.target.value })}
          />
        )}
      </Field>
    </div>
  );
}

export function VariantMatrix({
  options,
  variants,
  onChange,
  errors,
}: {
  options: FormOption[];
  variants: FormVariant[];
  onChange: (v: FormVariant[]) => void;
  errors: Errors;
}) {
  const opts = matrixOptions(options);
  const [bulkPrice, setBulkPrice] = useState("");
  const [bulkStock, setBulkStock] = useState("");
  const set = (i: number, patch: Partial<FormVariant>) => onChange(variants.map((v, j) => (j === i ? { ...v, ...patch } : v)));
  const e = (i: number, k: string) => errors[`variants.${i}.${k}`];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3 rounded-lg bg-muted/50 p-3">
        <div className="flex items-end gap-2">
          <div>
            <Label htmlFor="bulk-price" className="block text-xs text-ink-muted">
              Price for all
            </Label>
            <MoneyInput id="bulk-price" className="mt-1 w-32 [&_input]:h-9" value={bulkPrice} onChange={(ev) => setBulkPrice(ev.target.value)} />
          </div>
          <Button type="button" size="sm" variant="outline" disabled={!bulkPrice} onClick={() => onChange(variants.map((v) => ({ ...v, price: bulkPrice })))}>
            Apply
          </Button>
        </div>
        <div className="flex items-end gap-2">
          <div>
            <Label htmlFor="bulk-stock" className="block text-xs text-ink-muted">
              Stock for all
            </Label>
            <Input
              id="bulk-stock"
              type="number"
              min={0}
              inputMode="numeric"
              className="mt-1 h-9 w-24 tabular-nums"
              value={bulkStock}
              onChange={(ev) => setBulkStock(ev.target.value)}
            />
          </div>
          <Button type="button" size="sm" variant="outline" disabled={!bulkStock} onClick={() => onChange(variants.map((v) => ({ ...v, stock: bulkStock })))}>
            Apply
          </Button>
        </div>
        <p className="ml-auto flex items-center gap-1.5 text-xs text-ink-subtle">
          <Wand2 className="size-3.5" aria-hidden /> Blank SKUs are generated on save
        </p>
      </div>
      <div className="overflow-hidden rounded-lg border-2 border-line">
        <TableWrap>
          <Table className="min-w-160">
            <THead>
              <tr>
                <Th className="px-2.5">Variant</Th>
                <Th className="px-2.5">SKU</Th>
                <Th className="px-2.5">Price</Th>
                <Th className="px-2.5">Compare-at</Th>
                <Th className="px-2.5">Stock</Th>
                <Th className="px-2.5">Alert at</Th>
              </tr>
            </THead>
            <TBody>
              {variants.map((v, i) => {
                const label = opts.map((o) => v.attributes[o.name]).filter(Boolean).join(" / ");
                const state = stockState(Number(v.stock) || 0, Number(v.lowStockThreshold) || 0);
                return (
                  <Tr key={comboKey(v.attributes)} className="align-top">
                    <Td className="px-2.5 py-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "size-2 shrink-0 rounded-full",
                            state === "out" ? "bg-danger" : state === "low" ? "bg-warning" : "bg-success",
                          )}
                          aria-hidden
                        />
                        <span className="whitespace-nowrap font-medium">{label}</span>
                      </div>
                    </Td>
                    <Td className="px-2.5 py-2.5">
                      <Input
                        aria-label={`SKU for ${label}`}
                        aria-invalid={e(i, "sku") ? true : undefined}
                        value={v.sku}
                        maxLength={40}
                        placeholder="Auto"
                        onChange={(ev) => set(i, { sku: ev.target.value })}
                        className="h-9 w-30 px-2.5 font-mono text-xs uppercase"
                      />
                      <CellError msg={e(i, "sku")} />
                    </Td>
                    <Td className="px-2.5 py-2.5">
                      <MoneyInput
                        aria-label={`Price for ${label}`}
                        aria-invalid={e(i, "price") ? true : undefined}
                        value={v.price}
                        onChange={(ev) => set(i, { price: ev.target.value })}
                        className="w-24 [&_input]:h-9"
                      />
                      <CellError msg={e(i, "price")} />
                    </Td>
                    <Td className="px-2.5 py-2.5">
                      <MoneyInput
                        aria-label={`Compare-at price for ${label}`}
                        aria-invalid={e(i, "compareAtPrice") ? true : undefined}
                        value={v.compareAtPrice}
                        onChange={(ev) => set(i, { compareAtPrice: ev.target.value })}
                        className="w-24 [&_input]:h-9"
                        placeholder="—"
                      />
                      <CellError msg={e(i, "compareAtPrice")} />
                    </Td>
                    <Td className="px-2.5 py-2.5">
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        inputMode="numeric"
                        aria-label={`Stock for ${label}`}
                        aria-invalid={e(i, "stock") ? true : undefined}
                        value={v.stock}
                        onChange={(ev) => set(i, { stock: ev.target.value })}
                        className="h-9 w-16 px-2.5 tabular-nums"
                      />
                      <CellError msg={e(i, "stock")} />
                    </Td>
                    <Td className="px-2.5 py-2.5">
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        inputMode="numeric"
                        aria-label={`Low-stock alert threshold for ${label}`}
                        aria-invalid={e(i, "lowStockThreshold") ? true : undefined}
                        value={v.lowStockThreshold}
                        onChange={(ev) => set(i, { lowStockThreshold: ev.target.value })}
                        className="h-9 w-16 px-2.5 tabular-nums"
                      />
                      <CellError msg={e(i, "lowStockThreshold")} />
                    </Td>
                  </Tr>
                );
              })}
            </TBody>
          </Table>
        </TableWrap>
      </div>
      {errors.variants?.[0] && <p className="text-xs text-danger">{errors.variants[0]}</p>}
    </div>
  );
}
