"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Check, PackagePlus, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import type { InventoryRow } from "@/lib/queries/vendor-products";
import { restockVariants, updateVariantInventory } from "@/lib/actions/vendor-products";
import { cn, formatMoney } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox, RadioCard, RadioGroup } from "@/components/ui/controls";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import { Table, TableWrap, TBody, Td, Th, THead, Tr } from "@/components/ui/table";
import { ProductThumb } from "./product-thumb";
import { stockState, variantLabel, type StockState } from "./shared";

const STATE_BADGE: Record<StockState, { tone: "success" | "warning" | "danger"; label: string }> = {
  in: { tone: "success", label: "In stock" },
  low: { tone: "warning", label: "Low stock" },
  out: { tone: "danger", label: "Out of stock" },
};

export function InventoryTable({ rows }: { rows: InventoryRow[] }) {
  const [rawSelected, setSelected] = useState<Set<string>>(new Set());
  const [restockOpen, setRestockOpen] = useState(false);

  const selected = useMemo(() => {
    const ids = new Set(rows.map((r) => r.id));
    return new Set([...rawSelected].filter((id) => ids.has(id)));
  }, [rows, rawSelected]);
  const allChecked = rows.length > 0 && selected.size === rows.length;
  const someChecked = selected.size > 0 && !allChecked;
  const toggle = (id: string, on: boolean) =>
    setSelected((s) => {
      const next = new Set(s);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  return (
    <>
      <div
        className={cn(
          "flex min-h-13 flex-wrap items-center gap-3 border-b-2 border-line px-5 py-2.5 sm:px-6",
          selected.size ? "bg-accent-soft/50" : "bg-surface",
        )}
      >
        {selected.size ? (
          <>
            <span className="text-sm font-medium tabular-nums">{selected.size} selected</span>
            <Button size="xs" onClick={() => setRestockOpen(true)}>
              <PackagePlus /> Restock
            </Button>
            <Button size="xs" variant="ghost" onClick={() => setSelected(new Set())}>
              <X /> Clear
            </Button>
          </>
        ) : (
          <p className="text-xs text-ink-subtle">
            Edit a number and press <span className="font-medium text-ink-muted">Enter</span> to save. Select rows to restock in bulk.
          </p>
        )}
      </div>
      <TableWrap>
        <Table className="min-w-230">
          <THead>
            <tr>
              <Th className="w-10">
                <Checkbox
                  checked={allChecked ? true : someChecked ? "indeterminate" : false}
                  onCheckedChange={(v) => setSelected(v === true ? new Set(rows.map((r) => r.id)) : new Set())}
                  aria-label="Select all SKUs on this page"
                />
              </Th>
              <Th>Product</Th>
              <Th>SKU</Th>
              <Th>Variant</Th>
              <Th>Stock</Th>
              <Th>Alert at</Th>
              <Th>Status</Th>
              <Th className="text-right">Value</Th>
            </tr>
          </THead>
          <TBody>
            {rows.map((r) => (
              <InventoryRowView key={r.id} row={r} checked={selected.has(r.id)} onCheck={(on) => toggle(r.id, on)} />
            ))}
          </TBody>
        </Table>
      </TableWrap>

      <RestockDialog
        open={restockOpen}
        onOpenChange={setRestockOpen}
        rows={rows.filter((r) => selected.has(r.id))}
        onDone={() => setSelected(new Set())}
      />
    </>
  );
}

function InventoryRowView({ row, checked, onCheck }: { row: InventoryRow; checked: boolean; onCheck: (on: boolean) => void }) {
  const [server, setServer] = useState({ stock: row.stock, thr: row.lowStockThreshold });
  const [saved, setSaved] = useState(server);
  const [draft, setDraft] = useState({ stock: String(row.stock), thr: String(row.lowStockThreshold) });
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (server.stock !== row.stock || server.thr !== row.lowStockThreshold) {
    const next = { stock: row.stock, thr: row.lowStockThreshold };
    setServer(next);
    setSaved(next);
    setDraft({ stock: String(next.stock), thr: String(next.thr) });
  }

  const parsedStock = /^\d{1,6}$/.test(draft.stock.trim()) ? Number(draft.stock) : null;
  const parsedThr = /^\d{1,6}$/.test(draft.thr.trim()) ? Number(draft.thr) : null;
  const changed = parsedStock !== saved.stock || parsedThr !== saved.thr || draft.stock.trim() === "" || draft.thr.trim() === "";
  const invalid = parsedStock == null || parsedThr == null;
  const state = stockState(saved.stock, saved.thr);
  const label = variantLabel(row.attributes);

  const save = () => {
    if (!changed) return;
    if (invalid) {
      setError("Use whole numbers (0 or more)");
      return;
    }
    const prev = saved;
    const next = { stock: parsedStock!, thr: parsedThr! };
    setSaved(next);
    setError(null);
    start(async () => {
      const r = await updateVariantInventory(row.id, { stock: next.stock, lowStockThreshold: next.thr });
      if (r.ok) toast.success(`${row.sku}: ${r.stock} in stock`);
      else {
        setSaved(prev);
        setError(r.error);
        toast.error(r.error);
      }
    });
  };
  const reset = () => {
    setDraft({ stock: String(saved.stock), thr: String(saved.thr) });
    setError(null);
  };
  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      save();
    } else if (e.key === "Escape") reset();
  };

  return (
    <Tr className={cn(checked && "bg-accent-soft/40 hover:bg-accent-soft/50")}>
      <Td>
        <Checkbox checked={checked} onCheckedChange={(v) => onCheck(v === true)} aria-label={`Select ${row.sku}`} />
      </Td>
      <Td>
        <div className="flex min-w-0 items-center gap-3">
          <ProductThumb src={row.image} size={40} />
          <div className="min-w-0">
            <Link href={`/vendor/products/${row.productId}`} className="line-clamp-1 max-w-64 font-medium text-ink hover:underline hover:underline-offset-4">
              {row.productTitle}
            </Link>
            {row.productStatus === "draft" && <p className="text-2xs text-ink-subtle">Draft</p>}
          </div>
        </div>
      </Td>
      <Td className="whitespace-nowrap font-mono text-xs text-ink-muted">{row.sku}</Td>
      <Td className="whitespace-nowrap text-ink-muted">{label}</Td>
      <Td>
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            aria-label={`Stock for ${row.sku}`}
            aria-invalid={error ? true : undefined}
            value={draft.stock}
            onChange={(e) => setDraft((d) => ({ ...d, stock: e.target.value }))}
            onKeyDown={onKey}
            onFocus={(e) => e.target.select()}
            className={cn("h-9 w-20 tabular-nums", state === "out" && !changed && "text-danger")}
          />
          {changed && (
            <>
              <Button size="icon-sm" variant="primary" onClick={save} loading={pending} aria-label={`Save stock for ${row.sku}`}>
                <Check />
              </Button>
              <Button size="icon-sm" variant="ghost" onClick={reset} aria-label={`Undo changes to ${row.sku}`}>
                <RotateCcw />
              </Button>
            </>
          )}
        </div>
        {error && (
          <p className="mt-1 text-2xs text-danger" role="alert">
            {error}
          </p>
        )}
      </Td>
      <Td>
        <Input
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          aria-label={`Low-stock alert threshold for ${row.sku}`}
          value={draft.thr}
          onChange={(e) => setDraft((d) => ({ ...d, thr: e.target.value }))}
          onKeyDown={onKey}
          onFocus={(e) => e.target.select()}
          className="h-9 w-18 tabular-nums"
        />
      </Td>
      <Td>
        <Badge tone={STATE_BADGE[state].tone} size="sm" dot>
          {STATE_BADGE[state].label}
        </Badge>
      </Td>
      <Td className="whitespace-nowrap text-right tabular-nums text-ink-muted">{formatMoney(Math.max(0, saved.stock) * row.price)}</Td>
    </Tr>
  );
}

