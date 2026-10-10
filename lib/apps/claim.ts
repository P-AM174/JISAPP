import { createHash, randomBytes } from "crypto";

/**
 * ゲストで公開したアプリを、ログインしたあと自分の作品として引き継ぐための「引き継ぎの印」。
 * 公開したときに印（ランダムな文字列）を作って本人の端末に渡し、サーバーにはハッシュだけを残す。
 */
export function newClaimToken(): string {
  return randomBytes(24).toString("hex");
}

export function hashClaimToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
