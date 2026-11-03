import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { Column, ColumnInput, ColumnLocale, EmbeddedApp, PopularApp } from "./types";
import { normalizeTags } from "./tags";
import { appIdsInBody } from "./markdown";

type Row = {
  id: string; slug: string; locale: ColumnLocale; title: string; description: string; body: string;
  cover_image: string | null; x_text: string; tags?: string[] | null; status: Column["status"]; published_at: string | null;
  created_at: string; updated_at: string;
};

function toColumn(r: Row): Column {
  return {
    id: r.id, slug: r.slug, locale: r.locale, title: r.title, description: r.description, body: r.body,
    coverImage: r.cover_image, xText: r.x_text, tags: r.tags ?? [], status: r.status, publishedAt: r.published_at,
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

export const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,79}$/;

/** 入力の検査。直すべき点を日本語で返す */
export function validateColumnInput(input: ColumnInput): string[] {
  const errors: string[] = [];
  if (input.slug !== undefined && !SLUG_RE.test(input.slug)) errors.push("URL の名前は、半角の小文字・数字・ハイフンで80文字まで（例：travel-split）");
  if (input.title !== undefined && input.title.length > 120) errors.push("タイトルは120文字まで");
  if (input.description !== undefined && input.description.length > 300) errors.push("説明は300文字まで");
  if (input.body !== undefined && input.body.length > 60000) errors.push("本文は60,000文字まで");
  if (input.xText !== undefined && input.xText.length > 280) errors.push("X の投稿文は280文字まで");
  if (input.locale !== undefined && !["ja", "en"].includes(input.locale)) errors.push("言語が正しくありません");
  if (input.status !== undefined && !["draft", "published"].includes(input.status)) errors.push("公開の状態が正しくありません");
  if (input.coverImage && !/^https:\/\/[^\s"'<>]+$/.test(input.coverImage)) errors.push("見出し画像の場所が正しくありません");
  return errors;
}

function toRow(input: ColumnInput): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.slug !== undefined) row.slug = input.slug;
  if (input.locale !== undefined) row.locale = input.locale;
  if (input.title !== undefined) row.title = input.title;
  if (input.description !== undefined) row.description = input.description;
  if (input.body !== undefined) row.body = input.body;
  if (input.coverImage !== undefined) row.cover_image = input.coverImage || null;
  if (input.xText !== undefined) row.x_text = input.xText;
  if (input.status !== undefined) row.status = input.status;
  if (input.tags !== undefined) row.tags = normalizeTags(input.tags);
  return row;
}

export async function listColumnsAdmin(): Promise<Column[]> {
  const sb = createServerSupabaseClient();
  const { data } = await sb.from("columns").select("*").order("updated_at", { ascending: false }).limit(200);
  return ((data ?? []) as Row[]).map(toColumn);
}

export async function getColumnAdmin(id: string): Promise<Column | null> {
  const sb = createServerSupabaseClient();
  const { data } = await sb.from("columns").select("*").eq("id", id).maybeSingle();
  return data ? toColumn(data as Row) : null;
}

/** 新しい下書き。URL の名前は仮のもの（あとで変えられる） */
export async function createColumnDraft(locale: ColumnLocale = "ja"): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const sb = createServerSupabaseClient();
  const slug = `draft-${Date.now().toString(36)}`;
  const { data, error } = await sb.from("columns").insert({ slug, locale }).select("id").single();
  if (error || !data) return { ok: false, error: error?.message ?? "作れませんでした" };
  return { ok: true, id: (data as { id: string }).id };
}

export async function updateColumn(id: string, input: ColumnInput): Promise<{ ok: true; column: Column } | { ok: false; error: string }> {
  const sb = createServerSupabaseClient();
  const current = await getColumnAdmin(id);
  if (!current) return { ok: false, error: "記事が見つかりません" };
  const row = toRow(input);
  row.updated_at = new Date().toISOString();
  // 初めて公開したときの日時を残す（下書きに戻して再公開しても変えない）
  if (input.status === "published" && !current.publishedAt) row.published_at = new Date().toISOString();
  if (input.status === "published") {
    const title = input.title ?? current.title;
    if (!title.trim()) return { ok: false, error: "タイトルを入れてから公開してください" };
    if ((input.slug ?? current.slug).startsWith("draft-")) return { ok: false, error: "公開の前に、URL の名前を決めてください（例：travel-split）" };
  }
  const { data, error } = await sb.from("columns").update(row).eq("id", id).select("*").single();
  if (error) return { ok: false, error: error.code === "23505" ? "その URL の名前は、ほかの記事で使っています" : error.message };
  return { ok: true, column: toColumn(data as Row) };
}

export async function deleteColumn(id: string): Promise<boolean> {
  const sb = createServerSupabaseClient();
  const { error } = await sb.from("columns").delete().eq("id", id);
  return !error;
}

export async function listPublishedColumns(locale: ColumnLocale, limit = 50): Promise<Column[]> {
  const sb = createServerSupabaseClient();
  const { data } = await sb.from("columns").select("*").eq("status", "published").eq("locale", locale)
    .order("published_at", { ascending: false }).limit(limit);
  return ((data ?? []) as Row[]).map(toColumn);
}

export async function getPublishedColumn(slug: string): Promise<Column | null> {
  if (!SLUG_RE.test(slug)) return null;
  const sb = createServerSupabaseClient();
  const { data } = await sb.from("columns").select("*").eq("slug", slug).eq("status", "published").maybeSingle();
  return data ? toColumn(data as Row) : null;
}