function RestockDialog({
  open,
  onOpenChange,
  rows,
  onDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  rows: InventoryRow[];
  onDone: () => void;
}) {
  const [mode, setMode] = useState<"add" | "set">("add");
  const [qty, setQty] = useState("10");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const n = /^\d{1,6}$/.test(qty.trim()) ? Number(qty) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && (
        <DialogContent title="Restock" description={`${rows.length} SKU${rows.length === 1 ? "" : "s"} selected`} size="md">
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (n == null || (mode === "add" && n === 0)) {
                setError(mode === "add" ? "Enter how many units to add (1 or more)" : "Enter a whole number (0 or more)");
                return;
              }
              start(async () => {
                const r = await restockVariants(
                  rows.map((x) => x.id),
                  mode,
                  n,
                );
                if (r.ok) {
                  toast.success(r.message ?? "Restocked");
                  onDone();
                  onOpenChange(false);
                } else setError(r.error);
              });
            }}
          >
            <RadioGroup value={mode} onValueChange={(v) => setMode(v as "add" | "set")} className="grid-cols-2" aria-label="Restock mode">
              <RadioCard value="add">
                <span className="block text-sm font-medium">Add units</span>
                <span className="block text-xs text-ink-muted">Received a shipment</span>
              </RadioCard>
              <RadioCard value="set">
                <span className="block text-sm font-medium">Set to</span>
                <span className="block text-xs text-ink-muted">After a stock count</span>
              </RadioCard>
            </RadioGroup>
            <Field label={mode === "add" ? "Units to add to each SKU" : "New stock level for each SKU"} error={error}>
              {(f) => (
                <Input
                  {...f}
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  autoFocus
                  className="tabular-nums"
                  value={qty}
                  onChange={(e) => {
                    setQty(e.target.value);
                    setError(null);
                  }}
                />
              )}
            </Field>
            <div className="max-h-52 overflow-y-auto rounded-lg border-2 border-line">
              <ul className="divide-y divide-line text-sm">
                {rows.map((r) => {
                  const next = n == null ? null : mode === "add" ? Math.max(0, r.stock) + n : n;
                  return (
                    <li key={r.id} className="flex items-center justify-between gap-3 px-3.5 py-2">
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{r.productTitle}</span>
                        <span className="block truncate font-mono text-2xs text-ink-subtle">
                          {r.sku} · {variantLabel(r.attributes)}
                        </span>
                      </span>
                      <span className="shrink-0 tabular-nums text-ink-muted">
                        {r.stock} → <span className="font-semibold text-ink">{next ?? "?"}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="flex justify-end gap-2 border-t-2 border-line pt-5">
              <DialogClose asChild>
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" loading={pending}>
                {mode === "add" ? `Add ${n ?? 0} units` : `Set to ${n ?? 0}`}
              </Button>
            </div>
          </form>
        </DialogContent>
      )}
    </Dialog>
  );
}
