/**
 * アプリが、その人のデータを保存する仕組み（ジサップの saveData / loadData、または localStorage）を使っているか。
 * 使っていないアプリ（保存しないゲームなど）では、未ログインで開いたときの「保存機能について」の案内を出さない。
 * グループ共有（Jisapp.shared）だけのアプリは、ログインしなくても共有できるので、ここでは「保存しない」とみなす
 */
export function appSavesData(source: string): boolean {
  if (!source) return false;
  return /(?:Jisapp|Zisup)\s*\.\s*(?:saveData|loadData)\s*\(/.test(source) || /\blocalStorage\b/.test(source);
}
