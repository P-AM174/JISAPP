export type StorageUsage = {
  /** window.Zisup.saveData / loadData で使っている名前 */
  zisupKeys: string[];
  /** localStorage.getItem / setItem / removeItem で使っているキー */
  localStorageKeys: string[];
  usesZisup: boolean;
  usesLocalStorage: boolean;
};

export type StorageChangeKind =
  | "save_removed"
  | "mode_zisup_to_local"
  | "mode_local_to_zisup"
  | "key_renamed"
  | "key_removed"
  | "key_added";

export type StorageChangeFinding = {
  kind: StorageChangeKind;
  title: string;
  detail: string;
  severity: "warn" | "info";
  removedKeys?: string[];
  addedKeys?: string[];
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

  // 名前が変数の場合も「使っている」ことだけ検知する
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
  if (keys.length === 0) return "（名前を読み取れませんでした）";
  return keys.map((k) => `「${k}」`).join("、");
}

/**
 * 公開済みコードと新しいコードで、保存データの読み書き方法が変わっていないか調べる。
 * 開発未経験の人が読んで意味が分かる言葉で返す。
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
      kind: "save_removed",
      title: "データを保存する部分がなくなっています",
      detail:
        "新しいコードには、データを保存したり読み込んだりする処理が見つかりません。このまま公開すると、利用者がこれまで入力した内容は、アプリを開いても表示されなくなります。",
      severity: "warn",
      removedKeys: prev.zisupKeys.length ? prev.zisupKeys : prev.localStorageKeys,
    });
    return findings;
  }

  // ジサップの保存 → その端末の中だけ（またはその逆）
  if (prev.usesZisup && !curr.usesZisup && curr.usesLocalStorage) {
    findings.push({
      kind: "mode_zisup_to_local",
      title: "データの保存場所が「ジサップ」から「その端末の中だけ」に変わっています",
      detail:
        "これまではジサップ側にデータを保存していましたが、新しいコードはスマホやパソコンの中だけに保存しようとしています。これまでのデータは表示されなくなり、別の端末で開いたときにも引き継がれなくなります。",
      severity: "warn",
      removedKeys: prev.zisupKeys,
      addedKeys: curr.localStorageKeys,
    });
  }
  if (prev.usesLocalStorage && !curr.usesLocalStorage && curr.usesZisup) {
    findings.push({
      kind: "mode_local_to_zisup",
      title: "データの保存場所が「端末の中」から「ジサップ」に変わっています",
      detail:
        "保存の仕組みとしては良い変更ですが、これまで端末の中にあったデータは自動では移りません。利用者は、中身が空の状態からのスタートになります。",
      severity: "warn",
      removedKeys: prev.localStorageKeys,
      addedKeys: curr.zisupKeys,
    });
  }

  // 名前（キー）の変更・削除
  if (prev.usesZisup && curr.usesZisup) {
    const prevSet = new Set(prev.zisupKeys);
    const currSet = new Set(curr.zisupKeys);
    const removed = prev.zisupKeys.filter((k) => !currSet.has(k));
    const added = curr.zisupKeys.filter((k) => !prevSet.has(k));

    if (removed.length > 0 && added.length > 0) {
      findings.push({
        kind: "key_renamed",
        title: "データにつけた名前が変わっています",
        detail: `アプリは、データに名前をつけて保存しています。前は${formatKeys(removed)}でしたが、今回は${formatKeys(added)}になっています。名前が変わると、前のデータは残っていてもアプリが見つけられないため、利用者の画面では入力した内容がすべて消えた状態で表示されます。`,
        severity: "warn",
        removedKeys: removed,
        addedKeys: added,
      });
    } else if (removed.length > 0) {
      findings.push({
        kind: "key_removed",
        title: "前まで使っていたデータの名前が、新しいコードにありません",
        detail: `前は${formatKeys(removed)}という名前でデータを保存していましたが、新しいコードではその名前が使われていません。その名前で保存されていた内容は、アプリを開いても表示されなくなります。`,
        severity: "warn",
        removedKeys: removed,
      });
    } else if (added.length > 0 && prev.zisupKeys.length > 0) {
      findings.push({
        kind: "key_added",
        title: "新しく保存する項目が増えています",
        detail: `${formatKeys(added)} が増えました。これまでのデータはそのまま使えます。意図した追加であれば、そのまま公開して問題ありません。`,
        severity: "info",
        addedKeys: added,
      });
    }
  }

  // 端末保存だけで作られているアプリの名前変更
  if (prev.usesLocalStorage && curr.usesLocalStorage && !curr.usesZisup) {
    const prevSet = new Set(prev.localStorageKeys);
    const currSet = new Set(curr.localStorageKeys);
    const removed = prev.localStorageKeys.filter((k) => !currSet.has(k));
    const added = curr.localStorageKeys.filter((k) => !prevSet.has(k));

    if (removed.length > 0 && added.length > 0) {
      findings.push({
        kind: "key_renamed",
        title: "データにつけた名前が変わっています",
        detail: `前は${formatKeys(removed)}でしたが、今回は${formatKeys(added)}になっています。名前が変わると、前のデータはアプリから見つけられなくなります。`,
        severity: "warn",
        removedKeys: removed,
        addedKeys: added,
      });
    } else if (removed.length > 0) {
      findings.push({
        kind: "key_removed",
        title: "前まで使っていたデータの名前が、新しいコードにありません",
        detail: `前は${formatKeys(removed)}という名前で保存していましたが、新しいコードではその名前が使われていません。`,
        severity: "warn",
        removedKeys: removed,
      });
    }
  }

  return findings;
}

export function hasStorageWarnings(findings: StorageChangeFinding[]): boolean {
  return findings.some((f) => f.severity === "warn");
}

function uniq(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

/**
 * 「AIに貼り付けて直してもらう」ための指示文を作る。
 * 検知した内容（前の名前・今の名前）を埋め込むので、そのままコピーして送れる。
 */
