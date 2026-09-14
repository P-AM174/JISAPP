export type StorageUsage = {
  /** window.Zisup.saveData / loadData で使っている識別名 */
  zisupKeys: string[];
  /** localStorage.getItem / setItem / removeItem で使っているキー */
  localStorageKeys: string[];
  usesZisup: boolean;
  usesLocalStorage: boolean;
};

export type StorageChangeFinding = {
  /** 短い見出し */
  title: string;
  /** 詳細説明 */
  detail: string;
  severity: "warn" | "info";
};

const STRING_LIT = String.raw`['"\`]([^'"\`]{1,80})['"\`]`;

/** コードからデータ保存の使い方を抽出する */
export function extractStorageUsage(source: string): StorageUsage {
  if (!source.trim()) {
    return {
      zisupKeys: [],
      localStorageKeys: [],
      usesZisup: false,
      usesLocalStorage: false,
    };
  }

  const zisupKeys = new Set<string>();
  const localStorageKeys = new Set<string>();

  // Zisup.saveData('key' | "key" | `key`) / loadData(...)
  const zisupRe = new RegExp(
    String.raw`(?:window\.)?Zisup\.(?:saveData|loadData)\s*\(\s*${STRING_LIT}`,
    "gi"
  );
  let m: RegExpExecArray | null;
  while ((m = zisupRe.exec(source)) !== null) {
    if (m[1]) zisupKeys.add(m[1]);
  }

  // localStorage.setItem/getItem/removeItem('key')
  const lsRe = new RegExp(
    String.raw`localStorage\.(?:getItem|setItem|removeItem)\s*\(\s*${STRING_LIT}`,
    "gi"
  );
  while ((m = lsRe.exec(source)) !== null) {
    if (m[1]) localStorageKeys.add(m[1]);
  }

  // キーがリテラルでない場合も「使っている」ことだけ検知
  const usesZisup =
    zisupKeys.size > 0 ||
    /(?:window\.)?Zisup\.(?:saveData|loadData)\s*\(/i.test(source);
  const usesLocalStorage =
    localStorageKeys.size > 0 ||
    /localStorage\.(?:getItem|setItem|removeItem)\s*\(/i.test(source);

  return {
    zisupKeys: [...zisupKeys].sort(),
    localStorageKeys: [...localStorageKeys].sort(),
    usesZisup,
    usesLocalStorage,
  };
}

function formatKeys(keys: string[]): string {
  if (keys.length === 0) return "（識別名を特定できませんでした）";
  return keys.map((k) => `「${k}」`).join("、");
}

/**
 * 公開済みコードと新しいコードの保存先の違いを指摘する。
 * ユーザーのデータが消える可能性がある変化だけを返す。
 */
export function compareStorageUsage(
  previous: string,
  next: string
): StorageChangeFinding[] {
  const prev = extractStorageUsage(previous);
  const curr = extractStorageUsage(next);
  const findings: StorageChangeFinding[] = [];

  // 保存機能そのものが消えた
  if ((prev.usesZisup || prev.usesLocalStorage) && !curr.usesZisup && !curr.usesLocalStorage) {
    findings.push({
      title: "データの保存処理がなくなっています",
      detail:
        "以前のコードには保存・読込がありましたが、新しいコードには見つかりません。既存の保存データは読み込まれなくなります。",
      severity: "warn",
    });
    return findings;
  }

  // Zisup → localStorage（またはその逆）
  if (prev.usesZisup && !curr.usesZisup && curr.usesLocalStorage) {
    findings.push({
      title: "保存先が Zisup API から localStorage に変わっています",
      detail:
        "ジサップのクラウド／同期保存から、ブラウザの localStorage に切り替わっています。以前保存したデータは読めなくなります。",
      severity: "warn",
    });
  }
  if (prev.usesLocalStorage && !curr.usesLocalStorage && curr.usesZisup) {
    findings.push({
      title: "保存先が localStorage から Zisup API に変わっています",
      detail:
        "ブラウザ保存からジサップの保存 API に切り替わっています。以前 localStorage に入っていたデータは自動では引き継がれません。",
      severity: "warn",
    });
  }

  // Zisup キーの削除・リネーム
  if (prev.usesZisup && curr.usesZisup) {
    const prevSet = new Set(prev.zisupKeys);
    const currSet = new Set(curr.zisupKeys);
    const removed = prev.zisupKeys.filter((k) => !currSet.has(k));
    const added = curr.zisupKeys.filter((k) => !prevSet.has(k));

    if (removed.length > 0 && added.length > 0) {
      findings.push({
        title: "データの識別名（キー）が変わっています",
        detail: `以前: ${formatKeys(removed)} → 今回: ${formatKeys(added)}。識別名が変わると、以前保存したデータは新しいコードから見えません。`,
        severity: "warn",
      });
    } else if (removed.length > 0) {
      findings.push({
        title: "使われなくなったデータの識別名があります",
        detail: `以前使っていた ${formatKeys(removed)} が新しいコードにありません。そのキーで保存されていたデータは読み込まれなくなります。`,
        severity: "warn",
      });
    } else if (added.length > 0 && prev.zisupKeys.length > 0) {
      findings.push({
        title: "新しいデータの識別名が追加されています",
        detail: `追加: ${formatKeys(added)}。既存データはそのまま使えますが、意図どおりか確認してください。`,
        severity: "info",
      });
    }
  }

  // localStorage キーの削除・リネーム（Zisupを使っていないアプリ向け）
  if (prev.usesLocalStorage && curr.usesLocalStorage && !curr.usesZisup) {
    const prevSet = new Set(prev.localStorageKeys);
    const currSet = new Set(curr.localStorageKeys);
    const removed = prev.localStorageKeys.filter((k) => !currSet.has(k));
    const added = curr.localStorageKeys.filter((k) => !prevSet.has(k));

    if (removed.length > 0 && added.length > 0) {
      findings.push({
        title: "localStorage のキー名が変わっています",
        detail: `以前: ${formatKeys(removed)} → 今回: ${formatKeys(added)}。キー名が変わると以前のデータは見えません。`,
        severity: "warn",
      });
    } else if (removed.length > 0) {
      findings.push({
        title: "使われなくなった localStorage キーがあります",
        detail: `以前使っていた ${formatKeys(removed)} が新しいコードにありません。`,
        severity: "warn",
      });
    }
  }

  return findings;
}

export function hasStorageWarnings(findings: StorageChangeFinding[]): boolean {
  return findings.some((f) => f.severity === "warn");
}
