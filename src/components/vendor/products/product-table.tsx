"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, Copy, ExternalLink, FileText, MoreHorizontal, Pencil, Rocket, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import type { VendorProductRow } from "@/lib/queries/vendor-products";
import { deleteProducts, duplicateProduct, setProductsStatus } from "@/lib/actions/vendor-products";
import { cn, formatDate, formatMoney, formatNumber, pluralize } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/controls";
import { Dropdown, DropdownContent, DropdownItem, DropdownSeparator, DropdownTrigger } from "@/components/ui/dropdown";
import { Table, TableWrap, TBody, Td, Th, THead, Tr } from "@/components/ui/table";
import { ConfirmDialog } from "./confirm-dialog";
import { ProductThumb } from "./product-thumb";
import { STATUS_LABEL, STATUS_TONE, type ProductStatusValue } from "./shared";

function priceLabel(r: VendorProductRow) {
  return r.minPrice === r.maxPrice ? formatMoney(r.minPrice) : `${formatMoney(r.minPrice)} – ${formatMoney(r.maxPrice)}`;
}

function StockCell({ r }: { r: VendorProductRow }) {
  const out = r.totalStock <= 0;
  const attention = r.lowCount + r.outCount;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={cn("font-semibold tabular-nums", out && "text-danger")}>{formatNumber(r.totalStock)}</span>
      {out ? (
        <Badge tone="danger" size="sm">
          Out of stock
        </Badge>
      ) : attention > 0 ? (
        <Badge tone="warning" size="sm" title={`${pluralize(attention, "variant")} at or below the low-stock threshold`}>
          Low{r.variantCount > 1 ? ` · ${attention}` : ""}
        </Badge>
      ) : null}
    </div>
  );
}

type PendingConfirm = { ids: string[]; title: string; description: string } | null;

