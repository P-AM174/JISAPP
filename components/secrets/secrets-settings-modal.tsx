"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { CheckCircle2, Key, Pencil, Plug, Plus, Trash2, X } from "lucide-react";
import type { AttachType, SecretMeta } from "@/lib/secrets/constants";
import { useLocale, useT } from "@/lib/i18n/client";
import { intlLocale, type Locale, format, pick } from "@/lib/i18n/config";
import { checkApiSetup, findSecretNames } from "@/lib/secrets/detect-api-use";
import { ApiSetupIssues } from "@/components/secrets/api-setup-issues";

type Props = {
  open: boolean;
  onClose: () => void;
  appId?: string | null;
  appTitle?: string;
  /** studio = 開発スタジオ（APIキー）、app = マイプロジェクト */
  mode?: "studio" | "app";
  /** アプリのコード。渡すと、登録したキーとコードの secret 名を照らし合わせ、「つながるか試す」で送り先を探すのに使う */
  code?: string;
  /** 開いたときに、この名前で新しいキーの登録を始める（コードが使うのに未登録の名前） */
  initialAddName?: string | null;
};

/** 「つながるか試す」の結果（/api/secrets/app/test） */
type TestResult =
  | { state: "loading" }
  | { state: "ok" | "rejected" | "limit" | "unsure" | "server_error" | "no_target" | "unsupported" | "error"; status?: number; host?: string; message?: string };

function testResultText(r: TestResult, t: (ja: string, en: string) => string): string {
  switch (r.state) {
    case "loading":
      return t("試しています…", "Testing…");
    case "ok":
      return format(t("つながりました（{host}）", "Connected ({host})"), { host: r.host ?? "" });
    case "rejected":
      return format(t("キーが受け付けられませんでした（{status}）。キーの値か、付け方（URLパラメータ／HTTPヘッダー、パラメータ名）がちがう可能性があります。", "The key was rejected ({status}). The key value or how it's attached (URL parameter / HTTP header, parameter name) may be wrong."), { status: String(r.status ?? "") });
    case "limit":
      return format(t("キーは届きましたが、回数や料金の上限に達しています（{status}）。サービスの管理画面で、使える量や支払いの設定を確かめてください。", "The key reached the service, but you've hit a usage or billing limit ({status}). Check your usage and billing in the service's dashboard."), { status: String(r.status ?? "") });
    case "unsure":
      return format(t("キーは届きましたが、試しの送り方では確かめきれませんでした（{status}）。アプリのプレビューで動くか試してください。", "The key reached the service, but this quick test couldn't confirm it ({status}). Try the app in the preview."), { status: String(r.status ?? "") });
    case "server_error":
      return format(t("サービス側でエラーが起きています（{status}）。しばらくしてから試してください。", "The service returned an error ({status}). Try again later."), { status: String(r.status ?? "") });
    case "no_target":
      return t("このキーを使う送り先（https:// の URL）がコードに見つかりませんでした。コードに secret とあわせて URL が書かれているか確かめてください。", "Couldn't find where this key is sent (an https:// URL) in the code. Check that the code has the URL together with secret.");
    case "unsupported":
      return format(t("{host} は、ジサップのキーの付け方（URLパラメータか Authorization ヘッダー）では使えません。別のサービスを使ってください。", "{host} can't be used with Jisapp's ways of attaching keys (URL parameter or Authorization header). Please use another service."), { host: r.host ?? "" });
    default:
      return r.message || t("つながりませんでした", "Couldn't connect");
  }
}

type FormMode = "add" | "edit";

/** OS・ブラウザのパスワード自動入力を避ける（type=password は使わない） */
const secretValueInputClass =
  "w-full rounded-xl border border-gray-200 px-3 py-2 font-mono text-sm outline-none focus:border-emerald-400 [-webkit-text-security:disc]";

