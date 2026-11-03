export type ColumnStatus = "draft" | "published";
export type ColumnLocale = "ja" | "en";

export type Column = {
  id: string;
  slug: string;
  locale: ColumnLocale;
  title: string;
  description: string;
  body: string;
  coverImage: string | null;
  xText: string;
  tags: string[];
  status: ColumnStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ColumnInput = Partial<Pick<Column, "slug" | "locale" | "title" | "description" | "body" | "coverImage" | "xText" | "status" | "tags">>;

/** 記事の中に入れるアプリのカードに使う情報 */
export type EmbeddedApp = { id: string; title: string; description: string | null };

/** 記事の下の「人気のアプリ」 */
export type PopularApp = { id: string; title: string };
