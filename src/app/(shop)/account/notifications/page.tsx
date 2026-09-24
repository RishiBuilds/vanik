import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { defaultNotificationPrefs } from "@/lib/db/schema";
import { requireUser } from "@/lib/session";
import { requestNow } from "@/lib/utils";
import { getNotifications } from "@/lib/queries/notifications";
import { PageHeader } from "@/components/account/page-header";
import { NotificationList, NotificationPrefsForm } from "@/components/account/notification-center";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await requireUser("/account/notifications");
  const [notes, prefsRow] = await Promise.all([
    getNotifications(user.id, { limit: 100 }),
    db.query.notificationPrefs.findFirst({ where: eq(schema.notificationPrefs.userId, user.id) }),
  ]);
  return (
    <div>
      <PageHeader title="Notifications" description="Updates about your orders, reviews and the shops you follow." />
      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_26rem]">
        <NotificationList notes={notes} now={requestNow()} />
        <div className="2xl:sticky 2xl:top-36 2xl:self-start">
          <NotificationPrefsForm initial={prefsRow?.prefs ?? defaultNotificationPrefs} isVendor={user.role === "vendor"} />
        </div>
      </div>
    </div>
  );
}
