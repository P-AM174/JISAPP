import type { ReactNode } from "react";
import { parseBody, type Block, type Inline } from "@/lib/columns/markdown";
import type { EmbeddedApp } from "@/lib/columns/types";
import { CopyText } from "./copy-text";

/**
 * コラムの本文を表示する（公開ページと、編集画面のプレビューで共通）。
 * HTML は使わず、決まった書き方だけを部品にするので、本文に何を書かれても安全
 */
function inl(v: Inline[], k = "i"): ReactNode[] {
  return v.map((x, i) => {
    const key = `${k}${i}`;
    if (x.t === "text") return x.v;
    if (x.t === "br") return <br key={key} />;
    if (x.t === "code") return <code key={key} className="rounded bg-gray-100 px-1.5 py-0.5 text-[0.9em] text-rose-700">{x.v}</code>;
    if (x.t === "bold") return <strong key={key} className="font-bold text-gray-900">{inl(x.v, key)}</strong>;
    const external = /^https?:/i.test(x.href);
    return (
      <a key={key} href={x.href} className="font-semibold text-emerald-700 underline decoration-emerald-300 underline-offset-4 hover:text-emerald-800"
        {...(external ? { target: "_blank", rel: "noopener noreferrer nofollow" } : {})}>{inl(x.v, key)}</a>
    );
  });
}

function AppCard({ app, id, appHref, joined }: { app?: EmbeddedApp; id: string; appHref: (id: string) => string; joined?: boolean }) {
  return (
    <a href={appHref(id)} className={`not-prose flex items-center gap-4 border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4 no-underline transition ${joined ? "mt-6 rounded-t-2xl" : "my-6 rounded-2xl shadow-sm hover:shadow-md"}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/api/apps/${id}/icon?size=180`} alt="" width={56} height={56} className="h-14 w-14 shrink-0 rounded-2xl shadow-sm" />
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-bold text-emerald-700">ジサップのアプリ</span>
        <span className="block truncate text-base font-black text-gray-900">{app?.title ?? "アプリ（公開ページで名前が出ます）"}</span>
        {app?.description ? <span className="mt-0.5 line-clamp-2 block text-xs text-gray-500">{app.description}</span> : null}
      </span>
      <span className="shrink-0 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white">使ってみる</span>
    </a>
  );
}

function block(b: Block, i: number, apps: Record<string, EmbeddedApp>, appHref: (id: string) => string, prev?: Block, next?: Block): ReactNode {
  switch (b.t) {
    case "h2": return <h2 key={i} id={b.id} className="mt-12 mb-4 scroll-mt-20 border-l-4 border-emerald-500 pl-3 text-[1.35rem] font-black leading-snug text-gray-900">{inl(b.v)}</h2>;
    case "h3": return <h3 key={i} id={b.id} className="mt-8 mb-3 scroll-mt-20 text-lg font-bold leading-snug text-gray-900">{inl(b.v)}</h3>;
    case "p": return <p key={i} className="my-5">{inl(b.v)}</p>;
    case "quote": return <blockquote key={i} className="my-6 border-l-4 border-gray-200 pl-4 text-gray-600">{inl(b.v)}</blockquote>;
    case "ul": return <ul key={i} className="my-5 list-disc space-y-1.5 pl-6 marker:text-emerald-500">{b.items.map((it, k) => <li key={k}>{inl(it)}</li>)}</ul>;
    case "ol": return <ol key={i} className="my-5 list-decimal space-y-1.5 pl-6 marker:font-bold marker:text-emerald-600">{b.items.map((it, k) => <li key={k}>{inl(it)}</li>)}</ol>;
    case "hr": return <div key={i} role="separator" className="my-10 text-center tracking-[1em] text-gray-300">・・・</div>;
    case "code": return <pre key={i} className="my-6 overflow-x-auto rounded-xl bg-[#1e2430] p-4 text-[13px] leading-relaxed text-[#cfe3ff]"><code>{b.v}</code></pre>;
    // eslint-disable-next-line @next/next/no-img-element
    case "image": return <figure key={i} className="my-8"><img src={b.src} alt={b.alt} loading="lazy" className="w-full rounded-xl" />{b.alt ? <figcaption className="mt-2 text-center text-xs text-gray-400">{b.alt}</figcaption> : null}</figure>;
    case "app": return <AppCard key={i} id={b.id} app={apps[b.id]} appHref={appHref} joined={next?.t === "prompt"} />;
    case "youtube": return (
      <div key={i} className="my-8 overflow-hidden rounded-xl bg-black" style={{ aspectRatio: "16 / 9" }}>
        <iframe src={`https://www.youtube-nocookie.com/embed/${b.id}`} title="YouTube" loading="lazy" className="h-full w-full" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
      </div>
    );
    // 折りたたみのプロンプト。アプリのカードのすぐ下なら、カードとひとまとまりに見せる
    case "prompt": return (
      <details key={i} className={`group overflow-hidden rounded-2xl border border-gray-200 bg-white ${prev?.t === "app" ? "mb-8 rounded-t-none border-emerald-100" : "my-6"}`}>
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-bold text-gray-700 [&::-webkit-details-marker]:hidden">
          <span className="text-emerald-600 transition-transform group-open:rotate-90">▶</span>
          <span className="flex-1">{b.title}</span>
          <span className="text-xs font-semibold text-gray-400 group-open:hidden">開く</span>
        </summary>
        <div className="border-t border-gray-100 bg-gray-50 px-4 pb-4 pt-3">
          <div className="mb-2 flex justify-end"><CopyText text={b.v} /></div>
          <pre className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap break-words font-sans text-[14px] leading-relaxed text-gray-700">{b.v}</pre>
        </div>
      </details>
    );
    case "fold": return (
      <details key={i} className="group my-6 overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-bold text-gray-700 [&::-webkit-details-marker]:hidden">
          <span className="text-emerald-600 transition-transform group-open:rotate-90">▶</span>
          <span className="flex-1">{b.title}</span>
          <span className="text-xs font-semibold text-gray-400 group-open:hidden">開く</span>
        </summary>
        <div className="border-t border-gray-100 px-4 text-[15.5px]">{b.v.map((c, k) => block(c, k, apps, appHref, b.v[k - 1], b.v[k + 1]))}</div>
      </details>
    );
    case "button": return (
      <div key={i} className="my-8 text-center">
        <a href={b.href} className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-8 py-3.5 text-base font-bold text-white no-underline shadow-md transition hover:bg-emerald-700">{b.label}</a>
      </div>
    );
  }
}

export function ColumnBody({ body, apps = {}, appHref = (id) => `/apps/${id}` }: { body: string; apps?: Record<string, EmbeddedApp>; appHref?: (id: string) => string }) {
  const blocks = parseBody(body);
  return <div className="column-body text-[16.5px] leading-[2] tracking-[0.02em] text-gray-800 [overflow-wrap:anywhere]">{blocks.map((b, i) => block(b, i, apps, appHref, blocks[i - 1], blocks[i + 1]))}</div>;
}
