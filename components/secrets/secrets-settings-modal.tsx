"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { Key, Pencil, Plus, Trash2, X } from "lucide-react";
import type { AttachType, SecretMeta } from "@/lib/secrets/constants";

type Props = {
  open: boolean;
  onClose: () => void;
  appId?: string | null;
  appTitle?: string;
  /** studio = 開発スタジオ（APIキー）、app = マイプロジェクト */
  mode?: "studio" | "app";
};

type FormMode = "add" | "edit";

/** OS・ブラウザのパスワード自動入力を避ける（type=password は使わない） */
const secretValueInputClass =
  "w-full rounded-xl border border-gray-200 px-3 py-2 font-mono text-sm outline-none focus:border-emerald-400 [-webkit-text-security:disc]";

function formatUpdatedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString("ja-JP", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function attachLabel(s: SecretMeta): string {
  return s.attach_type === "query"
    ? `URLパラメータ: ${s.param_name ?? "api_key"}`
    : `ヘッダー: ${s.header_name}`;
}

export function SecretsSettingsModal({
  open,
  onClose,
  appId,
  appTitle,
  mode = "app",
}: Props) {
  const formId = useId();
  const [appSecrets, setAppSecrets] = useState<SecretMeta[]>([]);
  const [appLoading, setAppLoading] = useState(false);
  const [appError, setAppError] = useState("");
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formValue, setFormValue] = useState("");
  /** 編集時: false なら既存キーを維持（入力欄を出さない） */
  const [replaceValue, setReplaceValue] = useState(false);
  const [attachType, setAttachType] = useState<AttachType>("header");
  const [paramName, setParamName] = useState("");
  const [savingAppSecret, setSavingAppSecret] = useState(false);

  const resetForm = useCallback(() => {
    setFormMode(null);
    setEditingName(null);
    setFormName("");
    setFormValue("");
    setReplaceValue(false);
    setAttachType("header");
    setParamName("");
  }, []);

  const loadAppSecrets = useCallback(async () => {
    if (!appId) return;
    setAppLoading(true);
    setAppError("");
    try {
      const res = await fetch(`/api/secrets/app?appId=${encodeURIComponent(appId)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "読み込みに失敗しました");
      setAppSecrets(data.secrets ?? []);
    } catch (e) {
      setAppError(e instanceof Error ? e.message : "読み込みに失敗しました");
    } finally {
      setAppLoading(false);
    }
  }, [appId]);

  useEffect(() => {
    if (!open) {
      resetForm();
      return;
    }
    if (appId) loadAppSecrets();
    else {
      setAppSecrets([]);
      resetForm();
    }
  }, [open, appId, loadAppSecrets, resetForm]);

  const openAddForm = () => {
    resetForm();
    setFormMode("add");
  };

  const openEditForm = (secret: SecretMeta) => {
    setFormMode("edit");
    setEditingName(secret.name);
    setFormName(secret.name);
    setFormValue("");
    setReplaceValue(false);
    setAttachType(secret.attach_type);
    setParamName(secret.param_name ?? "");
    setAppError("");
  };

  const saveAppSecret = async () => {
    if (!appId || !formMode) return;

    const isEdit = formMode === "edit";
    const nextValue = formValue.trim();
    if (!isEdit && !nextValue) {
      setAppError("APIキーの値を入力してください");
      return;
    }
    if (isEdit && replaceValue && !nextValue) {
      setAppError("新しいAPIキーを入力するか、「キーを差し替えない」に戻してください");
      return;
    }

    setSavingAppSecret(true);
    setAppError("");
    try {
      const keepExistingValue = isEdit && !replaceValue;
      const payload = {
        appId,
        name: formName.trim(),
        attach_type: attachType,
        param_name: attachType === "query" ? paramName.trim() : null,
        ...(keepExistingValue ? {} : { value: nextValue }),
      };

      const res = await fetch("/api/secrets/app", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "保存に失敗しました");
      resetForm();
      await loadAppSecrets();
    } catch (e) {
      setAppError(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setSavingAppSecret(false);
    }
  };

  const deleteAppSecret = async (name: string) => {
    if (!appId) return;
    if (!window.confirm(`「${name}」を削除しますか？`)) return;
    setAppError("");
    try {
      const res = await fetch(
        `/api/secrets/app?appId=${encodeURIComponent(appId)}&name=${encodeURIComponent(name)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "削除に失敗しました");
      if (editingName === name) resetForm();
      await loadAppSecrets();
    } catch (e) {
      setAppError(e instanceof Error ? e.message : "削除に失敗しました");
    }
  };

  if (!open) return null;

  const showForm = formMode !== null;

  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100">
            <Key className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-black text-gray-900">
              {mode === "studio" ? "APIキー" : "シークレット管理"}
            </h2>
            <p className="text-xs text-gray-500">
              {mode === "studio"
                ? "キーをコードに書かず、ここに貼り付けて保管"
                : "APIキーをコードに書かず安全に保管"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          {!appId ? (
            <div className="space-y-3">
              <p className="text-sm leading-relaxed text-gray-600">読み込み中…</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs leading-relaxed text-gray-500">
                {mode === "studio"
                  ? "外部API・AI（OpenAI、天気API、地図APIなど）のキーを登録します。コードに書く secret 名と、ここで登録する名前を同じ大文字にしてください。"
                  : `${appTitle ? `「${appTitle}」` : "このアプリ"} の公開版で使う外部APIキーです。コードでは secret: '名前' だけ指定します。`}
              </p>
              <div className="rounded-xl border border-violet-100 bg-violet-50/70 px-3 py-2.5 text-[11px] leading-relaxed text-violet-900">
                例:{" "}
                <code>await Zisup.fetch(url, {"{ secret: 'WEATHER' }"})</code>
              </div>
              {appError && (
                <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-600">{appError}</p>
              )}
              {appLoading ? (
                <p className="text-xs text-gray-400">読み込み中…</p>
              ) : appSecrets.length > 0 ? (
                <ul className="space-y-2">
                  {appSecrets.map((s) => (
                    <li
                      key={s.name}
                      className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-sm font-bold text-gray-800">{s.name}</p>
                        <p className="text-[10px] text-gray-400">{attachLabel(s)}</p>
                        <p className="mt-0.5 text-[10px] text-emerald-600">
                          ●●●● 登録済み
                          {s.updated_at ? ` · 更新 ${formatUpdatedAt(s.updated_at)}` : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openEditForm(s)}
                        title="編集"
                        className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteAppSecret(s.name)}
                        title="削除"
                        className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-400">登録されたシークレットはありません</p>
              )}

              {showForm ? (
                <form
                  id={formId}
                  autoComplete="off"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void saveAppSecret();
                  }}
                  className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4"
                >
                  <p className="text-xs font-bold text-emerald-800">
                    {formMode === "edit" ? `「${editingName}」を編集` : "新しいシークレット"}
                  </p>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-gray-700">名前（大文字）</label>
                    <input
                      type="text"
                      name={`${formId}-secret-name`}
                      value={formName}
                      onChange={(e) => setFormName(e.target.value.toUpperCase())}
                      placeholder="例: WEATHER, OPENAI, MAPS"
                      maxLength={32}
                      readOnly={formMode === "edit"}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="characters"
                      spellCheck={false}
                      data-1p-ignore
                      data-lpignore="true"
                      data-form-type="other"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 font-mono text-sm outline-none focus:border-emerald-400 read-only:bg-gray-100 read-only:text-gray-600"
                    />
                    {formMode === "edit" ? (
                      <p className="mt-1 text-[10px] text-gray-400">
                        名前はコードの secret 名と一致するため変更できません
                      </p>
                    ) : (
                      <p className="mt-1 text-[10px] text-gray-400">
                        コード内の secret 名と同じ名前にしてください
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-gray-700">APIキーの値</label>
                    {formMode === "edit" && !replaceValue ? (
                      <div className="space-y-2">
                        <div className="rounded-xl border border-emerald-200 bg-white px-3 py-2.5 text-sm text-emerald-800">
                          ●●●● 登録済みのキーをそのまま引き継ぎます
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setReplaceValue(true);
                            setFormValue("");
                          }}
                          className="text-[11px] font-semibold text-gray-500 underline decoration-dotted underline-offset-2 hover:text-emerald-700"
                        >
                          キーを差し替える
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="text"
                          name={`${formId}-secret-token`}
                          value={formValue}
                          onChange={(e) => setFormValue(e.target.value)}
                          placeholder="取得したAPIキーを貼り付け"
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="off"
                          spellCheck={false}
                          inputMode="text"
                          data-1p-ignore
                          data-lpignore="true"
                          data-form-type="other"
                          className={secretValueInputClass}
                        />
                        {formMode === "edit" && (
                          <button
                            type="button"
                            onClick={() => {
                              setReplaceValue(false);
                              setFormValue("");
                            }}
                            className="text-[11px] font-semibold text-gray-500 underline decoration-dotted underline-offset-2 hover:text-emerald-700"
                          >
                            差し替えをやめて、登録済みキーを引き継ぐ
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-gray-700">付け方</label>
                    <select
                      value={attachType}
                      onChange={(e) => setAttachType(e.target.value as AttachType)}
                      autoComplete="off"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
                    >
                      <option value="header">HTTPヘッダー（Authorization 等）</option>
                      <option value="query">URLパラメータ（?key= 等）</option>
                    </select>
                  </div>
                  {attachType === "query" && (
                    <div>
                      <label className="mb-1 block text-xs font-bold text-gray-700">パラメータ名</label>
                      <input
                        type="text"
                        name={`${formId}-secret-param`}
                        value={paramName}
                        onChange={(e) => setParamName(e.target.value)}
                        placeholder="例: key, appid, api_key"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                        data-1p-ignore
                        data-lpignore="true"
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex-1 rounded-xl border border-gray-200 py-2 text-sm font-semibold text-gray-600"
                    >
                      キャンセル
                    </button>
                    <button
                      type="submit"
                      disabled={
                        savingAppSecret ||
                        !formName.trim() ||
                        (formMode === "add" && !formValue.trim()) ||
                        (formMode === "edit" && replaceValue && !formValue.trim())
                      }
                      className="flex-1 rounded-xl bg-emerald-600 py-2 text-sm font-bold text-white disabled:opacity-50"
                    >
                      {savingAppSecret
                        ? "保存中…"
                        : formMode === "edit"
                          ? "更新する"
                          : "追加する"}
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={openAddForm}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-emerald-300 py-3 text-sm font-bold text-emerald-700 hover:bg-emerald-50"
                >
                  <Plus className="h-4 w-4" />
                  シークレットを追加
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
