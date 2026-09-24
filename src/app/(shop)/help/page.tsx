import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, LifeBuoy, Mail, Search } from "lucide-react";
import { HELP_TOPIC_LIST, POPULAR_ARTICLES, getHelpTopic, searchHelp } from "@/lib/help-content";
import { firstParam } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { HELP_TOPIC_ICONS } from "@/components/shop/help-topic-icons";

export const metadata: Metadata = {
  title: "Help center",
  description: "Answers about shipping, returns, payments, orders and selling on Vanik.",
};

export default async function HelpPage(props: PageProps<"/help">) {
  const sp = await props.searchParams;
  const q = (firstParam(sp.q) ?? "").trim().slice(0, 100);
  const results = q ? searchHelp(q) : null;
  const popular = POPULAR_ARTICLES.flatMap(([slug, id]) => {
    const topic = getHelpTopic(slug);
    const section = topic?.sections.find((s) => s.id === id);
    return topic && section ? [{ topic, section, href: `/help/${slug}#${id}` }] : [];
  });

  return (
    <>

      <section className="border-b-2 border-line bg-surface">
        <div className="container-page py-14 text-center lg:py-20">
          <p className="eyebrow mb-4">Help center</p>
          <h1 className="mx-auto max-w-2xl font-display font-bold text-4xl tracking-display sm:text-5xl">How can we help?</h1>
          <p className="mx-auto mt-3 max-w-lg text-base text-ink-muted">
            Answers for shoppers and sellers, from split shipments to payouts.
          </p>
          <form action="/help" method="get" role="search" className="mx-auto mt-8 flex max-w-xl gap-2">
            <label htmlFor="help-q" className="sr-only">
              Search help articles
            </label>
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" aria-hidden />
              <input
                id="help-q"
                name="q"
                type="search"
                defaultValue={q}
                placeholder="Search e.g. tracking, refund, promo code"
                className="h-12 w-full rounded-lg border-2 border-line-strong bg-canvas pl-11 pr-4 text-base text-ink shadow-xs transition-[border-color,box-shadow] placeholder:text-ink-subtle hover:border-ink/30 focus:border-ink focus:outline-none focus:ring-3 focus:ring-accent/15"
              />
            </div>
            <Button type="submit" size="lg">
              Search
            </Button>
          </form>
        </div>
      </section>

      <div className="container-page mt-14 lg:mt-20">
        {results ? (
          <section aria-labelledby="results-heading">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <h2 id="results-heading" className="font-display font-bold text-2xl tracking-display">
                {results.length} {results.length === 1 ? "result" : "results"} for &ldquo;{q}&rdquo;
              </h2>
              <Link href="/help" className="text-sm font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
                Clear search
              </Link>
            </div>
            {results.length > 0 ? (
              <ul className="divide-y divide-line overflow-hidden rounded-xl border-2 border-line bg-surface">
                {results.map((a) => (
                  <li key={a.href}>
                    <Link href={a.href} className="group flex items-center justify-between gap-6 px-5 py-4 transition-colors hover:bg-muted/50 sm:px-6">
                      <span className="min-w-0">
                        <span className="block text-base font-medium text-ink">{a.section.question}</span>
                        <span className="mt-0.5 block text-xs text-ink-subtle">{a.topic.title}</span>
                      </span>
                      <ArrowRight className="size-4 shrink-0 text-ink-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-ink" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <Card>
                <EmptyState
                  icon={LifeBuoy}
                  title="No articles match that search"
                  description="Try a shorter or different word, browse the topics below, or contact support."
                  action={
                    <Button asChild variant="outline">
                      <Link href="/help">Browse all topics</Link>
                    </Button>
                  }
                />
              </Card>
            )}
          </section>
        ) : null}


        <section aria-labelledby="topics-heading" className={results ? "mt-16" : undefined}>
          <h2 id="topics-heading" className="mb-6 font-display font-bold text-2xl tracking-display">
            Browse by topic
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {HELP_TOPIC_LIST.map((t) => {
              const Icon = HELP_TOPIC_ICONS[t.slug];
              return (
                <li key={t.slug}>
                  <Link
                    href={`/help/${t.slug}`}
                    className="group flex h-full flex-col rounded-xl border-2 border-line bg-surface p-6 shadow-xs transition-[border-color,box-shadow] hover:border-line-strong hover:shadow-md"
                  >
                    <span className="flex size-10 items-center justify-center rounded-lg bg-accent-soft text-accent-ink">
                      <Icon className="size-5" strokeWidth={1.5} aria-hidden />
                    </span>
                    <span className="mt-5 flex items-center gap-2 text-base font-semibold tracking-tightish text-ink">
                      {t.title}
                    </span>
                    <span className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-ink-muted">{t.summary}</span>
                    <span className="mt-auto flex items-center justify-between pt-5 text-xs text-ink-subtle">
                      {t.audience} · {t.sections.length} articles
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:text-ink" aria-hidden />
                    </span>
                  </Link>
                </li>
              );
            })}
            <li>
              <Link
                href="/sell"
                className="group flex h-full flex-col justify-between rounded-xl bg-night p-6 text-white transition-opacity hover:opacity-95"
              >
                <span>
                  <span className="text-2xs font-semibold uppercase tracking-eyebrow text-white/60">New to selling?</span>
                  <span className="mt-3 block font-display font-bold text-2xl leading-tight">Open your shop on Vanik</span>
                </span>
                <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium">
                  Learn more <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              </Link>
            </li>
          </ul>
        </section>


        <section className="mt-16 grid gap-10 lg:mt-20 lg:grid-cols-[1.6fr_1fr] lg:gap-12">
          <div>
            <h2 className="mb-6 font-display font-bold text-2xl tracking-display">Popular articles</h2>
            <ul className="divide-y divide-line border-y-2 border-line">
              {popular.map((a) => (
                <li key={a.href}>
                  <Link href={a.href} className="group flex items-center justify-between gap-6 py-4">
                    <span className="min-w-0">
                      <span className="block text-base text-ink transition-colors group-hover:text-accent-ink">{a.section.question}</span>
                      <span className="mt-0.5 block text-xs text-ink-subtle">{a.topic.title}</span>
                    </span>
                    <ArrowUpRight className="size-4 shrink-0 text-ink-subtle transition-colors group-hover:text-ink" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <aside aria-labelledby="contact-heading">
            <Card className="p-7 sm:p-8">
              <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-ink">
                <Mail className="size-5" strokeWidth={1.5} aria-hidden />
              </span>
              <h2 id="contact-heading" className="mt-5 font-display font-bold text-2xl tracking-display">
                Contact support
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                Can&rsquo;t find what you need? Our team answers every message. For questions about a specific order, message the shop from your order page first; they know it best.
              </p>
              <Button asChild className="mt-6" block>
                <a href="mailto:support@vanik.example">
                  <Mail /> support@vanik.example
                </a>
              </Button>
              <p className="mt-4 flex items-center gap-2 text-xs text-ink-subtle">
                <span className="size-1.5 rounded-full bg-success" aria-hidden />
                We typically reply within one working day, Monday to Friday.
              </p>
            </Card>
          </aside>
        </section>
      </div>
    </>
  );
}
