"use client";

import { useCallback, useEffect, useState } from "react";
import { Key, Plus, Trash2, X } from "lucide-react";
import type { AttachType, SecretMeta } from "@/lib/secrets/constants";

type Props = {
  open: boolean;
  onClose: () => void;
  appId?: string | null;
  appTitle?: string;
  /** studio = 開発スタジオ（APIキー）、app = マイプロジェクト */
  mode?: "studio" | "app";
};

export function SecretsSettingsModal({
  open,
  onClose,
  appId,
  appTitle,
  mode = "app",
}: Props) {
  const [appSecrets, setAppSecrets] = useState<SecretMeta[]>([]);
  const [appLoading, setAppLoading] = useState(false);
  const [appError, setAppError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newValue, setNewValue] = useState("");
  const [attachType, setAttachType] = useState<AttachType>("header");
  const [paramName, setParamName] = useState("appid");
  const [savingAppSecret, setSavingAppSecret] = useState(false);

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
    if (!open) return;
    if (appId) loadAppSecrets();
    else {
      setAppSecrets([]);
      setShowAddForm(false);
    }
  }, [open, appId, loadAppSecrets]);

  const saveAppSecret = async () => {
    if (!appId) return;
    setSavingAppSecret(true);
    setAppError("");
    try {
      const res = await fetch("/api/secrets/app", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appId,
          name: newName.trim(),
          value: newValue.trim(),
          attach_type: attachType,
          param_name: attachType === "query" ? paramName.trim() : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "保存に失敗しました");
      setShowAddForm(false);
      setNewName("");
      setNewValue("");
      setAttachType("header");
      setParamName("appid");
      await loadAppSecrets();
    } catch (e) {
      setAppError(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setSavingAppSecret(false);
    }
  };

  const deleteAppSecret = async (name: string) => {
    if (!appId) return;
    setAppError("");
    try {
      const res = await fetch(
        `/api/secrets/app?appId=${encodeURIComponent(appId)}&name=${encodeURIComponent(name)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "削除に失敗しました");
      await loadAppSecrets();
    } catch (e) {
      setAppError(e instanceof Error ? e.message : "削除に失敗しました");
    }
  };

  if (!open) return null;

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
                  ? "Gemini・OpenAI・天気APIなど、外部サービスのキーを登録します。コードには secret: 'GEMINI' のように名前だけ書いてください。"
                  : `${appTitle ? `「${appTitle}」` : "このアプリ"} の公開版で使う外部APIキーです。コードでは secret: '名前' だけ指定します。`}
              </p>
              <div className="rounded-xl border border-violet-100 bg-violet-50/70 px-3 py-2.5 text-[11px] leading-relaxed text-violet-900">
                例:{" "}
                <code>await Zisup.fetch(url, {"{ secret: 'GEMINI' }"})</code>
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
                      className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5"
                    >
                      <div>
                        <p className="font-mono text-sm font-bold text-gray-800">{s.name}</p>
                        <p className="text-[10px] text-gray-400">
                          {s.attach_type === "query"
                            ? `URLパラメータ: ${s.param_name ?? "api_key"}`
                            : `ヘッダー: ${s.header_name}`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteAppSecret(s.name)}
                        className="rounded-lg p-2 text-gray-400 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-400">登録されたシークレットはありません</p>
              )}

              {showAddForm ? (
                <div className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-gray-700">名前（大文字）</label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value.toUpperCase())}
                      placeholder="GEMINI"
                      maxLength={32}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 font-mono text-sm outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-gray-700">APIキーの値</label>
                    <input
                      type="password"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 font-mono text-sm outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-gray-700">付け方</label>
                    <select
                      value={attachType}
                      onChange={(e) => setAttachType(e.target.value as AttachType)}
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
                        value={paramName}
                        onChange={(e) => setParamName(e.target.value)}
                        placeholder="key"
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="flex-1 rounded-xl border border-gray-200 py-2 text-sm font-semibold text-gray-600"
                    >
                      キャンセル
                    </button>
                    <button
                      type="button"
                      onClick={saveAppSecret}
                      disabled={savingAppSecret || !newName.trim() || !newValue.trim()}
                      className="flex-1 rounded-xl bg-emerald-600 py-2 text-sm font-bold text-white disabled:opacity-50"
                    >
                      {savingAppSecret ? "保存中…" : "追加する"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
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
