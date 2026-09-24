"use client";

import { useState, useTransition } from "react";
import { MapPin, MoreHorizontal, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteAddress, saveAddress, setDefaultAddress } from "@/lib/actions/account";
import { emptyAddress, type AddressInput } from "@/lib/geo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/controls";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import { Dropdown, DropdownContent, DropdownItem, DropdownSeparator, DropdownTrigger } from "@/components/ui/dropdown";
import { EmptyState } from "@/components/ui/empty-state";
import { FormError } from "@/components/ui/field";
import { AddressFields } from "@/components/forms/address-fields";

type Address = AddressInput & { id: string; isDefault: boolean };

export function AddressManager({ addresses }: { addresses: Address[] }) {
  const [editing, setEditing] = useState<Address | "new" | null>(null);
  const [deleting, setDeleting] = useState<Address | null>(null);
  const [pending, start] = useTransition();

  return (
    <>
      {addresses.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No saved addresses"
          description="Save an address to check out faster next time."
          action={
            <Button onClick={() => setEditing("new")}>
              <Plus /> Add address
            </Button>
          }
          className="rounded-xl border-2 border-line bg-surface"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((a) => (
            <article key={a.id} className="flex flex-col rounded-xl border-2 border-line bg-surface p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">{a.label || "Address"}</h3>
                  {a.isDefault && <Badge size="sm" tone="solid">Default</Badge>}
                </div>
                <Dropdown>
                  <DropdownTrigger className="-mr-2 -mt-1 inline-flex size-8 items-center justify-center rounded-md text-ink-subtle hover:bg-muted hover:text-ink" aria-label={`Actions for ${a.label}`}>
                    <MoreHorizontal className="size-4" />
                  </DropdownTrigger>
                  <DropdownContent>
                    <DropdownItem onSelect={() => setEditing(a)}>
                      <Pencil /> Edit
                    </DropdownItem>
                    {!a.isDefault && (
                      <DropdownItem
                        onSelect={() =>
                          start(async () => {
                            const r = await setDefaultAddress(a.id);
                            if (r.ok) toast.success(r.message ?? "Updated");
                          })
                        }
                      >
                        <Star /> Set as default
                      </DropdownItem>
                    )}
                    <DropdownSeparator />
                    <DropdownItem destructive onSelect={() => setDeleting(a)}>
                      <Trash2 /> Delete
                    </DropdownItem>
                  </DropdownContent>
                </Dropdown>
              </div>
              <address className="mt-3 flex-1 text-sm not-italic leading-relaxed text-ink-muted">
                <span className="font-medium text-ink">{a.fullName}</span>
                <br />
                {a.line1}
                {a.line2 ? `, ${a.line2}` : ""}
                <br />
                {a.city}, {a.region} – {a.postalCode}
                {a.phone && (
                  <>
                    <br />
                    {a.phone}
                  </>
                )}
              </address>
              <div className="mt-4 flex gap-2">
                <Button size="xs" variant="outline" onClick={() => setEditing(a)}>
                  Edit
                </Button>
              </div>
            </article>
          ))}
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="flex min-h-44 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line-strong text-sm text-ink-muted transition-colors hover:border-ink/40 hover:bg-surface hover:text-ink"
          >
            <Plus className="size-5" /> Add a new address
          </button>
        </div>
      )}

      {editing && <AddressDialog key={editing === "new" ? "new" : editing.id} address={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        {deleting && (
          <DialogContent title="Delete this address?" description={`${deleting.label}: ${deleting.line1}, ${deleting.city}`} size="sm">
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <Button
                variant="danger"
                loading={pending}
                onClick={() =>
                  start(async () => {
                    const r = await deleteAddress(deleting.id);
                    if (r.ok) toast.success(r.message ?? "Deleted");
                    else toast.error(r.error);
                    setDeleting(null);
                  })
                }
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}

function AddressDialog({ address, onClose }: { address: Address | null; onClose: () => void }) {
  const [value, setValue] = useState<AddressInput>(address ?? emptyAddress);
  const [makeDefault, setMakeDefault] = useState(address?.isDefault ?? false);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={address ? "Edit address" : "Add address"} size="lg">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const r = await saveAddress({ id: address?.id, value, makeDefault });
              if (r.ok) {
                toast.success(r.message ?? "Saved");
                onClose();
              } else {
                setError(r.error);
                setErrors(r.fieldErrors ?? {});
              }
            });
          }}
          className="space-y-5"
        >
          <FormError message={error} />
          <AddressFields value={value} onChange={setValue} errors={errors} />
          {!address?.isDefault && (
            <label className="flex items-center gap-2.5 text-sm">
              <Checkbox checked={makeDefault} onCheckedChange={(v) => setMakeDefault(v === true)} /> Use as my default address
            </label>
          )}
          <div className="flex justify-end gap-2 border-t-2 border-line pt-5">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              {address ? "Save changes" : "Add address"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
