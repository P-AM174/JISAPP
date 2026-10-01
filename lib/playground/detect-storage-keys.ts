import { pick, type Locale, format } from "@/lib/i18n/config";

export type StorageUsage = {
  /** window.Jisapp.saveData / loadData（旧名 window.Zisup）で使っている名前 */
  zisupKeys: string[];
  /** localStorage.getItem / setItem / removeItem で使っているキー */
  localStorageKeys: string[];
  usesZisup: boolean;
  usesLocalStorage: boolean;
  /** window.Jisapp.shared.*（グループ共有）で使っている名前 */
  sharedKeys: string[];
  usesShared: boolean;
};

export type StorageChangeKind =
  | "save_removed"
  | "mode_zisup_to_local"
  | "mode_local_to_zisup"
  | "key_renamed"
  | "key_removed"
  | "key_added"
  | "shared_removed"
  | "shared_key_changed";

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
      sharedKeys: [],
      usesShared: false,
    };
  }

  const zisupKeys = new Set<string>();
  const localStorageKeys = new Set<string>();

  // Zisup.saveData('key' | "key" | `key`) / loadData(...)
  const zisupRe = new RegExp(
    String.raw`(?:window\.)?(?:Jisapp|Zisup)\.(?:saveData|loadData)\s*\(\s*${STRING_LIT}`,
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

  // Zisup.shared.add('key') など（グループ共有）
  const sharedKeys = new Set<string>();
  const sharedRe = new RegExp(
    String.raw`(?:window\.)?(?:Jisapp|Zisup)\.shared\.(?:save|load|add|list|remove|onChange)\s*\(\s*${STRING_LIT}`,
    "gi"
  );
  while ((m = sharedRe.exec(source)) !== null) {
    if (m[1]) sharedKeys.add(m[1]);
  }

  // 名前が変数の場合も「使っている」ことだけ検知する
  const usesZisup =
    zisupKeys.size > 0 ||
    /(?:window\.)?(?:Jisapp|Zisup)\.(?:saveData|loadData)\s*\(/i.test(source);
  const usesLocalStorage =
    localStorageKeys.size > 0 ||
    /localStorage\.(?:getItem|setItem|removeItem)\s*\(/i.test(source);

  return {
    zisupKeys: [...zisupKeys].sort(),
    localStorageKeys: [...localStorageKeys].sort(),
    usesZisup,
    usesLocalStorage,
    sharedKeys: [...sharedKeys].sort(),
    usesShared: sharedKeys.size > 0 || /(?:Jisapp|Zisup)\.shared\./.test(source),
  };
}

function formatKeys(keys: string[], locale: Locale = "ja"): string {
  if (locale !== "ja") {
    if (keys.length === 0) return "(couldn't read the name)";
    return keys.map((k) => `“${k}”`).join(", ");
  }
  if (keys.length === 0) return "（名前を読み取れませんでした）";
  return keys.map((k) => `「${k}」`).join("、");
}

/**
 * 公開済みコードと新しいコードで、保存データの読み書き方法が変わっていないか調べる。
 * 開発未経験の人が読んで意味が分かる言葉で返す。
 */
export function compareStorageUsage(
  previous: string,
  next: string,
  locale: Locale = "ja"
): StorageChangeFinding[] {
  const tx = (ja: string, en: string) => pick(locale, ja, en);
  const fk = (keys: string[]) => formatKeys(keys, locale);
  const prev = extractStorageUsage(previous);
  const curr = extractStorageUsage(next);
  const findings: StorageChangeFinding[] = [];

  // グループで共有しているデータ（メンバー全員に影響するので先に確かめる）
  if (prev.usesShared && !curr.usesShared) {
    findings.push({
      kind: "shared_removed",
      title: tx("グループで共有する部分がなくなっています", "The part that shares data with the group is gone"),
      detail:
        tx("新しいコードには、グループのメンバーでデータを共有する処理が見つかりません。このまま公開すると、メンバーがこれまで書き込んだ内容はアプリに表示されなくなります。", "The new code no longer shares data among group members. If you publish it as is, what members have written so far will no longer appear in the app."),
      severity: "warn",
      removedKeys: prev.sharedKeys,
    });
  } else if (prev.sharedKeys.length > 0) {
    const currShared = new Set(curr.sharedKeys);
    const removedShared = prev.sharedKeys.filter((k) => !currShared.has(k));
    if (removedShared.length > 0) {
      const addedShared = curr.sharedKeys.filter((k) => !prev.sharedKeys.includes(k));
      findings.push({
        kind: "shared_key_changed",
        title: tx("グループで共有しているデータの名前が変わっています", "The name of the data shared with the group has changed"),
        detail: tx(
          `前は${fk(removedShared)}という名前でメンバーのデータを共有していましたが、新しいコードではその名前が使われていません${
            addedShared.length ? `（新しい名前: ${fk(addedShared)}）` : ""
          }。このまま公開すると、メンバー全員がこれまで書き込んだ内容が、アプリに表示されなくなります。`,
          `Members' data used to be shared under the name ${fk(removedShared)}, but the new code doesn't use that name${
            addedShared.length ? ` (new name: ${fk(addedShared)})` : ""
          }. If you publish it as is, everything members have written so far will no longer appear in the app.`
        ),
        severity: "warn",
        removedKeys: removedShared,
        addedKeys: addedShared,
      });
    }
  }

  // 保存機能そのものが消えた
  if ((prev.usesZisup || prev.usesLocalStorage) && !curr.usesZisup && !curr.usesLocalStorage) {
    findings.push({
      kind: "save_removed",
      title: tx("データを保存する部分がなくなっています", "The part that saves data is gone"),
      detail:
        tx("新しいコードには、データを保存したり読み込んだりする処理が見つかりません。このまま公開すると、利用者がこれまで入力した内容は、アプリを開いても表示されなくなります。", "The new code doesn't save or load data anymore. If you publish it as is, what people have entered so far won't show up when they open the app."),
      severity: "warn",
      removedKeys: prev.zisupKeys.length ? prev.zisupKeys : prev.localStorageKeys,
    });
    return findings;
  }

  // ジサップの保存 → その端末の中だけ（またはその逆）
  if (prev.usesZisup && !curr.usesZisup && curr.usesLocalStorage) {
    findings.push({
      kind: "mode_zisup_to_local",
      title: tx("データの保存場所が「ジサップ」から「その端末の中だけ」に変わっています", "Data is now saved “only on the device” instead of “on Jisapp”"),
      detail:
        tx("これまではジサップ側にデータを保存していましたが、新しいコードはスマホやパソコンの中だけに保存しようとしています。これまでのデータは表示されなくなり、別の端末で開いたときにも引き継がれなくなります。", "Data used to be saved on Jisapp, but the new code tries to save it only on the phone or computer. Existing data will stop showing up, and it won't carry over to other devices."),
      severity: "warn",
      removedKeys: prev.zisupKeys,
      addedKeys: curr.localStorageKeys,
    });
  }
  if (prev.usesLocalStorage && !curr.usesLocalStorage && curr.usesZisup) {
    findings.push({
      kind: "mode_local_to_zisup",
      title: tx("データの保存場所が「端末の中」から「ジサップ」に変わっています", "Data is now saved “on Jisapp” instead of “on the device”"),
      detail:
        tx("保存の仕組みとしては良い変更ですが、これまで端末の中にあったデータは自動では移りません。利用者は、中身が空の状態からのスタートになります。", "This is a good change for saving, but data already on people's devices won't move over automatically. They'll start from empty."),
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
        title: tx("データにつけた名前が変わっています", "The names given to saved data have changed"),
        detail: format(tx("アプリは、データに名前をつけて保存しています。前は{removed}でしたが、今回は{added}になっています。名前が変わると、前のデータは残っていてもアプリが見つけられないため、利用者の画面では入力した内容がすべて消えた状態で表示されます。", "The app saves data under names. They used to be {removed}, but now they're {added}. When the names change, the app can't find the old data even though it still exists, so people will see everything they entered as gone."), { removed: fk(removed), added: fk(added) }),
        severity: "warn",
        removedKeys: removed,
        addedKeys: added,
      });
    } else if (removed.length > 0) {
      findings.push({
        kind: "key_removed",
        title: tx("前まで使っていたデータの名前が、新しいコードにありません", "A data name used before is missing from the new code"),
        detail: format(tx("前は{removed}という名前でデータを保存していましたが、新しいコードではその名前が使われていません。その名前で保存されていた内容は、アプリを開いても表示されなくなります。", "Data used to be saved under {removed}, but the new code doesn't use that name. Anything saved under it won't show up when the app is opened."), { removed: fk(removed) }),
        severity: "warn",
        removedKeys: removed,
      });
    } else if (added.length > 0 && prev.zisupKeys.length > 0) {
      findings.push({
        kind: "key_added",
        title: tx("新しく保存する項目が増えています", "There are new things being saved"),
        detail: format(tx("{added} が増えました。これまでのデータはそのまま使えます。意図した追加であれば、そのまま公開して問題ありません。", "{added} was added. Existing data still works. If you meant to add it, it's fine to publish as is."), { added: fk(added) }),
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
        title: tx("データにつけた名前が変わっています", "The names given to saved data have changed"),
        detail: format(tx("前は{removed}でしたが、今回は{added}になっています。名前が変わると、前のデータはアプリから見つけられなくなります。", "They used to be {removed}, but now they're {added}. When the names change, the app can no longer find the old data."), { removed: fk(removed), added: fk(added) }),
        severity: "warn",
        removedKeys: removed,
        addedKeys: added,
      });
    } else if (removed.length > 0) {
      findings.push({
        kind: "key_removed",
        title: tx("前まで使っていたデータの名前が、新しいコードにありません", "A data name used before is missing from the new code"),
        detail: format(tx("前は{removed}という名前で保存していましたが、新しいコードではその名前が使われていません。", "Data used to be saved under {removed}, but the new code doesn't use that name."), { removed: fk(removed) }),
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
export function buildStorageFixPrompt(findings: StorageChangeFinding[], locale: Locale = "ja"): string {
  if (locale !== "ja") return buildStorageFixPromptEn(findings);
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
      "新しいコードは localStorage に保存しようとしていますが、今までのデータはジサップの保存機能（window.Jisapp）に入っています。このままでは今までのデータが読み込めません。"
    );
  } else {
    lines.push(
      "新しいコードは、データを保存するときの名前が前のバージョンと違っています。このままでは今までのデータが読み込めません。"
    );
  }
  lines.push("");

  lines.push("【必ず守るルール】");
  lines.push(
    "1. データの保存と読み込みは window.Jisapp.saveData / window.Jisapp.loadData だけを使う（localStorage は使わない）"
  );
  lines.push("   ・保存: await window.Jisapp.saveData('名前', データ)");
  lines.push("   ・読込: await window.Jisapp.loadData('名前')");

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

/** buildStorageFixPrompt の英語版 */
function buildStorageFixPromptEn(findings: StorageChangeFinding[]): string {
  const oldKeys = uniq(findings.flatMap((f) => f.removedKeys ?? []));
  const newKeys = uniq(findings.flatMap((f) => f.addedKeys ?? []));
  const switchedToLocal = findings.some((f) => f.kind === "mode_zisup_to_local");
  const saveRemoved = findings.some((f) => f.kind === "save_removed");
  const quoted = (keys: string[]) => keys.map((k) => `'${k}'`).join(" / ");

  const lines: string[] = [];
  lines.push("Please fix only the data-saving part of the app code you just wrote.");
  lines.push("");
  lines.push("[What's wrong]");
  lines.push("This app is already published, and people have saved data in it.");
  if (saveRemoved) {
    lines.push("The new code no longer saves or loads data, so the existing data won't show up.");
  } else if (switchedToLocal) {
    lines.push(
      "The new code tries to save to localStorage, but the existing data is in Jisapp's save feature (window.Jisapp). As is, the existing data can't be loaded."
    );
  } else {
    lines.push(
      "The new code uses different names for saved data than the previous version. As is, the existing data can't be loaded."
    );
  }
  lines.push("");
  lines.push("[Rules to follow]");
  lines.push("1. Save and load data ONLY with window.Jisapp.saveData / window.Jisapp.loadData (not localStorage)");
  lines.push("   - Save: await window.Jisapp.saveData('name', data)");
  lines.push("   - Load: await window.Jisapp.loadData('name')");
  if (oldKeys.length > 0) {
    lines.push(`2. Change the names used for saving back to the previous version's ${quoted(oldKeys)}`);
    if (newKeys.length > 0) {
      lines.push(`   - Don't use ${quoted(newKeys)} from the current code`);
    }
    lines.push(
      "3. If you want to add fields to the data, keep the names, load the old data, and fill in missing fields with default values"
    );
  } else {
    lines.push("2. Don't change the names used for saving from the previous version");
    lines.push("3. If you want to change the data's shape, load the old data, convert it to the new shape, and save it again");
  }
  lines.push("4. Don't change the look or features — fix only the saving part");
  lines.push("5. Output the fixed index.html as one whole file without skipping anything (no “changed parts only”)");

  if (oldKeys.length > 0) {
    lines.push("");
    lines.push(
      `* If you really want new names, then instead of switching back, you must add a migration that loads data from the old names ${quoted(oldKeys)} at startup, converts it to the new format, and saves it again.`
    );
  }
  if (oldKeys.length > 0 || newKeys.length > 0) {
    lines.push("");
    lines.push("[For reference: differences Jisapp found]");
    if (oldKeys.length > 0) lines.push(`- Names used in the previous version: ${oldKeys.join(", ")}`);
    if (newKeys.length > 0) lines.push(`- Names used in the current code: ${newKeys.join(", ")}`);
  }
  return lines.join("\n");
}
