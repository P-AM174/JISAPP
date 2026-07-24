import { revalidatePath } from "next/cache";

/** カタログ一覧を表示するページのキャッシュを無効化 */
export function revalidateCatalogPages() {
  revalidatePath("/");
  revalidatePath("/search");
}
