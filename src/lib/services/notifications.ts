import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import {
  defaultNotificationPrefs,
  type NotificationPrefsMap,
  type NotificationType,
} from "@/lib/db/schema";

type EmailMessage = { to: string; subject: string; text: string };
const emailTransport = {
  async send(msg: EmailMessage) {
    if (process.env.NODE_ENV !== "test") console.info(`[email:mock] → ${msg.to}: ${msg.subject}`);
  },
};

const TYPE_TO_PREF: Record<NotificationType, keyof NotificationPrefsMap | null> = {
  order: "orderUpdates",
  shipping: "orderUpdates",
  review: "reviews",
  stock: "stock",
  promo: "promotions",
  payout: "payouts",
  system: null,
};

export async function notify(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
}) {
  const [prefsRow, recipient] = await Promise.all([
    db.query.notificationPrefs.findFirst({ where: eq(schema.notificationPrefs.userId, input.userId) }),
    db.query.user.findFirst({ where: eq(schema.user.id, input.userId), columns: { email: true } }),
  ]);
  const prefs = prefsRow?.prefs ?? defaultNotificationPrefs;
  const key = TYPE_TO_PREF[input.type];
  const channel = key ? prefs[key] : { inApp: true, email: false };

  if (channel.inApp) {
    await db.insert(schema.notifications).values({
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      href: input.href,
    });
  }
  if (channel.email && recipient) {
    await emailTransport.send({ to: recipient.email, subject: input.title, text: input.body });
  }
}
