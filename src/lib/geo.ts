export const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir",
  "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
] as const;

export type AddressInput = {
  label: string;
  fullName: string;
  line1: string;
  line2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  phone: string;
};

export const emptyAddress: AddressInput = {
  label: "Home",
  fullName: "",
  line1: "",
  line2: "",
  city: "",
  region: "",
  postalCode: "",
  country: "IN",
  phone: "",
};

const POSTAL_ZONES: Record<string, string> = {
  "1": "Delhi, Haryana, Punjab & North",
  "2": "Uttar Pradesh & Uttarakhand",
  "3": "Rajasthan & Gujarat",
  "4": "Maharashtra, Goa & MP",
  "5": "Andhra Pradesh, Telangana & Karnataka",
  "6": "Tamil Nadu & Kerala",
  "7": "West Bengal, Odisha & North East",
  "8": "Bihar & Jharkhand",
  "9": "Army Post Office",
};

export function pinZone(pin: string) {
  const cleaned = pin.trim().replace(/\D/g, "");
  if (!cleaned) return null;
  const first = cleaned.charAt(0);
  return POSTAL_ZONES[first] ?? null;
}

const METRO_PREFIXES = ["1100", "4000", "5600", "7000", "3800", "6000", "5000", "2260", "4110"];

export function isMetroPin(pin: string) {
  const cleaned = pin.trim().replace(/\D/g, "");
  return METRO_PREFIXES.some((prefix) => cleaned.startsWith(prefix));
}
