/**
 * アプリが、その人のデータを保存する仕組み（ジサップの saveData / loadData、または localStorage）を使っているか。
 * 使っていないアプリ（保存しないゲームなど）では、未ログインで開いたときの「保存機能について」の案内を出さない。
 * グループ共有（Jisapp.shared）だけのアプリは、ログインしなくても共有できるので、ここでは「保存しない」とみなす
 */
export function appSavesData(source: string): boolean {
  if (!source) return false;
  return usesJisappSave(source) || /\blocalStorage\b/.test(source);
}

/**
 * ジサップの saveData / loadData を呼んでいるか。
 * `const J = window.Jisapp; J.saveData(...)` のように、変数に入れてから呼ぶ書き方も拾う
 */
export function usesJisappSave(source: string): boolean {
  if (!source) return false;
  if (/(?:Jisapp|Zisup)\s*\.\s*(?:saveData|loadData)\s*\(/.test(source)) return true;
  return /\b(?:Jisapp|Zisup)\b/.test(source) && /\.\s*(?:saveData|loadData)\s*\(/.test(source);
}
