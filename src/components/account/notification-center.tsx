"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, BellOff, Boxes, CheckCheck, Megaphone, Package, Star, Truck, Wallet, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { markAllNotificationsRead, markNotificationRead, updateNotificationPrefs } from "@/lib/actions/account";
import type { NotificationPrefsMap, NotificationType } from "@/lib/db/schema";
import { cn, timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/controls";
import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

const TYPE_ICON: Record<NotificationType, { icon: LucideIcon; cls: string }> = {
  order: { icon: Package, cls: "bg-info-soft text-info" },
  shipping: { icon: Truck, cls: "bg-accent-soft text-accent" },
  review: { icon: Star, cls: "bg-warning-soft text-warning" },
  stock: { icon: Boxes, cls: "bg-danger-soft text-danger" },
  promo: { icon: Megaphone, cls: "bg-success-soft text-success" },
  payout: { icon: Wallet, cls: "bg-success-soft text-success" },
  system: { icon: Bell, cls: "bg-muted text-ink-muted" },
};

type Note = { id: string; type: NotificationType; title: string; body: string; href: string | null; readAt: Date | null; createdAt: Date };

export function NotificationList({ notes, now }: { notes: Note[]; now: number }) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [pending, start] = useTransition();
  const unread = notes.filter((n) => !n.readAt).length;
  const shown = filter === "unread" ? notes.filter((n) => !n.readAt) : notes;

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-line px-5 py-3 sm:px-6">
        <div className="flex gap-1" role="tablist" aria-label="Filter notifications">
          {(["all", "unread"] as const).map((f) => (
            <button
              key={f}
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={cn("h-8 rounded-full px-3.5 text-sm transition-colors", filter === f ? "bg-main text-main-foreground" : "text-ink-muted hover:bg-muted hover:text-ink")}
            >
              {f === "all" ? "All" : `Unread${unread ? ` (${unread})` : ""}`}
            </button>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          disabled={!unread}
          loading={pending}
          onClick={() =>
            start(async () => {
              const r = await markAllNotificationsRead();
              if (r.ok) toast.success(r.message ?? "Done");
            })
          }
        >
          <CheckCheck /> Mark all as read
        </Button>
      </div>
      {shown.length === 0 ? (
        <EmptyState icon={BellOff} compact title={filter === "unread" ? "You’re all caught up" : "No notifications yet"} description="Order updates, restocks and replies will appear here." />
      ) : (
        <ul className="divide-y divide-line">
          {shown.map((n) => {
            const { icon: Icon, cls } = TYPE_ICON[n.type];
            const body = (
              <>
                <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", cls)}>
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-3">
                    <span className={cn("text-sm", n.readAt ? "font-medium text-ink-muted" : "font-semibold")}>{n.title}</span>
                    <span className="shrink-0 text-xs text-ink-subtle">{timeAgo(n.createdAt, now)}</span>
                  </span>
                  <span className="mt-0.5 block text-sm text-ink-muted">{n.body}</span>
                </span>
                {!n.readAt && <span className="mt-2 size-2 shrink-0 rounded-full bg-accent" aria-label="Unread" />}
              </>
            );
            const cls2 = cn("flex gap-4 px-5 py-4 transition-colors hover:bg-muted/50 sm:px-6", !n.readAt && "bg-accent-soft/30");
            return (
              <li key={n.id}>
                {n.href ? (
                  <Link
                    href={n.href}
                    className={cls2}
                    onClick={() => {
                      if (!n.readAt) void markNotificationRead(n.id).then(() => router.refresh());
                    }}
                  >
                    {body}
                  </Link>
                ) : (
                  <button type="button" className={cn(cls2, "w-full text-left")} onClick={() => !n.readAt && start(() => markNotificationRead(n.id))}>
                    {body}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

const PREF_ROWS: { key: keyof NotificationPrefsMap; label: string; hint: string; vendorOnly?: boolean }[] = [
  { key: "orderUpdates", label: "Order & shipping updates", hint: "Confirmations, shipping and delivery" },
  { key: "reviews", label: "Reviews", hint: "Replies to your reviews, new reviews on your shop" },
  { key: "promotions", label: "Promotions", hint: "Sales, restocks and new shops you follow" },
  { key: "stock", label: "Inventory alerts", hint: "Low-stock and sold-out warnings", vendorOnly: true },
  { key: "payouts", label: "Payouts", hint: "When a payout is sent or delayed", vendorOnly: true },
];

export function NotificationPrefsForm({ initial, isVendor }: { initial: NotificationPrefsMap; isVendor: boolean }) {
  const [prefs, setPrefs] = useState(initial);
  const [pending, start] = useTransition();
  const dirty = JSON.stringify(prefs) !== JSON.stringify(initial);
  const rows = PREF_ROWS.filter((r) => isVendor || !r.vendorOnly);
  return (
    <Card>
      <CardHeader title="Preferences" description="Choose how you hear from us. Security emails are always sent." />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-line text-xs text-ink-subtle">
              <th className="px-5 py-2.5 text-left font-medium sm:px-6">Notification</th>
              <th className="w-24 px-3 py-2.5 font-medium">In-app</th>
              <th className="w-24 px-3 py-2.5 pr-5 font-medium sm:pr-6">Email</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.key}>
                <td className="px-5 py-3.5 sm:px-6">
                  <p className="font-medium">{r.label}</p>
                  <p className="text-xs text-ink-subtle">{r.hint}</p>
                </td>
                {(["inApp", "email"] as const).map((ch) => (
                  <td key={ch} className="px-3 py-3.5 text-center last:pr-5 sm:last:pr-6">
                    <Switch
                      checked={prefs[r.key][ch]}
                      onCheckedChange={(v) => setPrefs((p) => ({ ...p, [r.key]: { ...p[r.key], [ch]: v } }))}
                      aria-label={`${r.label} — ${ch === "inApp" ? "in-app" : "email"}`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <CardFooter>
        <Button variant="ghost" disabled={!dirty || pending} onClick={() => setPrefs(initial)}>
          Reset
        </Button>
        <Button
          disabled={!dirty}
          loading={pending}
          onClick={() =>
            start(async () => {
              const r = await updateNotificationPrefs(prefs);
              if (r.ok) toast.success(r.message ?? "Saved");
            })
          }
        >
          Save preferences
        </Button>
      </CardFooter>
    </Card>
  );
}