export function buildStorageFixPrompt(findings: StorageChangeFinding[]): string {
  const oldKeys = uniq(findings.flatMap((f) => f.removedKeys ?? []));
  const newKeys = uniq(findings.flatMap((f) => f.addedKeys ?? []));
  const switchedToLocal = findings.some((f) => f.kind === "mode_zisup_to_local");
  const saveRemoved = findings.some((f) => f.kind === "save_removed");

  const lines: string[] = [];

  lines.push(
    "今あなたが作ってくれたアプリのコードを、保存機能だけ修正してください。"
  );
  lines.push("");
  lines.push("【何が問題か】");
  lines.push(
    "このアプリはすでに公開していて、利用者が保存したデータがあります。"
  );
  if (saveRemoved) {
    lines.push(
      "新しいコードにはデータを保存・読み込みする処理がなくなっているため、今までのデータが表示されなくなります。"
    );
  } else if (switchedToLocal) {
    lines.push(
      "新しいコードは localStorage に保存しようとしていますが、今までのデータはジサップの保存機能（window.Zisup）に入っています。このままでは今までのデータが読み込めません。"
    );
  } else {
    lines.push(
      "新しいコードは、データを保存するときの名前が前のバージョンと違っています。このままでは今までのデータが読み込めません。"
    );
  }
  lines.push("");

  lines.push("【必ず守るルール】");
  lines.push(
    "1. データの保存と読み込みは window.Zisup.saveData / window.Zisup.loadData だけを使う（localStorage は使わない）"
  );
  lines.push("   ・保存: await window.Zisup.saveData('名前', データ)");
  lines.push("   ・読込: await window.Zisup.loadData('名前')");

  if (oldKeys.length > 0) {
    lines.push(
      `2. 保存に使う名前は、前のバージョンと同じ ${oldKeys.map((k) => `'${k}'`).join(" / ")} に戻す`
    );
    if (newKeys.length > 0) {
      lines.push(
        `   ・今のコードの ${newKeys.map((k) => `'${k}'`).join(" / ")} は使わないでください`
      );
    }
    lines.push(
      "3. データの形（項目）を増やしたい場合は、名前は変えずに、古いデータを読み込んでから足りない項目を初期値で補ってください"
    );
  } else {
    lines.push(
      "2. 保存に使う名前は、前のバージョンで使っていたものから変えないでください"
    );
    lines.push(
      "3. データの形を変えたい場合は、古いデータを読み込んでから新しい形に変換して保存し直してください"
    );
  }
  lines.push("4. 見た目や機能は変えず、保存に関わる部分だけ直してください");
  lines.push(
    "5. 修正後の index.html を、省略せずに1ファイルまるごと出力してください（「変更部分のみ」は不可）"
  );

  if (oldKeys.length > 0) {
    lines.push("");
    lines.push(
      `※どうしても新しい名前で作りたい場合は、名前を戻す代わりに、起動時に古い名前 ${oldKeys
        .map((k) => `'${k}'`)
        .join(" / ")} からデータを読み込み、新しい形式に変換して保存し直す引き継ぎ処理を必ず入れてください。`
    );
  }

  if (oldKeys.length > 0 || newKeys.length > 0) {
    lines.push("");
    lines.push("【参考：ジサップが検出した違い】");
    if (oldKeys.length > 0) {
      lines.push(`・前のバージョンで使っていた名前: ${oldKeys.join("、")}`);
    }
    if (newKeys.length > 0) {
      lines.push(`・今のコードで使っている名前: ${newKeys.join("、")}`);
    }
  }

  return lines.join("\n");
}
