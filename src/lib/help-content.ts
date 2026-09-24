export type HelpTopicSlug = "shipping" | "returns" | "payments" | "orders" | "selling" | "fees" | "account";

export type HelpBlock = { type: "p"; text: string } | { type: "list"; items: string[] } | { type: "steps"; items: string[] };

export type HelpSection = {
  id: string;
  question: string;
  body: HelpBlock[];
};

export type HelpTopic = {
  slug: HelpTopicSlug;
  title: string;
  label: string;
  summary: string;
  audience: "Shoppers" | "Sellers" | "Everyone";
  sections: HelpSection[];
  related: HelpTopicSlug[];
};

export const HELP_TOPICS: Record<HelpTopicSlug, HelpTopic> = {
  shipping: {
    slug: "shipping",
    title: "Shipping & delivery",
    label: "Shipping",
    summary: "How shipping works when your cart holds items from several independent shops, what it costs, and how to track each package.",
    audience: "Shoppers",
    related: ["orders", "returns", "payments"],
    sections: [
      {
        id: "multiple-packages",
        question: "Why is my order arriving in more than one package?",
        body: [
          {
            type: "p",
            text: "Every shop on Vanik is independently owned and ships from its own studio or warehouse. When you check out with items from three shops, you pay once, but each shop packs and ships its part of the order separately.",
          },
          {
            type: "p",
            text: "Your order page groups items by shop, and each group has its own status and tracking number, so you always know which package is where.",
          },
        ],
      },
      {
        id: "shipping-cost",
        question: "How is shipping calculated?",
        body: [
          {
            type: "p",
            text: "Each shop sets its own shipping rates by zone, so shipping is calculated per shop and shown as a separate line in your cart before you pay. Many shops offer free shipping above a minimum order value; when they do, the cart shows how close you are.",
          },
          {
            type: "list",
            items: [
              "Shipping is charged once per shop, not once per item.",
              "Rates depend on the destination zone the shop has configured (for example domestic, neighbouring countries, rest of world).",
              "The promo code FREESHIP removes shipping charges at checkout on orders above ₹499.",
            ],
          },
        ],
      },
      {
        id: "delivery-times",
        question: "How long will delivery take?",
        body: [
          {
            type: "p",
            text: "Delivery time is handling time plus transit time. Many items are made or finished by hand, so shops list their handling time on every product page. Most shops dispatch within 1 to 3 working days; made-to-order pieces can take longer and are clearly labelled.",
          },
          {
            type: "p",
            text: "Once a shop marks your package as shipped, you will see an estimated delivery date on the order page.",
          },
        ],
      },
      {
        id: "tracking",
        question: "How do I track a package?",
        body: [
          {
            type: "steps",
            items: [
              "Go to Account, then Orders & tracking.",
              "Open the order. Items are grouped by the shop that is sending them.",
              "Each shop group shows its current status and, once shipped, a tracking number and timeline.",
            ],
          },
        ],
      },
      {
        id: "international",
        question: "Do shops ship internationally?",
        body: [
          {
            type: "p",
            text: "Some do. Each shop decides which zones it ships to. If a shop does not ship to your address, checkout will tell you before you pay so you can remove those items or choose a different address. Import duties and taxes for international orders are the buyer's responsibility unless the shop states otherwise.",
          },
        ],
      },
      {
        id: "late-or-lost",
        question: "My package is late or lost. What now?",
        body: [
          {
            type: "p",
            text: "First, check the tracking timeline and the estimated delivery date on your order. If the estimate has passed by more than 5 working days, message the shop from your order page. Shops usually reply within one working day.",
          },
          {
            type: "p",
            text: "If the shop cannot resolve it, contact Vanik support. Every order is covered by buyer protection: if it never arrives, you get a full refund for that shop's portion of the order.",
          },
        ],
      },
    ],
  },

  returns: {
    slug: "returns",
    title: "Returns & refunds",
    label: "Returns",
    summary: "Return policies are set by each shop and shown on every item. Here is how to start a return and when to expect your money back.",
    audience: "Shoppers",
    related: ["orders", "shipping", "payments"],
    sections: [
      {
        id: "policies",
        question: "Who sets the return policy?",
        body: [
          {
            type: "p",
            text: "Each shop sets its own return policy, and it is shown on every product page before you buy. Most shops accept returns within 30 days of delivery. Some items, such as personalised or made-to-order pieces, food, and opened skincare, may be final sale; the product page will say so.",
          },
        ],
      },
      {
        id: "start-return",
        question: "How do I start a return?",
        body: [
          {
            type: "steps",
            items: [
              "Open the order from Account, then Orders & tracking.",
              "Find the shop group that contains the item and choose to contact the shop about a return.",
              "Tell the shop which items you want to return and why. The shop will reply with return instructions and, where applicable, a return address or label.",
              "Ship the item back with tracking and keep the receipt until your refund arrives.",
            ],
          },
        ],
      },
      {
        id: "multi-shop-returns",
        question: "Can I return items from different shops together?",
        body: [
          {
            type: "p",
            text: "No. Because each shop ships from its own location, returns go back to each shop separately and are handled under that shop's policy. Returning something from one shop never affects the rest of your order.",
          },
        ],
      },
      {
        id: "refund-timing",
        question: "When will I get my refund?",
        body: [
          {
            type: "p",
            text: "Shops issue a refund once they receive and inspect the return, usually within 3 working days of delivery back to them. Refunds go to your original payment method. Your bank may take a further 5 to 10 working days to show the credit.",
          },
          {
            type: "list",
            items: [
              "Item price is always refunded for eligible returns.",
              "Original shipping is refunded if the item arrived damaged, faulty or not as described.",
              "Return shipping is paid by the buyer unless the shop's policy says otherwise or the item was not as described.",
            ],
          },
        ],
      },
      {
        id: "damaged",
        question: "My item arrived damaged or is not as described.",
        body: [
          {
            type: "p",
            text: "Take a photo of the item and the packaging and message the shop within 7 days of delivery. The shop will offer a replacement or a full refund, including shipping. If you cannot reach an agreement, contact Vanik support and we will step in under buyer protection.",
          },
        ],
      },
      {
        id: "cancel",
        question: "Can I cancel instead of returning?",
        body: [
          {
            type: "p",
            text: "You can ask a shop to cancel its portion of your order while it is still placed or confirmed. Once the shop has packed or shipped your items, cancellation is no longer possible and you will need to request a return after delivery.",
          },
        ],
      },
    ],
  },

  payments: {
    slug: "payments",
    title: "Payments & promo codes",
    label: "Payments",
    summary: "How checkout works, UPI, cards, net banking and cash on delivery, the test details to use in this demo, and how promo codes apply across a multi-shop cart.",
    audience: "Shoppers",
    related: ["orders", "shipping", "account"],
    sections: [
      {
        id: "one-checkout",
        question: "How does one checkout work for many shops?",
        body: [
          {
            type: "p",
            text: "You pay Vanik once for your whole cart. Behind the scenes, the payment is split: each shop receives the amount for its own items and shipping, minus the marketplace commission. You will see one charge on your statement.",
          },
        ],
      },
      {
        id: "demo-payments",
        question: "Is this a real payment?",
        body: [
          {
            type: "p",
            text: "No. Vanik is a demo marketplace and every payment is simulated. No card or UPI account is ever charged and nothing is shipped. Please do not enter real card details.",
          },
          {
            type: "p",
            text: "You can pay by UPI (Google Pay, PhonePe, Paytm or any UPI app), credit or debit card (Visa, Mastercard, RuPay, Amex), net banking, Vanik Wallet or cash on delivery for orders up to ₹25,000. To try it out:",
          },
          {
            type: "list",
            items: [
              "UPI — enter any valid-looking UPI ID, such as yourname@okhdfcbank.",
              "4242 4242 4242 4242 (Visa) or 6521 1111 1111 1110 (RuPay) — payment succeeds and the order is placed. Use any future expiry and any CVC.",
              "4000 0000 0000 0002 — payment is declined, so you can see how errors are handled.",
            ],
          },
        ],
      },
      {
        id: "promo-codes",
        question: "Which promo codes can I use?",
        body: [
          {
            type: "p",
            text: "Enter a code in the cart or at checkout. One code can be applied per order.",
          },
          {
            type: "list",
            items: [
              "WELCOME10 — 10% off your order subtotal.",
              "FREESHIP — free delivery from every shop in your cart on orders above ₹499.",
              "VANIK250 — ₹250 off orders above ₹2,499.",
              "DIWALI15 — 15% off festive orders above ₹1,999.",
            ],
          },
          {
            type: "p",
            text: "Percentage discounts are spread across shops in proportion to each shop's subtotal, so your savings are reflected on every shop's portion of the order.",
          },
        ],
      },
      {
        id: "declined",
        question: "My payment was declined.",
        body: [
          {
            type: "p",
            text: "Nothing is charged when a payment is declined and your cart is kept exactly as it was. Check the card number, expiry and CVC and try again. In this demo, the card 4000 0000 0000 0002 is always declined on purpose; use 4242 4242 4242 4242 to complete an order.",
          },
        ],
      },
      {
        id: "tax",
        question: "Are taxes included in prices?",
        body: [
          {
            type: "p",
            text: "Yes. Like all retail prices in India, prices on Vanik are inclusive of GST. The GST share of your order is shown on the checkout summary and on your invoice, and there are no extra taxes at checkout for delivery within India.",
          },
        ],
      },
    ],
  },

  orders: {
    slug: "orders",
    title: "Orders & tracking",
    label: "Orders",
    summary: "What each order status means, how split orders are shown, and how to change or cancel an order.",
    audience: "Shoppers",
    related: ["shipping", "returns", "payments"],
    sections: [
      {
        id: "statuses",
        question: "What do the order statuses mean?",
        body: [
          {
            type: "p",
            text: "Each shop's portion of your order moves through the same stages. Statuses are updated by the shop as they work on it.",
          },
          {
            type: "steps",
            items: [
              "Placed — payment succeeded and the shop has been notified.",
              "Confirmed — the shop has accepted the order and is preparing your items.",
              "Packed — your items are packed and waiting for the carrier.",
              "Shipped — the carrier has the package. A tracking number is now available.",
              "Out for delivery — the package is on its final leg and should arrive today.",
              "Delivered — the carrier has marked the package as delivered.",
            ],
          },
        ],
      },
      {
        id: "split-status",
        question: "Why do parts of my order show different statuses?",
        body: [
          {
            type: "p",
            text: "Because each shop ships independently, one shop may have already shipped while another is still packing. Your order page shows the status of each shop separately, along with the overall progress of the order.",
          },
        ],
      },
      {
        id: "find-order",
        question: "Where can I find my orders?",
        body: [
          {
            type: "p",
            text: "Sign in and go to Account, then Orders & tracking. Every order shows the date, total, the shops involved and the latest status. Open an order to see items, shipping address, payment summary and tracking for each package.",
          },
        ],
      },
      {
        id: "change-order",
        question: "Can I change my address or items after ordering?",
        body: [
          {
            type: "p",
            text: "Message the shop as soon as possible. Shops can usually update an address or remove an item while the order is placed or confirmed. Once it is packed, changes are at the shop's discretion, and once shipped they are no longer possible.",
          },
        ],
      },
      {
        id: "receipts",
        question: "How do I get a receipt?",
        body: [
          {
            type: "p",
            text: "Your order page doubles as a receipt: it lists every item, the shop that sold it, shipping per shop, discounts, tax and the total paid. You can print it straight from your browser.",
          },
        ],
      },
    ],
  },

  selling: {
    slug: "selling",
    title: "Seller handbook",
    label: "Selling",
    summary: "Everything you need to open a shop on Vanik, list your first products and fulfil orders with confidence.",
    audience: "Sellers",
    related: ["fees", "account", "orders"],
    sections: [
      {
        id: "open-shop",
        question: "How do I open a shop?",
        body: [
          {
            type: "steps",
            items: [
              "Create a seller account from the Sell on Vanik page. Seller accounts are separate from shopping accounts.",
              "Set up your shop: name, a short story, a logo and a banner image. These appear on your public shop page.",
              "Add shipping zones and rates so buyers see accurate costs at checkout.",
              "Write your return policy. It is displayed on every one of your product pages.",
              "List your first products and publish your shop.",
            ],
          },
        ],
      },
      {
        id: "listings",
        question: "What makes a great listing?",
        body: [
          {
            type: "list",
            items: [
              "Bright, natural-light photos on a simple background, with at least one showing scale or the item in use.",
              "A title that says what it is, not just what it is called: “Speckled stoneware mug, 350 ml” beats “Morning mug”.",
              "Materials, dimensions and care instructions in the description.",
              "Honest handling times, especially for made-to-order items.",
              "Variants (size, colour) set up as options rather than separate listings, so reviews stay together.",
            ],
          },
        ],
      },
      {
        id: "inventory",
        question: "How does inventory work?",
        body: [
          {
            type: "p",
            text: "Each product and variant has its own stock count, which goes down automatically when an order is placed. You set a low-stock threshold per product; when stock falls below it, the item is flagged on your dashboard so you can restock before it sells out. Items at zero stock are shown as sold out to buyers.",
          },
        ],
      },
      {
        id: "fulfilment",
        question: "How do I fulfil orders?",
        body: [
          {
            type: "p",
            text: "New orders appear in the Orders section of your vendor dashboard. You only ever see the items buyers ordered from your shop, even when they checked out with other shops too. Move each order through its stages as you work:",
          },
          {
            type: "steps",
            items: [
              "Confirm the order to let the buyer know you are on it.",
              "Mark it packed once it is ready for the carrier.",
              "Mark it shipped and add a tracking number.",
              "Update to out for delivery and delivered as the carrier progresses.",
            ],
          },
        ],
      },
      {
        id: "reviews",
        question: "How do reviews work?",
        body: [
          {
            type: "p",
            text: "Buyers can review products they have purchased. Ratings appear on your product pages and roll up into your shop rating. You can read and respond to reviews from your dashboard; a thoughtful public reply to a critical review often matters more to future buyers than the review itself.",
          },
        ],
      },
      {
        id: "analytics",
        question: "What can I see in analytics?",
        body: [
          {
            type: "p",
            text: "Your dashboard shows revenue, order count, average order value and your best-selling products over time, along with low-stock alerts and recent reviews. Use it to decide what to restock and what to make next.",
          },
        ],
      },
    ],
  },

  fees: {
    slug: "fees",
    title: "Fees & payouts",
    label: "Fees",
    summary: "Vanik charges no listing or monthly fees. You pay a simple commission when you make a sale and get paid every 14 days.",
    audience: "Sellers",
    related: ["selling", "account", "payments"],
    sections: [
      {
        id: "commission",
        question: "What does it cost to sell on Vanik?",
        body: [
          {
            type: "list",
            items: [
              "No listing fees and no monthly subscription.",
              "8% commission on the item price and shipping you charge, deducted only when you make a sale.",
              "₹10 per payout, regardless of payout size. Payouts are sent by NEFT/IMPS to your bank account or instantly to your UPI ID.",
            ],
          },
          {
            type: "p",
            text: "Example: you sell a ₹1,899 vase with ₹79 shipping. Commission is 8% of ₹1,978, which is ₹158.24, so ₹1,819.76 is added to your balance.",
          },
        ],
      },
      {
        id: "discounts",
        question: "How are marketplace promo codes handled?",
        body: [
          {
            type: "p",
            text: "When a buyer uses a Vanik-wide promo code, the discount is split across the shops in their cart in proportion to each shop's subtotal. Commission is calculated on the amount the buyer actually paid for your items.",
          },
        ],
      },
      {
        id: "payout-schedule",
        question: "When do I get paid?",
        body: [
          {
            type: "p",
            text: "Payouts are sent every 14 days. Each payout includes the earnings from orders that were delivered before the payout date, minus commission and any refunds. You can see your upcoming payout and the orders it includes on the Payouts page of your dashboard.",
          },
        ],
      },
      {
        id: "refunds",
        question: "What happens to fees when I refund an order?",
        body: [
          {
            type: "p",
            text: "When you issue a full refund, the commission on that order is returned to you. For a partial refund, commission is reduced in proportion to the amount refunded. The refunded amount is deducted from your next payout.",
          },
        ],
      },
      {
        id: "demo",
        question: "Are payouts real in this demo?",
        body: [
          {
            type: "p",
            text: "No. Vanik is a demo marketplace, so balances and payouts are simulated to show how the dashboard works. No money is transferred.",
          },
        ],
      },
    ],
  },

  account: {
    slug: "account",
    title: "Your account",
    label: "Account",
    summary: "Signing in, the difference between shopping and seller accounts, and managing your wishlist and followed shops.",
    audience: "Everyone",
    related: ["orders", "selling", "payments"],
    sections: [
      {
        id: "account-types",
        question: "What is the difference between a shopping and a seller account?",
        body: [
          {
            type: "p",
            text: "A shopping account lets you buy, save items to your wishlist, follow shops and leave reviews. A seller account adds the vendor dashboard, where you manage your shop, products, orders and payouts.",
          },
          {
            type: "p",
            text: "If you try to open the vendor dashboard with a shopping account, you will be sent to the Sell on Vanik page, where you can create a seller account.",
          },
        ],
      },
      {
        id: "sign-in",
        question: "I cannot sign in.",
        body: [
          {
            type: "list",
            items: [
              "Check that you are using the email address you signed up with.",
              "Passwords are case sensitive. Check that caps lock is off.",
              "If you created your account as a seller, sign in with the same email; you will land on your vendor dashboard.",
            ],
          },
        ],
      },
      {
        id: "wishlist",
        question: "How do the wishlist and following work?",
        body: [
          {
            type: "p",
            text: "Tap the heart on any product to save it to your wishlist, which you can find under Account. Follow a shop from its shop page to keep it in your list of followed shops and hear about its new work first.",
          },
        ],
      },
      {
        id: "addresses",
        question: "How do I manage my addresses?",
        body: [
          {
            type: "p",
            text: "You can enter a shipping address at checkout and it will be saved to your account for next time. Update or remove saved addresses from your account settings.",
          },
        ],
      },
      {
        id: "privacy",
        question: "What data does Vanik keep about me?",
        body: [
          {
            type: "p",
            text: "Only what is needed to run your account and orders: your name, email, addresses, order history, reviews, wishlist and followed shops. Shops see the name and shipping address for orders placed with them. See our privacy policy for details.",
          },
        ],
      },
    ],
  },
};