export function ProductTable({ rows }: { rows: VendorProductRow[] }) {
  const router = useRouter();
  const [rawSelected, setSelected] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<PendingConfirm>(null);
  const [pending, start] = useTransition();

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
  const toggleAll = (on: boolean) => setSelected(on ? new Set(rows.map((r) => r.id)) : new Set());

  const setStatus = (ids: string[], status: ProductStatusValue) =>
    start(async () => {
      const r = await setProductsStatus(ids, status);
      if (r.ok) {
        toast.success(r.message ?? "Updated");
        setSelected(new Set());
      } else toast.error(r.error);
    });

  const askDelete = (ids: string[]) => {
    const first = rows.find((r) => r.id === ids[0]);
    setConfirm({
      ids,
      title: ids.length === 1 ? `Delete “${first?.title ?? "product"}”?` : `Delete ${ids.length} products?`,
      description:
        "This permanently removes the listing, its photos and variants, and takes it out of shoppers’ carts. Past orders keep their line items. This can’t be undone.",
    });
  };

  const duplicate = (id: string) =>
    start(async () => {
      const r = await duplicateProduct(id);
      if (r.ok) {
        toast.success(r.message ?? "Duplicated", {
          action: { label: "Edit", onClick: () => router.push(`/vendor/products/${r.id}`) },
        });
      } else toast.error(r.error);
    });

  const actions = (r: VendorProductRow) => (
    <Dropdown>
      <DropdownTrigger
        className="inline-flex size-8 items-center justify-center rounded-md text-ink-subtle transition-colors hover:bg-muted hover:text-ink data-[state=open]:bg-muted"
        aria-label={`Actions for ${r.title}`}
      >
        <MoreHorizontal className="size-4" />
      </DropdownTrigger>
      <DropdownContent>
        <DropdownItem asChild>
          <Link href={`/vendor/products/${r.id}`}>
            <Pencil /> Edit
          </Link>
        </DropdownItem>
        {r.status === "active" && (
          <DropdownItem asChild>
            <Link href={`/p/${r.slug}`} target="_blank">
              <ExternalLink /> View in store
            </Link>
          </DropdownItem>
        )}
        <DropdownItem onSelect={() => duplicate(r.id)}>
          <Copy /> Duplicate
        </DropdownItem>
        {r.status === "draft" && (
          <DropdownItem onSelect={() => setStatus([r.id], "active")}>
            <Rocket /> Publish
          </DropdownItem>
        )}
        {r.status === "archived" ? (
          <DropdownItem onSelect={() => setStatus([r.id], "draft")}>
            <ArchiveRestore /> Restore to draft
          </DropdownItem>
        ) : (
          <DropdownItem onSelect={() => setStatus([r.id], "archived")}>
            <Archive /> Archive
          </DropdownItem>
        )}
        <DropdownSeparator />
        <DropdownItem destructive onSelect={() => askDelete([r.id])}>
          <Trash2 /> Delete
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  );

  const ids = [...selected];

  return (
    <>

      <TableWrap className="hidden md:block">
        <Table className="min-w-215">
          <THead>
            <tr>
              <Th className="w-10">
                <Checkbox
                  checked={allChecked ? true : someChecked ? "indeterminate" : false}
                  onCheckedChange={(v) => toggleAll(v === true)}
                  aria-label="Select all products on this page"
                />
              </Th>
              <Th>Product</Th>
              <Th>Status</Th>
              <Th className="text-right">Price</Th>
              <Th>Stock</Th>
              <Th className="text-right">Sold</Th>
              <Th>Updated</Th>
              <Th className="w-12">
                <span className="sr-only">Actions</span>
              </Th>
            </tr>
          </THead>
          <TBody>
            {rows.map((r) => {
              const checked = selected.has(r.id);
              return (
                <Tr key={r.id} className={cn(checked && "bg-accent-soft/40 hover:bg-accent-soft/50")}>
                  <Td>
                    <Checkbox checked={checked} onCheckedChange={(v) => toggle(r.id, v === true)} aria-label={`Select ${r.title}`} />
                  </Td>
                  <Td>
                    <div className="flex min-w-0 items-center gap-3">
                      <ProductThumb src={r.image} size={44} />
                      <div className="min-w-0">
                        <Link href={`/vendor/products/${r.id}`} className="line-clamp-1 font-medium text-ink hover:underline hover:underline-offset-4">
                          {r.title}
                        </Link>
                        <p className="mt-0.5 truncate text-xs text-ink-subtle">
                          {r.variantCount > 1 ? `${r.variantCount} variants` : "1 SKU"}
                          {r.categoryName ? ` · ${r.categoryName}` : ""}
                        </p>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <Badge tone={STATUS_TONE[r.status]} size="sm" dot>
                      {STATUS_LABEL[r.status]}
                    </Badge>
                  </Td>
                  <Td className="whitespace-nowrap text-right font-medium tabular-nums">{priceLabel(r)}</Td>
                  <Td>
                    <StockCell r={r} />
                  </Td>
                  <Td className="text-right tabular-nums text-ink-muted">{formatNumber(r.salesCount)}</Td>
                  <Td className="whitespace-nowrap text-ink-muted">{formatDate(r.updatedAt)}</Td>
                  <Td className="text-right">{actions(r)}</Td>
                </Tr>
              );
            })}
          </TBody>
        </Table>
      </TableWrap>


      <div className="md:hidden">
        <label className="flex items-center gap-3 border-b-2 border-line bg-muted/50 px-5 py-2.5 text-xs font-medium text-ink-muted">
          <Checkbox
            checked={allChecked ? true : someChecked ? "indeterminate" : false}
            onCheckedChange={(v) => toggleAll(v === true)}
            aria-label="Select all products on this page"
          />
          Select all
        </label>
        <ul className="divide-y divide-line">
          {rows.map((r) => {
            const checked = selected.has(r.id);
            return (
              <li key={r.id} className={cn("flex gap-3 px-5 py-4", checked && "bg-accent-soft/40")}>
                <Checkbox className="mt-3" checked={checked} onCheckedChange={(v) => toggle(r.id, v === true)} aria-label={`Select ${r.title}`} />
                <ProductThumb src={r.image} size={56} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/vendor/products/${r.id}`} className="line-clamp-2 text-sm font-medium text-ink">
                      {r.title}
                    </Link>
                    <div className="-mr-2 -mt-1">{actions(r)}</div>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-ink-muted">
                    <Badge tone={STATUS_TONE[r.status]} size="sm" dot>
                      {STATUS_LABEL[r.status]}
                    </Badge>
                    <span className="font-semibold tabular-nums text-ink">{priceLabel(r)}</span>
                    <span>{r.variantCount > 1 ? `${r.variantCount} variants` : "1 SKU"}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-subtle">
                    <span className="inline-flex items-center gap-1.5">
                      Stock <StockCell r={r} />
                    </span>
                    <span>{formatNumber(r.salesCount)} sold</span>
                    <span>Updated {formatDate(r.updatedAt)}</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>


      {selected.size > 0 && (
        <div
          role="region"
          aria-label="Bulk actions"
          className="fixed inset-x-3 bottom-4 z-40 mx-auto flex max-w-fit flex-wrap items-center gap-1.5 rounded-xl border-2 border-line bg-surface p-2 pl-4 shadow-lg animate-slide-up sm:gap-2 lg:left-69"
        >
          <span className="mr-1 text-sm font-medium tabular-nums">{selected.size} selected</span>
          <Button size="xs" variant="outline" disabled={pending} onClick={() => setStatus(ids, "active")}>
            <Rocket /> Set active
          </Button>
          <Button size="xs" variant="outline" disabled={pending} onClick={() => setStatus(ids, "draft")}>
            <FileText /> Move to draft
          </Button>
          <Button size="xs" variant="outline" disabled={pending} onClick={() => setStatus(ids, "archived")}>
            <Archive /> Archive
          </Button>
          <Button size="xs" variant="danger-ghost" disabled={pending} onClick={() => askDelete(ids)}>
            <Trash2 /> Delete
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={() => setSelected(new Set())} aria-label="Clear selection">
            <X />
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={confirm?.title ?? ""}
        description={confirm?.description}
        confirmLabel={confirm && confirm.ids.length > 1 ? `Delete ${confirm.ids.length} products` : "Delete product"}
        pending={pending}
        onConfirm={() =>
          confirm &&
          start(async () => {
            const r = await deleteProducts(confirm.ids);
            if (r.ok) {
              toast.success(r.message ?? "Deleted");
              setSelected(new Set());
            } else toast.error(r.error);
            setConfirm(null);
          })
        }
      />
    </>
  );
}
