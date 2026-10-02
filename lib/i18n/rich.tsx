import { Fragment, type ReactNode } from "react";

/**
 * 太字やリンクを含む文を、辞書で訳せる形で書くための仕組み。
 * 文の中の飾りを <b>…</b> のようなタグで書き、タグごとに描き方を渡す。
 *
 *   rich(t("<b>{n}件</b> 表示中", "Showing <b>{n}</b> apps"), {
 *     b: (chunk) => <span className="font-semibold">{chunk}</span>,
 *   }, { n: 3 })
 *
 * - <br/> は改行になる（描き方は不要）
 * - {name} は values の値に置き換える
 * - 入れ子のタグには対応しない（必要になったら分ける）
 */
export type RichTags = Record<string, (chunk: ReactNode) => ReactNode>;

const TOKEN = /<br\s*\/?>|<(\w+)>([\s\S]*?)<\/\1>/g;

export function rich(template: string, tags: RichTags = {}, values: Record<string, ReactNode> = {}): ReactNode {
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  const pushText = (text: string) => {
    if (!text) return;
    // {name} を値に置き換える
    const parts = text.split(/\{(\w+)\}/g);
    parts.forEach((part, i) => {
      if (i % 2 === 1) out.push(<Fragment key={key++}>{part in values ? values[part] : `{${part}}`}</Fragment>);
      else if (part) out.push(part);
    });
  };
  for (const m of template.matchAll(TOKEN)) {
    pushText(template.slice(last, m.index));
    last = (m.index ?? 0) + m[0].length;
    if (!m[1]) {
      out.push(<br key={key++} />);
      continue;
    }
    const render = tags[m[1]];
    const inner = rich(m[2], {}, values);
    out.push(<Fragment key={key++}>{render ? render(inner) : inner}</Fragment>);
  }
  pushText(template.slice(last));
  return <>{out}</>;
}
