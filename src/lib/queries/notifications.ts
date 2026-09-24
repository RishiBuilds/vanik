import "server-only";
import { cache } from "react";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export const getUnreadCount = cache(async (userId: string) => {
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(schema.notifications)
    .where(and(eq(schema.notifications.userId, userId), isNull(schema.notifications.readAt)));
  return Number(row?.n ?? 0);
});

export async function getNotifications(userId: string, opts: { unreadOnly?: boolean; limit?: number } = {}) {
  return db.query.notifications.findMany({
    where: and(eq(schema.notifications.userId, userId), opts.unreadOnly ? isNull(schema.notifications.readAt) : undefined),
    orderBy: desc(schema.notifications.createdAt),
    limit: opts.limit ?? 50,
  });
}