/** 本文に入れたアプリ（公開中のものだけ）のカード情報 */
export async function getEmbeddedApps(body: string): Promise<Record<string, EmbeddedApp>> {
  const ids = appIdsInBody(body);
  if (!ids.length) return {};
  const sb = createServerSupabaseClient();
  const { data } = await sb.from("apps").select("id, title, description").in("id", ids).eq("status", "active");
  const map: Record<string, EmbeddedApp> = {};
  for (const a of (data ?? []) as EmbeddedApp[]) map[a.id] = a;
  return map;
}

/** 次に読む記事：同じタグの記事を先に、足りなければ新しい順で */
export async function listRelatedColumns(column: Column, limit = 3): Promise<Column[]> {
  const all = (await listPublishedColumns(column.locale, 30)).filter((c) => c.id !== column.id);
  const score = (c: Column) => c.tags.filter((t) => column.tags.includes(t)).length;
  return all.map((c, i) => ({ c, s: score(c), i })).sort((a, b) => b.s - a.s || a.i - b.i).slice(0, limit).map((x) => x.c);
}

/** 人気のアプリ（よく開かれている、一覧に出している公開中のアプリ） */
export async function listPopularApps(limit = 3): Promise<PopularApp[]> {
  const sb = createServerSupabaseClient();
  const tries = [
    () => sb.from("apps").select("id, title").eq("status", "active").eq("is_listed", true).order("open_count", { ascending: false }).limit(limit),
    () => sb.from("apps").select("id, title").eq("status", "active").order("created_at", { ascending: false }).limit(limit),
  ];
  for (const q of tries) {
    try {
      const { data, error } = await q();
      if (!error && data?.length) return data as PopularApp[];
    } catch {
      /* 列がないときは次の方法 */
    }
  }
  return [];
}

/** サイトマップ用 */
export async function listPublishedColumnSlugs(): Promise<{ slug: string; locale: ColumnLocale; updatedAt: string }[]> {
  try {
    const sb = createServerSupabaseClient();
    const { data } = await sb.from("columns").select("slug, locale, updated_at").eq("status", "published").limit(1000);
    return ((data ?? []) as { slug: string; locale: ColumnLocale; updated_at: string }[]).map((r) => ({ slug: r.slug, locale: r.locale, updatedAt: r.updated_at }));
  } catch {
    return [];
  }
}

// 記事の写真（Supabase Storage の column-images に「記事のID/ランダム.webp」で置く）
export const IMAGE_BUCKET = "column-images";
export const MAX_IMAGE_BYTES = 1024 * 1024;
const IMAGE_TYPES: Record<string, string> = { "image/webp": "webp", "image/jpeg": "jpg" };

/** この置き場の公開 URL の頭（例：https://xxx.supabase.co/storage/v1/object/public/column-images/） */
function imageUrlPrefix(): string {
  return `${(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "")}/storage/v1/object/public/${IMAGE_BUCKET}/`;
}

export async function saveColumnImage(columnId: string, mime: string, bytes: Uint8Array): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const ext = IMAGE_TYPES[mime];
  if (!ext) return { ok: false, error: "WebP・JPEG の画像だけ使えます" };
  if (bytes.byteLength > MAX_IMAGE_BYTES) return { ok: false, error: "画像が大きすぎます（1MB まで）" };
  if (!(await getColumnAdmin(columnId))) return { ok: false, error: "記事が見つかりません" };
  const sb = createServerSupabaseClient();
  const path = `${columnId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await sb.storage.from(IMAGE_BUCKET).upload(path, bytes, { contentType: mime, cacheControl: "31536000", upsert: false });
  if (error) return { ok: false, error: /bucket/i.test(error.message) ? "写真の置き場がありません（scripts/add-columns.sql を実行してください）" : error.message };
  return { ok: true, url: imageUrlPrefix() + path };
}

/** 本文と見出し画像で使っている、この置き場の写真の場所 */
function usedImagePaths(c: Pick<Column, "body" | "coverImage">): Set<string> {
  const prefix = imageUrlPrefix();
  const used = new Set<string>();
  for (const text of [c.body, c.coverImage ?? ""]) {
    let i = text.indexOf(prefix);
    while (i !== -1) {
      const m = text.slice(i + prefix.length).match(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(?:webp|jpg)/);
      if (m) used.add(m[0]);
      i = text.indexOf(prefix, i + prefix.length);
    }
  }
  return used;
}

/**
 * 使われなくなった写真を消す（公開設定を保存したとき・記事を消したときに呼ぶ）。
 * 書いている途中は消さない（元に戻したときに写真が消えていないように）
 */
export async function cleanupColumnImages(columnId: string, keep: Pick<Column, "body" | "coverImage"> | null): Promise<number> {
  try {
    const sb = createServerSupabaseClient();
    const { data } = await sb.storage.from(IMAGE_BUCKET).list(columnId, { limit: 1000 });
    const used = keep ? usedImagePaths(keep) : new Set<string>();
    const remove = (data ?? []).map((f) => `${columnId}/${f.name}`).filter((p) => !used.has(p));
    if (remove.length) await sb.storage.from(IMAGE_BUCKET).remove(remove);
    return remove.length;
  } catch {
    return 0;
  }
}
