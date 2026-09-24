import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Mail, ThumbsDown, ThumbsUp } from "lucide-react";
import { HELP_TOPICS, HELP_TOPIC_LIST, getHelpTopic } from "@/lib/help-content";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/shop/section";
import { ContentBlocks } from "@/components/shop/content-blocks";
import { HELP_TOPIC_ICONS } from "@/components/shop/help-topic-icons";

export function generateStaticParams() {
  return HELP_TOPIC_LIST.map((t) => ({ topic: t.slug }));
}

export async function generateMetadata(props: PageProps<"/help/[topic]">): Promise<Metadata> {
  const topic = getHelpTopic((await props.params).topic);
  if (!topic) return { title: "Help center" };
  return { title: `${topic.title} · Help`, description: topic.summary };
}

export default async function HelpTopicPage(props: PageProps<"/help/[topic]">) {
  const topic = getHelpTopic((await props.params).topic);
  if (!topic) notFound();
  const related = topic.related.map((slug) => HELP_TOPICS[slug]);

  return (
    <div className="container-page pt-8 lg:pt-10">
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { href: "/help", label: "Help center" }, { label: topic.title }]} />


      <nav aria-label="Help topics" className="scrollbar-none -mx-4 mt-5 overflow-x-auto px-4 lg:hidden">
        <ul className="flex gap-1.5">
          {HELP_TOPIC_LIST.map((t) => (
            <li key={t.slug} className="shrink-0">
              <Link
                href={`/help/${t.slug}`}
                aria-current={t.slug === topic.slug ? "page" : undefined}
                className={cn(
                  "inline-flex h-9 items-center rounded-full border-2 px-4 text-sm transition-colors",
                  t.slug === topic.slug ? "border-line bg-main text-main-foreground shadow-xs" : "border-line-strong hover:border-ink/40",
                )}
              >
                {t.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-8 grid gap-12 lg:grid-cols-[220px_1fr] lg:gap-16 xl:grid-cols-[240px_1fr_200px]">

        <nav aria-label="Help topics" className="hidden lg:block">
          <div className="sticky top-28">
            <p className="eyebrow mb-3">Topics</p>
            <ul className="space-y-0.5">
              {HELP_TOPIC_LIST.map((t) => {
                const Icon = HELP_TOPIC_ICONS[t.slug];
                const active = t.slug === topic.slug;
                return (
                  <li key={t.slug}>
                    <Link
                      href={`/help/${t.slug}`}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                        active ? "bg-muted font-medium text-ink" : "text-ink-muted hover:bg-muted/60 hover:text-ink",
                      )}
                    >
                      <Icon className={cn("size-4", active ? "text-accent" : "text-ink-subtle")} strokeWidth={1.75} aria-hidden />
                      {t.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <Link href="/help" className="mt-6 inline-flex items-center gap-1.5 px-3 text-sm font-medium text-ink hover:text-accent-ink">
              All help <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
        </nav>


        <article className="min-w-0 max-w-3xl">
          <header className="border-b-2 border-line pb-8">
            <Badge tone="accent">{topic.audience}</Badge>
            <h1 className="mt-4 font-display font-bold text-4xl tracking-display sm:text-5xl">{topic.title}</h1>
            <p className="mt-4 text-lg leading-relaxed text-ink-muted">{topic.summary}</p>
          </header>

          <div className="divide-y divide-line">
            {topic.sections.map((s) => (
              <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="scroll-mt-28 py-9">
                <h2 id={`${s.id}-h`} className="text-xl font-semibold tracking-tightish text-ink">
                  <a href={`#${s.id}`} className="hover:text-accent-ink">
                    {s.question}
                  </a>
                </h2>
                <ContentBlocks blocks={s.body} className="mt-4" />
              </section>
            ))}
          </div>


          <aside aria-label="Feedback" className="mt-4 flex flex-col gap-4 rounded-xl border-2 border-line bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-ink">Was this helpful?</p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/help"
                className="inline-flex h-9 items-center gap-2 rounded-full border-2 border-line-strong px-4 text-sm transition-colors hover:border-ink/40 hover:bg-muted/60"
              >
                <ThumbsUp className="size-4" aria-hidden /> Yes, thanks
              </Link>
              <a
                href={`mailto:support@vanik.example?subject=${encodeURIComponent(`Help: ${topic.title}`)}`}
                className="inline-flex h-9 items-center gap-2 rounded-full border-2 border-line-strong px-4 text-sm transition-colors hover:border-ink/40 hover:bg-muted/60"
              >
                <ThumbsDown className="size-4" aria-hidden /> No, contact support
              </a>
            </div>
          </aside>


          <section aria-labelledby="related-heading" className="mt-14">
            <h2 id="related-heading" className="font-display font-bold text-2xl tracking-display">
              Related topics
            </h2>
            <ul className="mt-5 grid gap-4 sm:grid-cols-3">
              {related.map((t) => {
                const Icon = HELP_TOPIC_ICONS[t.slug];
                return (
                  <li key={t.slug}>
                    <Link
                      href={`/help/${t.slug}`}
                      className="group flex h-full flex-col rounded-xl border-2 border-line bg-surface p-5 shadow-xs transition-[border-color,box-shadow] hover:border-line-strong hover:shadow-md"
                    >
                      <Icon className="size-5 text-accent" strokeWidth={1.5} aria-hidden />
                      <span className="mt-4 text-sm font-semibold text-ink">{t.title}</span>
                      <span className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-muted">{t.summary}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        </article>


        <aside aria-label="On this page" className="hidden xl:block">
          <div className="sticky top-28">
            <p className="eyebrow mb-3">On this page</p>
            <ul className="space-y-2 border-l-2 border-line">
              {topic.sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="-ml-px block border-l-2 border-transparent pl-4 text-xs leading-relaxed text-ink-muted transition-colors hover:border-ink hover:text-ink">
                    {s.question}
                  </a>
                </li>
              ))}
            </ul>
            <a
              href="mailto:support@vanik.example"
              className="mt-8 inline-flex items-center gap-2 text-xs font-medium text-ink hover:text-accent-ink"
            >
              <Mail className="size-3.5" aria-hidden /> Contact support
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
