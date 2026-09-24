"use client";

import { INDIAN_STATES, type AddressInput } from "@/lib/geo";
import { Field, Input, Select } from "@/components/ui/field";

export function AddressFields({
  value,
  onChange,
  errors = {},
  showLabel = true,
}: {
  value: AddressInput;
  onChange: (v: AddressInput) => void;
  errors?: Record<string, string[] | undefined>;
  showLabel?: boolean;
}) {
  const set = (k: keyof AddressInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onChange({ ...value, [k]: e.target.value });
  return (
    <div className="grid gap-4 sm:grid-cols-6">
      {showLabel && (
        <Field label="Label" className="sm:col-span-2" hint="e.g. Home, Work" error={errors.label}>
          {(p) => <Input {...p} value={value.label} onChange={set("label")} maxLength={30} />}
        </Field>
      )}
      <Field label="Full name" className={showLabel ? "sm:col-span-4" : "sm:col-span-6"} error={errors.fullName}>
        {(p) => <Input {...p} autoComplete="name" value={value.fullName} onChange={set("fullName")} />}
      </Field>
      <Field label="Flat, house no., building" className="sm:col-span-6" error={errors.line1}>
        {(p) => <Input {...p} autoComplete="address-line1" value={value.line1} onChange={set("line1")} placeholder="e.g. Flat 402, Prestige Shantiniketan" />}
      </Field>
      <Field label="Area, street, landmark" optional className="sm:col-span-6" error={errors.line2}>
        {(p) => <Input {...p} autoComplete="address-line2" value={value.line2} onChange={set("line2")} placeholder="e.g. Whitefield Main Road, near ITPL" />}
      </Field>
      <Field label="Town / City" className="sm:col-span-2" error={errors.city}>
        {(p) => <Input {...p} autoComplete="address-level2" value={value.city} onChange={set("city")} />}
      </Field>
      <Field label="State" className="sm:col-span-2" error={errors.region}>
        {(p) => (
          <Select {...p} autoComplete="address-level1" value={value.region} onChange={set("region")}>
            <option value="">Select…</option>
            {INDIAN_STATES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field label="PIN code" className="sm:col-span-2" error={errors.postalCode}>
        {(p) => <Input {...p} autoComplete="postal-code" inputMode="numeric" value={value.postalCode} onChange={set("postalCode")} maxLength={6} placeholder="560066" />}
      </Field>
      <Field label="Mobile number" optional className="sm:col-span-6" hint="10-digit mobile, used by the courier for delivery updates." error={errors.phone}>
        {(p) => <Input {...p} type="tel" autoComplete="tel" inputMode="tel" value={value.phone} onChange={set("phone")} placeholder="+91 98765 43210" />}
      </Field>
    </div>
  );
}
