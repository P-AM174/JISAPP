/**
 * アプリの保存データの圧縮（ブラウザ側）。
 * ジサップの画面（ブリッジ）が、クラウドに送る前に gzip で縮め、読み込んだあとで元に戻す。
 * 日本語の文章や記録の JSON はよく縮むので、同じ上限（圧縮後 2MB）により多くのデータが入り、通信量も減る。
 *
 * 保存形式：先頭に COMPRESSED_PREFIX を付けた base64 の gzip。付いていない値はそのまま（圧縮前の古いデータ・小さいデータ）。
 * アプリが送ってくる値は JSON.stringify の結果なので、"gz1:" で始まることはない。
 */

export const COMPRESSED_PREFIX = "gz1:";
/** これより小さいデータは圧縮しない（縮む量が少ないため） */
const COMPRESS_MIN_BYTES = 2 * 1024;

export function isCompressed(value: string | null | undefined): value is string {
  return typeof value === "string" && value.startsWith(COMPRESSED_PREFIX);
}

function canCompress(): boolean {
  return typeof CompressionStream !== "undefined" && typeof DecompressionStream !== "undefined";
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

function fromBase64(text: string): Uint8Array {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

/** 保存する前に縮める。小さいデータや、ブラウザが対応していないときはそのまま返す */
export async function compressAppData(raw: string): Promise<string> {
  const bytes = new TextEncoder().encode(raw);
  if (bytes.length < COMPRESS_MIN_BYTES || !canCompress()) return raw;
  try {
    const packed = COMPRESSED_PREFIX + toBase64(await pipe(bytes, new CompressionStream("gzip")));
    // 縮まなかったとき（すでに圧縮されたような中身）は、元のまま保存する
    return packed.length < raw.length ? packed : raw;
  } catch {
    return raw;
  }
}

/** 読み込んだあとで元に戻す。圧縮されていない値はそのまま返す */
export async function decompressAppData(value: string | null): Promise<string | null> {
  if (!isCompressed(value)) return value;
  const bytes = await pipe(fromBase64(value.slice(COMPRESSED_PREFIX.length)), new DecompressionStream("gzip"));
  return new TextDecoder().decode(bytes);
}
