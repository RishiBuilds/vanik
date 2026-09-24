import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Info } from "lucide-react";
import { LEGAL_DOC_LIST, getLegalDoc } from "@/lib/legal-content";
import { cn, formatDate } from "@/lib/utils";
import { Breadcrumbs } from "@/components/shop/section";
import { ContentBlocks } from "@/components/shop/content-blocks";

export function generateStaticParams() {
  return LEGAL_DOC_LIST.map((d) => ({ doc: d.slug }));
}

export async function generateMetadata(props: PageProps<"/legal/[doc]">): Promise<Metadata> {
  const doc = getLegalDoc((await props.params).doc);
  if (!doc) return { title: "Legal" };
  return { title: doc.title, description: doc.description };
}

export default async function LegalPage(props: PageProps<"/legal/[doc]">) {
  const doc = getLegalDoc((await props.params).doc);
  if (!doc) notFound();

  return (
    <div className="container-page pt-8 lg:pt-10">
      <div className="mx-auto max-w-3xl">
        <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Legal" }, { label: doc.title }]} />

        <nav aria-label="Legal documents" className="mt-6 flex gap-1.5">
          {LEGAL_DOC_LIST.map((d) => (
            <Link
              key={d.slug}
              href={`/legal/${d.slug}`}
              aria-current={d.slug === doc.slug ? "page" : undefined}
              className={cn(
                "inline-flex h-9 items-center rounded-full border-2 px-4 text-sm transition-colors",
                d.slug === doc.slug ? "border-line bg-main text-main-foreground shadow-xs" : "border-line-strong hover:border-ink/40",
              )}
            >
              {d.title}
            </Link>
          ))}
        </nav>

        <article className="mt-10">
          <header className="border-b-2 border-line pb-8">
            <h1 className="font-display font-bold text-4xl tracking-display sm:text-5xl">{doc.title}</h1>
            <p className="mt-3 text-sm text-ink-subtle">
              Last updated <time dateTime={doc.updated}>{formatDate(doc.updated)}</time>
            </p>
            <div role="note" className="mt-6 flex items-start gap-2.5 rounded-lg border-2 border-warning/20 bg-warning-soft px-4 py-3 text-sm text-warning">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
              <p>
                Vanik is a demo marketplace. This document is illustrative only, is not legal advice, and does not create a binding agreement. No real payments are taken and no orders are fulfilled.
              </p>
            </div>
            <p className="mt-6 text-lg leading-relaxed text-ink-muted">{doc.intro}</p>
          </header>

          <nav aria-label="Contents" className="border-b-2 border-line py-8">
            <h2 className="eyebrow mb-3">Contents</h2>
            <ol className="grid gap-x-8 gap-y-1.5 text-sm sm:grid-cols-2">
              {doc.sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-ink-muted underline decoration-transparent underline-offset-4 transition-colors hover:text-ink hover:decoration-line-strong">
                    {s.heading}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {doc.sections.map((s) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="scroll-mt-28 pt-10">
              <h2 id={`${s.id}-h`} className="font-display font-bold text-2xl tracking-display text-ink">
                {s.heading}
              </h2>
              <ContentBlocks blocks={s.body} className="mt-4" />
            </section>
          ))}

          <p className="mt-14 border-t-2 border-line pt-8 text-sm text-ink-muted">
            Still have questions? Visit the{" "}
            <Link href="/help" className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
              help center
            </Link>{" "}
            or email{" "}
            <a href="mailto:support@vanik.example" className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
              support@vanik.example
            </a>
            .
          </p>
        </article>
      </div>
    </div>
  );
}
