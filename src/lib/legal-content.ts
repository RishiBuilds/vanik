export type LegalDocSlug = "terms" | "privacy";

export type LegalBlock = { type: "p"; text: string } | { type: "list"; items: string[] };

export type LegalSection = { id: string; heading: string; body: LegalBlock[] };

export type LegalDoc = {
  slug: LegalDocSlug;
  title: string;
  description: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
};

export const LEGAL_DOCS: Record<LegalDocSlug, LegalDoc> = {
  terms: {
    slug: "terms",
    title: "Terms of Service",
    description: "The rules for using Vanik as a shopper or a seller.",
    updated: "2026-09-01",
    intro:
      "These terms explain how Vanik works and what we expect from everyone who uses it. By creating an account or placing an order you agree to them. They are written to be read, so please do.",
    sections: [
      {
        id: "about",
        heading: "1. About Vanik",
        body: [
          {
            type: "p",
            text: "Vanik is an online marketplace that connects independent shops (“sellers”) with people who want to buy from them (“buyers”). Vanik provides the platform, checkout and payment handling. Sellers are responsible for their products, listings, shipping and returns.",
          },
        ],
      },
      {
        id: "accounts",
        heading: "2. Your account",
        body: [
          {
            type: "list",
            items: [
              "You must be at least 18, or the age of majority where you live, to create an account.",
              "Keep your sign-in details secure. You are responsible for activity on your account.",
              "Give accurate information, and keep it up to date.",
              "Shopping accounts and seller accounts are separate account types with different features.",
            ],
          },
        ],
      },
      {
        id: "buying",
        heading: "3. Buying on Vanik",
        body: [
          {
            type: "p",
            text: "When you check out, you enter into a separate contract with each seller whose items are in your cart. Each seller ships its items separately, under its own shipping rates, handling times and return policy, all of which are shown before you pay.",
          },
          {
            type: "p",
            text: "Vanik collects a single payment for your whole order and passes each seller its share. If an order never arrives or is significantly not as described, our buyer protection lets you request a refund for that seller's portion of the order.",
          },
        ],
      },
      {
        id: "selling",
        heading: "4. Selling on Vanik",
        body: [
          {
            type: "list",
            items: [
              "Only list items you have the right to sell, and describe them accurately, including materials, dimensions and handling time.",
              "Honour your published shipping rates and return policy.",
              "Update order statuses promptly and provide tracking when you ship.",
              "Vanik charges an 8% commission on each sale (item price plus shipping) and ₹10 per payout. There are no listing or monthly fees.",
              "Payouts are made every 14 days for delivered orders, less commission and refunds.",
            ],
          },
        ],
      },
      {
        id: "prohibited",
        heading: "5. Prohibited items and conduct",
        body: [
          {
            type: "p",
            text: "You may not use Vanik to sell counterfeit, stolen, illegal or dangerous goods, to infringe others' intellectual property, to post misleading reviews, or to harass other users. We may remove listings or suspend accounts that break these rules.",
          },
        ],
      },
      {
        id: "reviews",
        heading: "6. Reviews and content",
        body: [
          {
            type: "p",
            text: "You keep ownership of content you post, such as reviews and product photos, and grant Vanik a licence to display it on the marketplace. Reviews must reflect a genuine experience with a purchased item.",
          },
        ],
      },
      {
        id: "liability",
        heading: "7. Liability",
        body: [
          {
            type: "p",
            text: "Vanik provides the marketplace “as is”. To the extent permitted by law, we are not liable for indirect or consequential losses, and our total liability for any claim is limited to the fees we received in connection with the relevant order.",
          },
          {
            type: "p",
            text: "These terms are governed by the laws of India, including the Consumer Protection (E-Commerce) Rules, 2020. Any dispute will be subject to the exclusive jurisdiction of the courts in Bengaluru, Karnataka. Grievances can be raised with our Grievance Officer at grievance@vanik.example; we acknowledge within 48 hours and resolve within one month.",
          },
        ],
      },
      {
        id: "changes",
        heading: "8. Changes to these terms",
        body: [
          {
            type: "p",
            text: "We may update these terms from time to time. When we make material changes we will update the date at the top of this page and, where appropriate, let you know by email.",
          },
        ],
      },
      {
        id: "contact",
        heading: "9. Contact",
        body: [{ type: "p", text: "Questions about these terms? Email support@vanik.example." }],
      },
    ],
  },

  privacy: {
    slug: "privacy",
    title: "Privacy Policy",
    description: "What information Vanik collects, why, and the choices you have.",
    updated: "2026-09-01",
    intro:
      "We collect only the information we need to run the marketplace, and we never sell it. This policy explains what we collect, how we use it and who we share it with.",
    sections: [
      {
        id: "collect",
        heading: "1. Information we collect",
        body: [
          {
            type: "list",
            items: [
              "Account details: your name, email address and a hashed password.",
              "Order details: items purchased, shipping addresses, order totals and order history.",
              "Activity on Vanik: your wishlist, followed shops, reviews and cart contents.",
              "Seller details: shop name, description, images, products, shipping settings and payout information.",
              "Technical data: basic device and browser information and cookies needed to keep you signed in.",
            ],
          },
        ],
      },
      {
        id: "use",
        heading: "2. How we use it",
        body: [
          {
            type: "list",
            items: [
              "To create and secure your account.",
              "To process orders and pass each seller the details it needs to fulfil them.",
              "To show your order history, wishlist and followed shops.",
              "To calculate seller balances, commission and payouts.",
              "To keep the marketplace safe and to prevent fraud and abuse.",
              "To send the newsletter, only if you subscribe.",
            ],
          },
        ],
      },
      {
        id: "sharing",
        heading: "3. Who we share it with",
        body: [
          {
            type: "p",
            text: "When you place an order, the sellers in that order receive your name, shipping address and the items you bought from them. We use service providers for hosting, email and payment processing, bound by contracts to protect your data. We do not sell your personal information.",
          },
        ],
      },
      {
        id: "cookies",
        heading: "4. Cookies",
        body: [
          {
            type: "p",
            text: "We use essential cookies to keep you signed in and to remember your cart, and local storage to remember your light or dark theme preference. We do not use third-party advertising cookies.",
          },
        ],
      },
      {
        id: "retention",
        heading: "5. How long we keep it",
        body: [
          {
            type: "p",
            text: "We keep account information while your account is open. Order records and GST invoices are kept for as long as required under Indian tax and accounting law (currently eight years). When you close your account, we delete or anonymise your personal information unless we need to keep it by law.",
          },
          {
            type: "p",
            text: "We process personal data in line with India’s Digital Personal Data Protection Act, 2023, and your data is stored on servers located in India.",
          },
        ],
      },
      {
        id: "rights",
        heading: "6. Your choices and rights",
        body: [
          {
            type: "list",
            items: [
              "Access and update your information from your account at any time.",
              "Ask us for a copy of your data, or to delete it.",
              "Unsubscribe from the newsletter with the link in any email.",
            ],
          },
        ],
      },
      {
        id: "contact",
        heading: "7. Contact",
        body: [{ type: "p", text: "For privacy questions or requests, email support@vanik.example." }],
      },
    ],
  },
};

export const LEGAL_DOC_LIST: LegalDoc[] = Object.values(LEGAL_DOCS);

export function getLegalDoc(slug: string): LegalDoc | undefined {
  return Object.hasOwn(LEGAL_DOCS, slug) ? LEGAL_DOCS[slug as LegalDocSlug] : undefined;
}