export const HELP_TOPIC_LIST: HelpTopic[] = Object.values(HELP_TOPICS);

export function getHelpTopic(slug: string): HelpTopic | undefined {
  return Object.hasOwn(HELP_TOPICS, slug) ? HELP_TOPICS[slug as HelpTopicSlug] : undefined;
}

export type HelpArticle = { topic: HelpTopic; section: HelpSection; href: string };

export function allHelpArticles(): HelpArticle[] {
  return HELP_TOPIC_LIST.flatMap((topic) =>
    topic.sections.map((section) => ({ topic, section, href: `/help/${topic.slug}#${section.id}` })),
  );
}

export const POPULAR_ARTICLES: [HelpTopicSlug, string][] = [
  ["shipping", "multiple-packages"],
  ["orders", "statuses"],
  ["returns", "start-return"],
  ["payments", "demo-payments"],
  ["payments", "promo-codes"],
  ["fees", "commission"],
];

function blockText(b: HelpBlock) {
  return b.type === "p" ? b.text : b.items.join(" ");
}

export function searchHelp(query: string): HelpArticle[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];
  const scored = allHelpArticles()
    .map((a) => {
      const title = `${a.section.question} ${a.topic.title}`.toLowerCase();
      const body = a.section.body.map(blockText).join(" ").toLowerCase();
      let score = 0;
      for (const t of terms) {
        if (title.includes(t)) score += 3;
        else if (body.includes(t)) score += 1;
        else return null;
      }
      return { a, score };
    })
    .filter((x): x is { a: HelpArticle; score: number } => x !== null);
  return scored.sort((x, y) => y.score - x.score).map((x) => x.a);
}
