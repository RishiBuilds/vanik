export const WALLETS = [
  { id: "upi", label: "UPI", hint: "Google Pay, PhonePe, Paytm or any UPI app" },
  { id: "netbanking", label: "Net banking", hint: "All major Indian banks" },
  { id: "vanikpay", label: "Vanik Wallet", hint: "Balance: ₹1,200" },
] as const;
export type WalletId = (typeof WALLETS)[number]["id"];

export const NETBANKING_BANKS = [
  "State Bank of India",
  "HDFC Bank",
  "ICICI Bank",
  "Axis Bank",
  "Kotak Mahindra Bank",
  "Bank of Baroda",
  "Punjab National Bank",
  "Yes Bank",
  "IndusInd Bank",
  "Federal Bank",
] as const;
