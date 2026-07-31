"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Key, Plus, Trash2, X } from "lucide-react";
import type { AttachType, SecretMeta } from "@/lib/secrets/constants";

type Props = {
  open: boolean;
  onClose: () => void;
  appId?: string | null;
  appTitle?: string;
};

export function SecretsSettingsModal({ open, onClose, appId, appTitle }: Props) {
  const [tab, setTab] = useState<"ai" | "app">("ai");
  const [aiConfigured, setAiConfigured] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiSaving, setAiSaving] = useState(false);
  const [aiError, setAiError] = useState("");

  const [appSecrets, setAppSecrets] = useState<SecretMeta[]>([]);
  const [appLoading, setAppLoading] = useState(false);
  const [appError, setAppError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newValue, setNewValue] = useState("");
  const [attachType, setAttachType] = useState<AttachType>("header");
  const [paramName, setParamName] = useState("appid");
  const [savingAppSecret, setSavingAppSecret] = useState(false);

  const loadAiStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/secrets/user");
      if (!res.ok) return;
      const data = await res.json();
      setAiConfigured(!!data.ai?.configured);
    } catch {
      /* noop */
    }
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
    if (!open) return;
    loadAiStatus();
    if (appId) loadAppSecrets();
    else setTab("ai");
  }, [open, appId, loadAiStatus, loadAppSecrets]);

  const saveAiKey = async () => {
    setAiSaving(true);
    setAiError("");
    try {
      const res = await fetch("/api/secrets/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: aiInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "保存に失敗しました");
      setAiConfigured(true);
      setAiInput("");
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setAiSaving(false);
    }
  };

  const deleteAiKey = async () => {
    setAiSaving(true);
    setAiError("");
    try {
      const res = await fetch("/api/secrets/user", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "削除に失敗しました");
      }
      setAiConfigured(false);
      setAiInput("");
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "削除に失敗しました");
    } finally {
      setAiSaving(false);
    }
  };

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
            <h2 className="text-base font-black text-gray-900">シークレット管理</h2>
            <p className="text-xs text-gray-500">APIキーをコードに書かず安全に保管</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-1 border-b border-gray-100 px-4 pt-2">
          <button
            type="button"
            onClick={() => setTab("ai")}
            className={`rounded-t-xl px-4 py-2 text-xs font-bold transition-colors ${
              tab === "ai" ? "bg-emerald-50 text-emerald-700" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            AIキー（開発用）
          </button>
          {appId && (
            <button
              type="button"
              onClick={() => setTab("app")}
              className={`rounded-t-xl px-4 py-2 text-xs font-bold transition-colors ${
                tab === "app" ? "bg-emerald-50 text-emerald-700" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              アプリ用シークレット
            </button>
          )}
        </div>

        <div className="overflow-y-auto p-6">
          {tab === "ai" && (
            <div className="space-y-4">
              <p className="text-xs leading-relaxed text-gray-500">
                開発スタジオのAIチャット用キーです。サーバーに暗号化して保存され、コードには含まれません。
                OpenAI（sk-...）または Groq（gsk_...）に対応しています。
              </p>
              {aiError && (
                <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-600">{aiError}</p>
              )}
              {aiConfigured && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 ring-1 ring-emerald-200">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span className="text-xs font-semibold text-emerald-700">AI APIキー登録済み</span>
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                  {aiConfigured ? "新しいキーで上書き" : "APIキー"}
                </label>
                <input
                  type="password"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="sk-... または gsk_..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 font-mono text-sm outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
                />
              </div>
              <div className="flex gap-2">
                {aiConfigured && (
                  <button
                    type="button"
                    onClick={deleteAiKey}
                    disabled={aiSaving}
                    className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                  >
                    削除
                  </button>
                )}
                <button
                  type="button"
                  onClick={saveAiKey}
                  disabled={aiSaving || !aiInput.trim()}
                  className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {aiSaving ? "保存中…" : "保存する"}
                </button>
              </div>
            </div>
          )}

          {tab === "app" && appId && (
            <div className="space-y-4">
              <p className="text-xs leading-relaxed text-gray-500">
                {appTitle ? `「${appTitle}」` : "このアプリ"} の公開版で使う外部APIキーです。
                コードでは <code className="rounded bg-gray-100 px-1">secret: &apos;名前&apos;</code> だけ指定します。
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
                      placeholder="WEATHER"
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
                      <option value="query">URLパラメータ（?appid= 等）</option>
                    </select>
                  </div>
                  {attachType === "query" && (
                    <div>
                      <label className="mb-1 block text-xs font-bold text-gray-700">パラメータ名</label>
                      <input
                        type="text"
                        value={paramName}
                        onChange={(e) => setParamName(e.target.value)}
                        placeholder="appid"
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
