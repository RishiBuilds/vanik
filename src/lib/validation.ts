import { z } from "zod";

export const addressSchema = z.object({
  label: z.string().trim().max(30).default("Home"),
  fullName: z.string().trim().min(2, "Enter the recipient’s name").max(80),
  line1: z.string().trim().min(3, "Enter a flat / house no. and building").max(120),
  line2: z.string().trim().max(120).optional().default(""),
  city: z.string().trim().min(2, "Enter a city").max(80),
  region: z.string().trim().min(2, "Choose a state").max(60),
  postalCode: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a 6-digit PIN code"),
  country: z.string().trim().default("IN"),
  phone: z
    .string()
    .trim()
    .max(30)
    .optional()
    .default("")
    .refine((v) => !v || isIndianMobile(v), "Enter a 10-digit mobile number"),
});

export function isIndianMobile(v: string) {
  const d = v.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "");
  return /^[6-9]\d{9}$/.test(d);
}

export const upiSchema = z.string().trim().regex(/^[\w.\-]{2,256}@[a-zA-Z][a-zA-Z0-9]{1,64}$/, "Enter a valid UPI ID, e.g. name@okhdfcbank");

export const cardSchema = z.object({
  number: z
    .string()
    .transform((v) => v.replace(/\s+/g, ""))
    .pipe(z.string().regex(/^\d{13,19}$/, "Enter a valid card number")),
  expiry: z.string().regex(/^(0[1-9]|1[0-2])\s?\/\s?\d{2}$/, "Use MM / YY"),
  cvc: z.string().regex(/^\d{3,4}$/, "3 or 4 digits"),
  holderName: z.string().trim().min(2, "Enter the name on the card"),
});

export const ifscSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Enter a valid 11-character IFSC code");

export type FieldErrors = Record<string, string[] | undefined>;