function formatUpdatedAt(iso: string, locale: Locale): string {
  try {
    return new Date(iso).toLocaleString(intlLocale(locale), {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function attachLabel(s: SecretMeta, locale: Locale): string {
  return s.attach_type === "query"
    ? `${pick(locale, "URLパラメータ", "URL parameter")}: ${s.param_name ?? "api_key"}`
    : `${pick(locale, "ヘッダー", "Header")}: ${s.header_name}`;
}

export function SecretsSettingsModal({
  open,
  onClose,
  appId,
  appTitle,
  mode = "app",
  code,
  initialAddName,
}: Props) {
  const formId = useId();
  const t = useT();
  const locale = useLocale();
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
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});

  const registeredNames = useMemo(() => appSecrets.map((s) => s.name), [appSecrets]);
  const usedNames = useMemo(() => (code ? findSecretNames(code) : []), [code]);
  const setupCheck = useMemo(() => (code ? checkApiSetup(code, registeredNames) : null), [code, registeredNames]);

  const testSecret = async (name: string) => {
    if (!appId) return;
    setTestResults((prev) => ({ ...prev, [name]: { state: "loading" } }));
    try {
      const res = await fetch("/api/secrets/app/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId, name, code: code ?? "" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("つながりませんでした", "Couldn't connect"));
      setTestResults((prev) => ({ ...prev, [name]: data as TestResult }));
    } catch (e) {
      setTestResults((prev) => ({ ...prev, [name]: { state: "error", message: e instanceof Error ? e.message : undefined } }));
    }
  };

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
      if (!res.ok) throw new Error(data.error ?? t("読み込みに失敗しました", "Couldn't load"));
      setAppSecrets(data.secrets ?? []);
    } catch (e) {
      setAppError(e instanceof Error ? e.message : t("読み込みに失敗しました", "Couldn't load"));
    } finally {
      setAppLoading(false);
    }
  }, [appId, t]);

  useEffect(() => {
    if (!open) {
      resetForm();
      setTestResults({});
      return;
    }
    if (appId) {
      loadAppSecrets();
      if (initialAddName) {
        resetForm();
        setFormMode("add");
        setFormName(initialAddName);
      }
    } else {
      setAppSecrets([]);
      resetForm();
    }
  }, [open, appId, loadAppSecrets, resetForm, initialAddName]);

  const openAddForm = (name = "") => {
    resetForm();
    setFormMode("add");
    setFormName(name);
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
      setAppError(t("APIキーの値を入力してください", "Please enter the API key"));
      return;
    }
    if (isEdit && replaceValue && !nextValue) {
      setAppError(t("新しいAPIキーを入力するか、「キーを差し替えない」に戻してください", "Enter a new API key, or go back to keeping the current one"));
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
      if (!res.ok) throw new Error(data.error ?? t("保存に失敗しました", "Couldn't save"));
      resetForm();
      await loadAppSecrets();
    } catch (e) {
      setAppError(e instanceof Error ? e.message : t("保存に失敗しました", "Couldn't save"));
    } finally {
      setSavingAppSecret(false);
    }
  };

  const deleteAppSecret = async (name: string) => {
    if (!appId) return;
    if (!window.confirm(format(t("「{name}」を削除しますか？", "Delete “{name}”?"), { name }))) return;
    setAppError("");
    try {
      const res = await fetch(
        `/api/secrets/app?appId=${encodeURIComponent(appId)}&name=${encodeURIComponent(name)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("削除に失敗しました", "Couldn't delete"));
      if (editingName === name) resetForm();
      await loadAppSecrets();
    } catch (e) {
      setAppError(e instanceof Error ? e.message : t("削除に失敗しました", "Couldn't delete"));
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
              {mode === "studio" ? t("APIキー", "API keys") : t("シークレット管理", "Secrets")}
            </h2>
            <p className="text-xs text-gray-500">
              {mode === "studio"
                ? t("キーをコードに書かず、ここに貼り付けて保管", "Keep keys here instead of in your code")
                : t("APIキーをコードに書かず安全に保管", "Store API keys safely, outside your code")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("閉じる", "Close")}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          {!appId ? (
            <div className="space-y-3">
              <p className="text-sm leading-relaxed text-gray-600">{t("読み込み中…", "Loading…")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs leading-relaxed text-gray-500">
                {mode === "studio"
                  ? t("外部API・AI（OpenAI、天気API、地図APIなど）のキーを登録します。コードに書く secret 名と、ここで登録する名前を同じ大文字にしてください。", "Register keys for external APIs and AI (OpenAI, weather, maps, etc.). Use the same UPPERCASE name here as the secret name in your code.")
                  : format(
                      t(
                        "{app} の公開版で使う外部APIキーです。コードでは secret: '名前' だけ指定します。",
                        "External API keys used by the published version of {app}. In the code, only write secret: 'NAME'."
                      ),
                      { app: appTitle ? format(t("「{title}」", "“{title}”"), { title: appTitle }) : t("このアプリ", "this app") }
                    )}
              </p>
              <div className="rounded-xl border border-violet-100 bg-violet-50/70 px-3 py-2.5 text-[11px] leading-relaxed text-violet-900">
                {t("例:", "Example:")}{" "}
                <code>await Jisapp.fetch(url, {"{ secret: 'WEATHER' }"})</code>
              </div>
              {appError && (
                <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-600">{appError}</p>
              )}
              {!appLoading && setupCheck && code && (
                <ApiSetupIssues
                  code={code}
                  check={setupCheck}
                  registeredNames={registeredNames}
                  onRegister={(name) => openAddForm(name)}
                />
              )}
              {appLoading ? (
                <p className="text-xs text-gray-400">{t("読み込み中…", "Loading…")}</p>
              ) : appSecrets.length > 0 ? (
                <ul className="space-y-2">
                  {appSecrets.map((s) => {
                    const result = testResults[s.name];
                    const resultTone =
                      !result || result.state === "loading"
                        ? "text-gray-500"
                        : result.state === "ok"
                          ? "text-emerald-700"
                          : result.state === "unsure" || result.state === "limit"
                            ? "text-amber-700"
                            : "text-rose-600";
                    return (
                    <li
                      key={s.name}
                      className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5"
                    >
                     <div className="flex items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-sm font-bold text-gray-800">{s.name}</p>
                        <p className="text-[10px] text-gray-400">{attachLabel(s, locale)}</p>
                        <p className="mt-0.5 text-[10px] text-emerald-600">
                          {t("●●●● 登録済み", "●●●● Saved")}
                          {s.updated_at ? format(t(" · 更新 {updated_at}", " · updated {updated_at}"), { updated_at: formatUpdatedAt(s.updated_at, locale) }) : ""}
                        </p>
                        {code && usedNames.includes(s.name) && (
                          <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            {t("コードで使われています", "Used in the code")}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => void testSecret(s.name)}
                        disabled={result?.state === "loading"}
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-50 disabled:opacity-50"
                      >
                        <Plug className="h-3.5 w-3.5" />
                        {t("つながるか試す", "Test connection")}
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditForm(s)}
                        title={t("編集", "Edit")}
                        className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteAppSecret(s.name)}
                        title={t("削除", "Delete")}
                        className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                     </div>
                      {result && (
                        <p role="status" className={`mt-1.5 text-[11px] font-semibold leading-relaxed ${resultTone}`}>
                          {testResultText(result, t)}
                        </p>
                      )}
                    </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-xs text-gray-400">{t("登録されたシークレットはありません", "No secrets yet")}</p>
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
                    {formMode === "edit" ? format(t("「{editingName}」を編集", "Edit “{editingName}”"), { editingName }) : t("新しいシークレット", "New secret")}
                  </p>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-gray-700">{t("名前（大文字）", "Name (UPPERCASE)")}</label>
                    <input
                      type="text"
                      name={`${formId}-secret-name`}
                      value={formName}
                      onChange={(e) => setFormName(e.target.value.toUpperCase())}
                      placeholder={t("例: WEATHER, OPENAI, MAPS", "e.g. WEATHER, OPENAI, MAPS")}
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
                        {t("名前はコードの secret 名と一致するため変更できません", "The name matches the secret name in your code, so it can't be changed")}
                      </p>
                    ) : (
                      <p className="mt-1 text-[10px] text-gray-400">
                        {t("コード内の secret 名と同じ名前にしてください", "Use the same name as the secret name in your code")}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-gray-700">{t("APIキーの値", "API key value")}</label>
                    {formMode === "edit" && !replaceValue ? (
                      <div className="space-y-2">
                        <div className="rounded-xl border border-emerald-200 bg-white px-3 py-2.5 text-sm text-emerald-800">
                          {t("●●●● 登録済みのキーをそのまま引き継ぎます", "●●●● Keep the saved key as is")}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setReplaceValue(true);
                            setFormValue("");
                          }}
                          className="text-[11px] font-semibold text-gray-500 underline decoration-dotted underline-offset-2 hover:text-emerald-700"
                        >
                          {t("キーを差し替える", "Replace the key")}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="text"
                          name={`${formId}-secret-token`}
                          value={formValue}
                          onChange={(e) => setFormValue(e.target.value)}
                          placeholder={t("取得したAPIキーを貼り付け", "Paste your API key")}
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
                            {t("差し替えをやめて、登録済みキーを引き継ぐ", "Cancel and keep the saved key")}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-gray-700">{t("付け方", "How it's attached")}</label>
                    <select
                      value={attachType}
                      onChange={(e) => setAttachType(e.target.value as AttachType)}
                      autoComplete="off"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
                    >
                      <option value="header">{t("HTTPヘッダー（Authorization 等）", "HTTP header (Authorization, etc.)")}</option>
                      <option value="query">{t("URLパラメータ（?key= 等）", "URL parameter (?key=, etc.)")}</option>
                    </select>
                  </div>
                  {attachType === "query" && (
                    <div>
                      <label className="mb-1 block text-xs font-bold text-gray-700">{t("パラメータ名", "Parameter name")}</label>
                      <input
                        type="text"
                        name={`${formId}-secret-param`}
                        value={paramName}
                        onChange={(e) => setParamName(e.target.value)}
                        placeholder={t("例: key, appid, api_key", "e.g. key, appid, api_key")}
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
                      {t("キャンセル", "Cancel")}
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
                        ? t("保存中…", "Saving…")
                        : formMode === "edit"
                          ? t("更新する", "Update")
                          : t("追加する", "Add")}
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => openAddForm()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-emerald-300 py-3 text-sm font-bold text-emerald-700 hover:bg-emerald-50"
                >
                  <Plus className="h-4 w-4" />
                  {t("シークレットを追加", "Add a secret")}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
