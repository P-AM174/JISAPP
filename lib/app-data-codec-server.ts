import { gunzipSync } from "node:zlib";
import { APP_DATA_LIMITS } from "@/lib/app-data-limits";
import { COMPRESSED_PREFIX, isCompressed } from "@/lib/app-data-codec";

/**
 * 保存データを元に戻す（サーバー側専用。node:zlib を使うのでブラウザから読み込まないこと）。
 * app_user_data の、アプリが保存したデータ（data_value）を読むときは必ずこれを通す。
 * 圧縮されていない値（古いデータ・小さいデータ）はそのまま返す。壊れている・展開後が大きすぎるときは null。
 *
 * 注意：圧縮して保存したデータがあるので、この処理は取り消さないこと（古いコードに戻すと、
 * アプリに "gz1:..." のまま渡してしまい、アプリが読めなくなる）。
 */
export function decodeAppDataValue(value: string | null): string | null {
  if (!isCompressed(value)) return value;
  try {
    return gunzipSync(Buffer.from(value.slice(COMPRESSED_PREFIX.length), "base64"), {
      maxOutputLength: APP_DATA_LIMITS.rawBytes,
    }).toString("utf8");
  } catch {
    return null;
  }
}
