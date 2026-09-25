"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { JisappLogo } from "@/components/jisapp-logo";
import {
  Terminal,
  Plus,
  Wrench,
  Upload,
  Clock,
  Code2,
  FileText,
  Search,
  Package,
  FolderOpen,
  ArrowRight,
  MoreHorizontal,
  Trash2,
  ShoppingBag,
  CheckCircle2,
  X,
  LibraryBig,
  Key,
  ClipboardList,
  Lightbulb,
  PenLine,
  EyeOff,
  RefreshCw,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SecretsSettingsModal } from "@/components/secrets/secrets-settings-modal";
import { EmbeddedSecretWarningModal } from "@/components/playground/embedded-secret-warning-modal";
import { StorageChangeWarningModal } from "@/components/playground/storage-change-warning-modal";
import { detectEmbeddedSecrets } from "@/lib/playground/detect-embedded-secrets";
import {
  compareStorageUsage,
  hasStorageWarnings,
  type StorageChangeFinding,
} from "@/lib/playground/detect-storage-keys";
import { CATEGORIES, CATEGORY_MAP } from "@/lib/categories";
import { CategoryIcon } from "@/lib/category-icon";
import { ShareButton, ShareButtonRow, CopyUrlButton, AppUrlCopyField } from "@/components/share-button";
import { getAppShareUrl } from "@/lib/share";
import { ProjectThumb } from "@/components/projects/project-thumb";
import { supabase } from "@/lib/supabase";

// ─── 型定義 ───
type Project = {
  id: string;
  title: string;
  description: string;
  updatedAt: string;
  lines: number;
  chars: number;
  gradient: string;
  tag: string;
  tagColor: string;
  isDemo?: boolean;
  appId?: string;
  url?: string;
  status?: "draft" | "listed" | "url_only";
  category?: string;
  libraryCount?: number;
};

function isPublishedProject(proj: Project) {
  return !!(proj.appId || proj.url || proj.status === "listed" || proj.status === "url_only");
}

function getPublishActionLabel(proj: Project) {
  return isPublishedProject(proj) ? "出品情報" : "出品 / URL発行";
}

function getPlaygroundHref(proj: Project) {
  if (proj.id === "saved_playground") return "/playground?load=1";
  return `/playground?project=${proj.id}`;
}

function mapServerProject(row: {
  id: string;
  title: string;
  description: string | null;
  html_code?: string | null;
  code_lines?: number;
  code_chars?: number;
  app_id: string | null;
  status: string;
  is_listed: boolean;
  category: string | null;
  updated_at: string;
  library_count?: number;
}): Project {
  const lineCount = row.code_lines ?? (row.html_code ? row.html_code.split("\n").length : 0);
  const charCount = row.code_chars ?? row.html_code?.length ?? 0;
  const status = row.status as Project["status"];
  const meta = {
    draft:    { tag: "作業中",   tagColor: "bg-sky-100 text-sky-700",        gradient: "from-sky-400 to-cyan-500" },
    listed:   { tag: "公開中",   tagColor: "bg-emerald-100 text-emerald-700", gradient: "from-emerald-500 to-teal-600" },
    url_only: { tag: "URL発行済", tagColor: "bg-teal-100 text-teal-700",     gradient: "from-teal-500 to-cyan-600" },
  }[status ?? "draft"] ?? { tag: "作業中", tagColor: "bg-sky-100 text-sky-700", gradient: "from-sky-400 to-cyan-500" };

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? (status === "draft" ? "開発スタジオで保存したプロジェクトです。" : "出品・URL発行したアプリです。"),
    updatedAt: new Date(row.updated_at).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" }),
    lines: lineCount,
    chars: charCount,
    gradient: meta.gradient,
    tag: meta.tag,
    tagColor: meta.tagColor,
    appId: row.app_id ?? undefined,
    url: row.app_id ? `${origin}/apps/${row.app_id}` : undefined,
    status,
    category: row.category ?? undefined,
    libraryCount: row.library_count ?? 0,
  };
}

type AcquiredApp = {
  id: string | number;
  name: string;
  category?: string;
  creator?: string;
  gradient?: string;
  rating?: number;
  acquiredAt?: string;
};

// ダミープロジェクトは廃止（空配列）
const DEMO_PROJECTS: Project[] = [];

// ダミー入手アプリは廃止
const STATIC_ACQUIRED: AcquiredApp[] = [];

// ─── プロジェクトカード ───
function ProjectCard({ proj, onDelete, onPublish, onUnlist }: {
  proj: Project;
  onDelete?: (id: string) => void;
  onPublish?: (proj: Project) => void;
  onUnlist?: (proj: Project) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-emerald-200">

      {/* アプリ画面のサムネイル（トップページのカードと同じ見た目） */}
      <div className="relative">
        <ProjectThumb
          projectId={proj.id}
          appId={proj.appId}
          fallbackGradient={proj.gradient}
          categoryId={proj.category}
        />
        <span className={`absolute bottom-2.5 left-3 z-30 rounded-full px-2.5 py-0.5 text-[10px] font-bold shadow-sm ring-1 ring-white/60 ${proj.tagColor}`}>
          {proj.tag}
        </span>

        {/* 3点メニュー */}
        <div className="absolute right-2 top-9 z-30">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
            aria-label="メニュー"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-sm ring-1 ring-black/5 hover:bg-white transition-colors"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-20 w-36 overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-black/10">
                <Link
                  href={getPlaygroundHref(proj)}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  <Wrench className="h-3.5 w-3.5" />
                  エディタで開く
                </Link>
                <button
                  onClick={() => { setMenuOpen(false); onPublish?.(proj); }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  <Upload className="h-3.5 w-3.5" />
                  {getPublishActionLabel(proj)}
                </button>
                {proj.status === "listed" && onUnlist && (
                  <button
                    onClick={() => { onUnlist(proj); setMenuOpen(false); }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-amber-700 hover:bg-amber-50"
                  >
                    <X className="h-3.5 w-3.5" />
                    出品を取り下げ
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => { onDelete(proj.id); setMenuOpen(false); }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    削除
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* カード本体 */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div>
          <h3 className="font-black text-gray-900 leading-snug group-hover:text-emerald-700 transition-colors">
            {proj.title}
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-gray-500 line-clamp-2">
            {proj.description}
          </p>
        </div>

        {/* メタ情報 */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-400">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {proj.updatedAt}
          </span>
          <span className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            {proj.lines} 行
          </span>
          <span>{proj.chars.toLocaleString()} 文字</span>
          {isPublishedProject(proj) && proj.libraryCount != null && (
            <span className="flex items-center gap-1 text-teal-600">
              <LibraryBig className="h-3 w-3" />
              {proj.libraryCount}人がライブラリ登録
            </span>
          )}
        </div>

        {/* アクションボタン */}
        <div className="mt-auto flex flex-col gap-2 pt-1">
          <div className="flex gap-2">
            <Link
              href={getPlaygroundHref(proj)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gray-100 py-2 text-xs font-bold text-gray-700 transition-all hover:bg-emerald-100 hover:text-emerald-700 active:scale-[0.98]"
            >
              <Wrench className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              編集する
            </Link>
            <button
              onClick={() => onPublish?.(proj)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-2 text-xs font-bold text-white shadow-sm shadow-emerald-600/25 transition-all hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98]"
            >
              <Upload className="h-3.5 w-3.5" />
              {getPublishActionLabel(proj)}
            </button>
          </div>
          {(proj.url || proj.appId) && (
            <div className="flex gap-2">
              <ShareButton
                url={proj.url ?? getAppShareUrl(String(proj.appId))}
                title={proj.title}
                text={`${proj.title} | ジサップで作った無料アプリ`}
                variant="outline"
                className="flex-1"
              />
              <CopyUrlButton
                url={proj.url ?? getAppShareUrl(String(proj.appId))}
                className="flex-1"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── GETしたアプリカード ───
function AcquiredCard({ app }: { app: AcquiredApp }) {
  return (
    <Link
      href={`/apps/${app.id}`}
      className="group flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 transition-all hover:shadow-md hover:ring-emerald-200 hover:-translate-y-0.5"
    >
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${app.gradient ?? "from-emerald-500 to-teal-600"}`}>
        <ShoppingBag className="h-5 w-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-bold text-gray-900 truncate group-hover:text-emerald-700 transition-colors">
            {app.name}
          </p>
          <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700">FREE</span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-gray-400">
          {app.category && <span>{app.category}</span>}
          {app.creator && <span>by {app.creator}</span>}
          {app.rating && <span>評価 {app.rating}</span>}
        </div>
        {app.acquiredAt && (
          <p className="mt-0.5 flex items-center gap-1 text-[10px] text-gray-400">
            <Clock className="h-2.5 w-2.5" />
            {app.acquiredAt} に取得
          </p>
        )}
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-gray-300 group-hover:text-emerald-500 transition-colors" />
    </Link>
  );
}

// ─── 空状態 ───
function EmptyState({ tab }: { tab: "mine" | "acquired" }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl bg-white py-16 text-center shadow-sm ring-1 ring-black/5">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50">
        {tab === "mine"
          ? <Code2 className="h-7 w-7 text-gray-300" strokeWidth={2} />
          : <Package className="h-7 w-7 text-gray-300" strokeWidth={2} />}
      </div>
      <div>
        <p className="font-bold text-gray-700">
          {tab === "mine" ? "まだプロジェクトがありません" : "まだGETしたアプリがありません"}
        </p>
        <p className="mt-1 text-xs text-gray-400">
          {tab === "mine"
            ? "開発スタジオでコードを作って保存してみよう"
            : "トップページからアプリをGETしてライブラリに追加しよう"}
        </p>
      </div>
      <Link
        href={tab === "mine" ? "/playground" : "/"}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-600/25 hover:from-emerald-700 hover:to-teal-700 transition-all active:scale-[0.97]"
      >
        {tab === "mine"
          ? <><Terminal className="h-4 w-4" /> 開発スタジオを開く</>
          : <><ShoppingBag className="h-4 w-4" /> アプリを探す</>}
      </Link>
    </div>
  );
}

// ─── 出品済み情報の型（コンポーネント外で定義） ───
type PublishedInfo = { appId: string; url: string; title: string; description: string; category: string; is_listed: boolean };

// ─── メインページ ───
export default function ProjectsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"mine" | "acquired">("mine");
  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [acquiredApps, setAcquiredApps] = useState<AcquiredApp[]>([]);
  const [myProjects, setMyProjects] = useState<Project[]>(DEMO_PROJECTS);

  // 出品済みマップ: projectId → PublishedInfo
  const [publishedMap, setPublishedMap] = useState<Record<string, PublishedInfo>>({});

  // 出品モーダル
  const [publishTarget, setPublishTarget]     = useState<Project | null>(null);
  const [publishTitle, setPublishTitle]       = useState("");
  const [publishDesc, setPublishDesc]         = useState("");
  const [publishCategory, setPublishCategory] = useState("");
  const [publishCodePublic, setPublishCodePublic] = useState(false);
  const [publishing, setPublishing]           = useState(false);
  const [publishedUrl, setPublishedUrl]       = useState<string | null>(null);
  const [urlCopied, setUrlCopied]             = useState(false);
  const [publishError, setPublishError]       = useState<string | null>(null);
  const [publishResetUserData, setPublishResetUserData] = useState(false);
  const [showSecretsModal, setShowSecretsModal] = useState(false);
  const [secretWarningOpen, setSecretWarningOpen] = useState(false);
  const [secretFindings, setSecretFindings] = useState<{ label: string }[]>([]);
  const [storageWarningOpen, setStorageWarningOpen] = useState(false);
  const [storageFindings, setStorageFindings] = useState<StorageChangeFinding[]>([]);
  const [pendingListed, setPendingListed] = useState<boolean | null>(null);
  const [pendingHtmlForPublish, setPendingHtmlForPublish] = useState<string | null>(null);
  const storageWarningAckRef = useRef(false);
  const secretWarningAckRef = useRef(false);
  const [publishUpdateNotes, setPublishUpdateNotes] = useState("");

  // 編集モード
  const [editMode, setEditMode]     = useState(false);
  const [saving, setSaving]         = useState(false);
  const [saveError, setSaveError]   = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [unlisting, setUnlisting]     = useState(false);

  const republishAppId = publishTarget
    ? (publishedMap[publishTarget.id]?.appId ?? publishTarget.appId)
    : undefined;
  const isRepublish = !!republishAppId;

  // localStorage から出品済みマップを読み込む
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("jisapp_published_map") ?? "{}");
      setPublishedMap(stored);
    } catch { /* noop */ }
  }, []);

  const savePublishedMap = (map: Record<string, PublishedInfo>) => {
    setPublishedMap(map);
    try { localStorage.setItem("jisapp_published_map", JSON.stringify(map)); } catch { /* noop */ }
  };

  const openPublishModal = (proj: Project) => {
    setPublishTarget(proj);
    setPublishError(null);
    setUrlCopied(false);
    setSaveError(null);
    setSaveSuccess(false);
    setEditMode(false);
    setPublishCodePublic(false);
    setPublishResetUserData(false);
    setPublishUpdateNotes("");
    storageWarningAckRef.current = false;
    secretWarningAckRef.current = false;
    setPendingHtmlForPublish(null);

    if (proj.appId) {
      supabase
        .from("apps")
        .select("code_public")
        .eq("id", proj.appId)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setPublishCodePublic(Boolean(data.code_public));
        });
    }

    if (proj.appId && proj.url) {
      const existing = publishedMap[proj.id];
      setPublishedUrl(proj.url);
      setPublishTitle(existing?.title ?? proj.title);
      setPublishDesc(existing?.description ?? proj.description ?? "");
      setPublishCategory(existing?.category ?? proj.category ?? "");
    } else {
      const existing = publishedMap[proj.id];
      if (existing) {
        setPublishedUrl(existing.url);
        setPublishTitle(existing.title);
        setPublishDesc(existing.description ?? "");
        setPublishCategory(existing.category ?? "");
      } else {
        setPublishedUrl(null);
        setPublishTitle(proj.isDemo ? "" : proj.title);
        setPublishDesc(proj.description ?? "");
        setPublishCategory(proj.category ?? "");
      }
    }
  };

  const reloadProjects = async () => {
    try {
      const res = await fetch("/api/my-projects");
      if (!res.ok) return;
      const data = await res.json();
      if (!data.logged_in) return;
      const projects = (data.projects ?? []).map(mapServerProject);
      setMyProjects(projects);
      const map: Record<string, PublishedInfo> = {};
      for (const row of data.projects ?? []) {
        if (row.app_id) {
          map[row.id] = {
            appId: row.app_id,
            url: `${window.location.origin}/apps/${row.app_id}`,
            title: row.title,
            description: row.description ?? "",
            category: row.category ?? "",
            is_listed: row.is_listed,
          };
        }
      }
      setPublishedMap(map);
    } catch { /* noop */ }
  };

  const handlePublish = async (is_listed: boolean) => {
    if (!publishTarget || publishing) return;
    const title = publishTitle.trim();
    if (!title) { setPublishError("アプリ名を入力してください"); return; }
    if (is_listed && !publishCategory) { setPublishError("カテゴリを選択してください"); return; }

    let html_code = "";
    if (publishTarget.id === "saved_playground") {
      try { html_code = localStorage.getItem("jisapp_playground_code") ?? ""; } catch { /**/ }
    } else {
      try {
        const codeRes = await fetch(`/api/my-projects/${publishTarget.id}`);
        if (codeRes.ok) {
          const d = await codeRes.json();
          html_code = d.project?.html_code ?? "";
        }
      } catch { /* noop */ }
    }
    if (!html_code.trim()) {
      setPublishError("コードが見つかりません。開発スタジオでコードを保存してから出品してください。");
      return;
    }

    if (!secretWarningAckRef.current) {
      const findings = detectEmbeddedSecrets(html_code);
      if (findings.length > 0) {
        setSecretFindings(findings);
        setPendingListed(is_listed);
        setPendingHtmlForPublish(html_code);
        setSecretWarningOpen(true);
        return;
      }
    }

    const existingAppId = publishedMap[publishTarget.id]?.appId ?? publishTarget.appId;
    if (existingAppId && !storageWarningAckRef.current) {
      try {
        const res = await fetch(`/api/apps/${existingAppId}/owner-code`);
        if (res.ok) {
          const data = (await res.json()) as { html_code?: string };
          const storageDiff = compareStorageUsage(data.html_code ?? "", html_code);
          if (hasStorageWarnings(storageDiff)) {
            setStorageFindings(storageDiff);
            setPendingListed(is_listed);
            setPendingHtmlForPublish(html_code);
            setStorageWarningOpen(true);
            return;
          }
        }
      } catch {
        /* 比較失敗時は公開を止めない */
      }
    }

    await executePublish(is_listed, html_code);
  };

  const executePublish = async (is_listed: boolean, html_code: string) => {
    if (!publishTarget || publishing) return;
    const title = publishTitle.trim();
    if (!title) return;

    setPublishing(true);
    setPublishError(null);
    const existingAppId = publishedMap[publishTarget.id]?.appId ?? publishTarget.appId;
    try {
      const res = await fetch("/api/apps/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: publishDesc.trim() || null,
          html_code,
          category: publishCategory || null,
          is_listed,
          code_public: publishCodePublic,
          project_id: publishTarget.id !== "saved_playground" ? publishTarget.id : undefined,
          app_id: existingAppId,
          reset_user_data: isRepublish ? publishResetUserData : undefined,
          update_notes: isRepublish ? publishUpdateNotes.trim() || undefined : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "出品に失敗しました");
      const url = `${window.location.origin}/apps/${json.id}`;
      setPublishedUrl(url);
      savePublishedMap({
        ...publishedMap,
        [publishTarget.id]: { appId: json.id, url, title, description: publishDesc.trim(), category: publishCategory, is_listed },
      });
      await reloadProjects();
    } catch (e) {
      setPublishError(e instanceof Error ? e.message : "出品に失敗しました");
    } finally {
      setPublishing(false);
    }
  };

  const handleUnlist = async (proj: Project) => {
    if (!proj.appId) return;
    if (!confirm(`「${proj.title}」の出品を取り下げますか？\nトップページの一覧から非表示になります（URLは引き続き使えます）。`)) return;

    setUnlisting(true);
    try {
      const appRes = await fetch(`/api/apps/${proj.appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_listed: false }),
      });
      if (!appRes.ok) {
        const d = await appRes.json().catch(() => ({}));
        throw new Error((d as { error?: string }).error ?? "取り下げに失敗しました");
      }

      if (proj.id !== "saved_playground") {
        await fetch(`/api/my-projects/${proj.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "url_only", is_listed: false }),
        });
      }

      if (publishTarget?.id === proj.id) setPublishTarget(null);
      await reloadProjects();
    } catch (e) {
      alert(e instanceof Error ? e.message : "取り下げに失敗しました");
    } finally {
      setUnlisting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!publishTarget || saving) return;
    const info = publishedMap[publishTarget.id];
    if (!info) return;
    const title = publishTitle.trim();
    if (!title) { setSaveError("アプリ名を入力してください"); return; }

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const res = await fetch(`/api/apps/${info.appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: publishDesc.trim() || null,
          category: publishCategory || null,
          code_public: publishCodePublic,
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "更新に失敗しました");
      }
      // ローカルも更新
      savePublishedMap({
        ...publishedMap,
        [publishTarget.id]: { ...info, title, description: publishDesc.trim(), category: publishCategory },
      });
      setSaveSuccess(true);
      setEditMode(false);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "更新に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/my-projects");
        if (res.ok) {
          const data = await res.json();
          if (data.logged_in) {
            const projects = (data.projects ?? []).map(mapServerProject);
            setMyProjects(projects);
            const map: Record<string, PublishedInfo> = {};
            for (const row of data.projects ?? []) {
              if (row.app_id) {
                map[row.id] = {
                  appId: row.app_id,
                  url: `${window.location.origin}/apps/${row.app_id}`,
                  title: row.title,
                  description: row.description ?? "",
                  category: row.category ?? "",
                  is_listed: row.is_listed,
                };
              }
            }
            setPublishedMap(map);
            setMounted(true);
            return;
          }
        }
      } catch { /* noop */ }

      // 未ログイン時: localStorage フォールバック
      let deletedIds: string[] = [];
      try {
        deletedIds = JSON.parse(localStorage.getItem("jisapp_deleted_projects") ?? "[]");
      } catch { /* noop */ }

      try {
        const savedCode = localStorage.getItem("jisapp_playground_code");
        const activeDemos = DEMO_PROJECTS.filter((p) => !deletedIds.includes(p.id));

        if (savedCode && savedCode.trim() && !deletedIds.includes("saved_playground")) {
          const lines = savedCode.split("\n").length;
          const chars = savedCode.length;
          const savedTitle = localStorage.getItem("jisapp_playground_title") ?? "開発スタジオの作業中コード";
          const savedProject: Project = {
            id: "saved_playground",
            title: savedTitle,
            description: "開発スタジオで保存したコードです。「編集する」からそのまま続きを開発できます。",
            updatedAt: new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" }),
            lines,
            chars,
            gradient: "from-sky-400 to-cyan-500",
            tag: "作業中",
            tagColor: "bg-sky-100 text-sky-700",
            status: "draft",
          };
          setMyProjects([savedProject, ...activeDemos]);
        } else {
          setMyProjects(activeDemos);
        }
      } catch { /* noop */ }

      setMounted(true);
    };
    load();
  }, []);

  const handleDeleteProject = async (id: string) => {
    const proj = myProjects.find((p) => p.id === id);
    const confirmMsg =
      proj && isPublishedProject(proj)
        ? `「${proj.title}」を削除しますか？\n出品も取り下げられ、トップページ・探すページから非表示になります。`
        : "このプロジェクトを削除しますか？";

    if (!confirm(confirmMsg)) return;

    if (id === "saved_playground") {
      try {
        const map = JSON.parse(localStorage.getItem("jisapp_published_map") ?? "{}");
        const existing = map["saved_playground"];
        if (existing?.appId) {
          const res = await fetch(`/api/apps/${existing.appId}`, { method: "DELETE" });
          if (!res.ok) {
            const d = await res.json().catch(() => ({}));
            alert((d as { error?: string }).error ?? "アプリの取り下げに失敗しました");
            return;
          }
        }
        localStorage.removeItem("jisapp_playground_code");
        delete map["saved_playground"];
        localStorage.setItem("jisapp_published_map", JSON.stringify(map));
      } catch {
        alert("削除に失敗しました");
        return;
      }
    } else {
      try {
        const res = await fetch(`/api/my-projects/${id}`, { method: "DELETE" });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          alert((d as { error?: string }).error ?? "削除に失敗しました");
          return;
        }
      } catch {
        alert("削除に失敗しました");
        return;
      }
    }
    try {
      const deleted: string[] = JSON.parse(localStorage.getItem("jisapp_deleted_projects") ?? "[]");
      if (!deleted.includes(id)) {
        localStorage.setItem("jisapp_deleted_projects", JSON.stringify([...deleted, id]));
      }
      const map = JSON.parse(localStorage.getItem("jisapp_published_map") ?? "{}");
      if (map[id]) {
        delete map[id];
        localStorage.setItem("jisapp_published_map", JSON.stringify(map));
      }
    } catch { /* noop */ }
    setMyProjects((prev) => prev.filter((p) => p.id !== id));
  };

  // 検索フィルター
  const filteredProjects = myProjects.filter((p) =>
    !query || p.title.toLowerCase().includes(query.toLowerCase()) || p.tag.toLowerCase().includes(query.toLowerCase())
  );
  const filteredAcquired = acquiredApps.filter((a) =>
    !query || a.name.toLowerCase().includes(query.toLowerCase()) || (a.category ?? "").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-jisapp-ambient">

      {/* ══════════ ヘッダー ══════════ */}
      <header className="sticky top-0 z-40 border-b border-white/70 bg-white/75 backdrop-blur-xl">
        <div aria-hidden className="h-[3px] bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-400" />
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">

          <BackButton label="戻る" hideLabelOnMobile />

          <JisappLogo href="/" />
          <span className="ml-1 text-sm text-gray-400">/</span>
          <span className="text-sm font-semibold text-gray-700">マイプロジェクト</span>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/playground"
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:from-emerald-700 hover:to-teal-700"
            >
              <Plus className="h-4 w-4 shrink-0" strokeWidth={2} />
              <span className="hidden sm:inline">新規プロジェクト</span>
              <span className="sm:hidden">新規</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-4 px-4 py-6 pb-16">

        {/* ══════════ 概要 ══════════ */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-bold tracking-wide text-teal-700">
                アプリ開発スタジオ
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
                保存したコードの一覧です。出品するとジサップで公開できます。
              </p>
            </div>
            <Link
              href="/playground"
              className="flex shrink-0 items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-emerald-300 hover:text-emerald-700"
            >
              <Terminal className="h-4 w-4 shrink-0" strokeWidth={2} />
              <span className="hidden sm:inline">エディタを開く</span>
              <span className="sm:hidden">エディタ</span>
            </Link>
          </div>

          {/* 統計 */}
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-gray-100 pt-4 text-center">
            {[
              { label: "プロジェクト", value: mounted ? myProjects.length : "—" },
              { label: "GETしたアプリ", value: mounted ? acquiredApps.length : "—" },
              {
                label: "総コード行数",
                value: mounted
                  ? myProjects.reduce((s, p) => s + p.lines, 0).toLocaleString()
                  : "—",
              },
            ].map((s, i) => (
              <div
                key={s.label}
                className={cn(
                  "rounded-xl bg-gradient-to-br py-2.5",
                  ["from-emerald-50 to-teal-50", "from-sky-50 to-cyan-50", "from-amber-50 to-orange-50"][i]
                )}
              >
                <p className="text-lg font-bold tracking-tight text-gray-900">{s.value}</p>
                <p className="mt-0.5 text-[10px] text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════ 検索バー ══════════ */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="プロジェクト名やカテゴリで検索..."
            className="h-11 w-full rounded-2xl border border-gray-200 bg-white pl-11 pr-4 text-sm text-gray-700 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
          />
        </div>

        {/* ══════════ タブ ══════════ */}
        <div className="flex gap-1 rounded-2xl bg-white/60 p-1 ring-1 ring-white/80 backdrop-blur-sm">
          {([
            { id: "mine",     label: "自分が作ったツール",     icon: Wrench,  count: myProjects.length    },
            { id: "acquired", label: "ジサップでGETしたツール", icon: Package, count: acquiredApps.length  },
          ] as { id: "mine" | "acquired"; label: string; icon: LucideIcon; count: number }[]).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all",
                tab === t.id
                  ? "bg-white text-emerald-700 shadow-sm ring-1 ring-black/5"
                  : "text-gray-500 hover:text-emerald-600"
              )}
            >
              <t.icon className="h-4 w-4 shrink-0" strokeWidth={2} />
              {t.label}
              {mounted && (
                <span className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-black",
                  tab === t.id ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-500"
                )}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ══════════ コンテンツ ══════════ */}
        {!mounted ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          </div>
        ) : tab === "mine" ? (

          /* ── 自分のプロジェクト ── */
          <>
            {filteredProjects.length > 0 ? (
              <>
                {/* ヒント */}
                <div className="flex items-start gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-black/5">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" strokeWidth={2} />
                  <p className="text-xs leading-relaxed text-gray-500">
                    開発スタジオで保存したコードはここに表示されます。「出品する」を押すとジサップのマーケットに無料で公開できます。
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredProjects.map((proj) => (
                    <ProjectCard key={proj.id} proj={proj} onDelete={handleDeleteProject} onPublish={openPublishModal} onUnlist={handleUnlist} />
                  ))}

                  {/* 新規作成カード */}
                  <Link
                    href="/playground"
                    className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-emerald-200 bg-white/70 py-10 text-center transition-colors hover:border-emerald-300 hover:bg-emerald-50/40"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md shadow-emerald-600/25 transition-transform group-hover:scale-105">
                      <Plus className="h-6 w-6 text-white" strokeWidth={2.25} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-700">新規プロジェクトを作成</p>
                      <p className="mt-0.5 text-xs text-gray-400">開発スタジオが開きます</p>
                    </div>
                  </Link>
                </div>
              </>
            ) : (
              <EmptyState tab="mine" />
            )}
          </>

        ) : (

          /* ── GETしたツール ── */
          <>
            {filteredAcquired.length > 0 ? (
              <>
                <div className="flex items-start gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-black/5">
                  <Package className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" strokeWidth={2} />
                  <p className="text-xs leading-relaxed text-gray-500">
                    ジサップでGETしたアプリの一覧です。カードをタップすると詳細ページでソースコードを確認できます。
                  </p>
                </div>

                <div className="space-y-3">
                  {filteredAcquired.map((app) => (
                    <AcquiredCard key={app.id} app={app} />
                  ))}
                </div>

                <div className="pt-2 text-center">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                  >
                    もっとアプリを探す
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </>
            ) : (
              <EmptyState tab="acquired" />
            )}
          </>
        )}

      </main>

      {/* ══════════ 出品モーダル ══════════ */}
      <EmbeddedSecretWarningModal
        open={secretWarningOpen}
        findings={secretFindings}
        onClose={() => {
          setSecretWarningOpen(false);
          setPendingListed(null);
          setPendingHtmlForPublish(null);
        }}
        onOpenSecrets={() => {
          setSecretWarningOpen(false);
          setPendingListed(null);
          setPendingHtmlForPublish(null);
          setShowSecretsModal(true);
        }}
        onProceed={async () => {
          if (pendingListed === null) return;
          const listed = pendingListed;
          secretWarningAckRef.current = true;
          setSecretWarningOpen(false);
          setPendingListed(null);
          setPendingHtmlForPublish(null);
          await handlePublish(listed);
        }}
      />

      <StorageChangeWarningModal
        open={storageWarningOpen}
        findings={storageFindings}
        onClose={() => {
          setStorageWarningOpen(false);
          setPendingListed(null);
          setPendingHtmlForPublish(null);
        }}
        onProceed={async () => {
          if (pendingListed === null || !pendingHtmlForPublish) return;
          storageWarningAckRef.current = true;
          const listed = pendingListed;
          const html_code = pendingHtmlForPublish;
          setStorageWarningOpen(false);
          setPendingListed(null);
          setPendingHtmlForPublish(null);
          await executePublish(listed, html_code);
        }}
        onProceedWithReset={async () => {
          if (pendingListed === null || !pendingHtmlForPublish) return;
          storageWarningAckRef.current = true;
          setPublishResetUserData(true);
          const listed = pendingListed;
          const html_code = pendingHtmlForPublish;
          setStorageWarningOpen(false);
          setPendingListed(null);
          setPendingHtmlForPublish(null);
          await executePublish(listed, html_code);
        }}
      />

      <SecretsSettingsModal
        open={showSecretsModal}
        onClose={() => setShowSecretsModal(false)}
        appId={republishAppId ?? undefined}
        appTitle={publishTitle || publishTarget?.title}
      />

      {publishTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">

            {publishedUrl && !editMode ? (
              /* ─ URL確認画面（出品済み） ─ */
              <>
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                  <h3 className="flex items-center gap-1.5 text-base font-black text-gray-900">
                    <ClipboardList className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                    出品情報
                  </h3>
                  <button onClick={() => setPublishTarget(null)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
                <div className="flex flex-col gap-4 p-6">
                  {saveSuccess && (
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 ring-1 ring-emerald-200">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <p className="text-xs font-bold text-emerald-700">更新しました</p>
                    </div>
                  )}
                  <div>
                    <p className="mb-1 text-[10px] font-bold text-gray-500">アプリ名</p>
                    <p className="text-sm font-black text-gray-900">{publishTitle}</p>
                  </div>
                  {publishCategory && CATEGORY_MAP[publishCategory] && (
                    <div>
                      <p className="mb-1 text-[10px] font-bold text-gray-500">カテゴリ</p>
                      <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold", CATEGORY_MAP[publishCategory].tagColor)}>
                        <CategoryIcon categoryId={publishCategory} className="h-4 w-4 shrink-0" />
                        {CATEGORY_MAP[publishCategory].name}
                      </span>
                    </div>
                  )}
                  {publishDesc && (
                    <div>
                      <p className="mb-1 text-[10px] font-bold text-gray-500">説明</p>
                      <p className="text-xs text-gray-600 leading-relaxed">{publishDesc}</p>
                    </div>
                  )}
                  <div>
                    <p className="mb-1 text-[10px] font-bold text-gray-500">アプリURL</p>
                    <AppUrlCopyField url={publishedUrl} />
                  </div>
                  {republishAppId && (
                    <button
                      type="button"
                      onClick={() => setShowSecretsModal(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 py-2.5 text-xs font-bold text-violet-800 hover:bg-violet-100"
                    >
                      <Key className="h-3.5 w-3.5" />
                      アプリ用シークレットを管理
                    </button>
                  )}
                  {publishTarget && isPublishedProject(publishTarget) && (
                    <div className="flex items-center gap-2 rounded-xl bg-teal-50 px-4 py-3 ring-1 ring-teal-200">
                      <LibraryBig className="h-4 w-4 shrink-0 text-teal-600" />
                      <p className="text-xs font-bold text-teal-800">
                        マイライブラリ登録: <span className="text-sm">{publishTarget.libraryCount ?? 0}</span> 人
                      </p>
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <ShareButtonRow
                      url={publishedUrl}
                      title={publishTitle}
                      text={`${publishTitle} | ジサップで作った無料アプリ`}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(publishedUrl.replace(window.location.origin, ""))}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gray-100 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-200 transition-all"
                      >
                        アプリを開く
                        <ArrowRight className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                      </button>
                    </div>
                    <button
                      onClick={() => { setEditMode(true); setSaveSuccess(false); }}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all"
                    >
                      <PenLine className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                      出品情報を編集する
                    </button>
                    {publishTarget?.status === "listed" && (
                      <button
                        onClick={() => handleUnlist(publishTarget)}
                        disabled={unlisting}
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 py-2.5 text-xs font-bold text-amber-700 hover:bg-amber-100 transition-all disabled:opacity-50"
                      >
                        {unlisting ? "取り下げ中…" : <><EyeOff className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />出品を取り下げる</>}
                      </button>
                    )}
                  </div>
                  <button onClick={() => setPublishTarget(null)} className="text-center text-[10px] text-gray-400 hover:text-gray-600 transition-colors">閉じる</button>
                </div>
              </>

            ) : publishedUrl && editMode ? (
              /* ─ 編集画面 ─ */
              <>
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                  <h3 className="flex items-center gap-1.5 text-base font-black text-gray-900">
                    <PenLine className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                    出品情報を編集
                  </h3>
                  <button onClick={() => setEditMode(false)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
                <div className="flex flex-col gap-4 p-6">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700">アプリ名 <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      value={publishTitle}
                      onChange={(e) => setPublishTitle(e.target.value)}
                      className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm text-gray-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700">カテゴリ</label>
                    <div className="flex flex-wrap gap-1.5">
                      {CATEGORIES.map((cat) => (
                        <button key={cat.id} type="button" onClick={() => setPublishCategory(cat.id)}
                          className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all",
                            publishCategory === cat.id ? "bg-emerald-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700"
                          )}>
                          <CategoryIcon categoryId={cat.id} className="h-4 w-4 shrink-0" />
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700">説明（任意）</label>
                    <textarea
                      value={publishDesc}
                      onChange={(e) => setPublishDesc(e.target.value)}
                      rows={3}
                      className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                    />
                  </div>
                  <div className="rounded-2xl border border-violet-100 bg-violet-50/70 p-4">
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={publishCodePublic}
                        onChange={(e) => setPublishCodePublic(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-violet-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs leading-relaxed text-violet-900">
                        <span className="font-bold">ソースコードを公開する</span>
                        <br />
                        マイライブラリに追加したユーザーだけが閲覧できます
                      </span>
                    </label>
                  </div>
                  {saveError && (
                    <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-xs text-rose-600 ring-1 ring-rose-200">{saveError}</p>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => setEditMode(false)} className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                      キャンセル
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={saving || !publishTitle.trim()}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-sm font-bold text-white shadow-md shadow-emerald-600/25 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] disabled:opacity-50"
                    >
                      {saving ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />保存中…</> : "保存する"}
                    </button>
                  </div>
                </div>
              </>

            ) : (
              /* ─ 新規出品フォーム ─ */
              <>
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                  <h3 className="flex items-center gap-1.5 text-base font-black text-gray-900">
                    {isRepublish
                      ? <><RefreshCw className="h-4 w-4 shrink-0" strokeWidth={2.5} />アプリを上書きする</>
                      : <><Upload className="h-4 w-4 shrink-0" strokeWidth={2.5} />アプリを出品する</>}
                  </h3>
                  <button onClick={() => setPublishTarget(null)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
                <div className="flex flex-col gap-4 p-6">
                  {publishTarget.isDemo && (
                    <div className="rounded-2xl bg-amber-50 px-4 py-3 ring-1 ring-amber-200">
                      <p className="flex items-start gap-2 text-xs text-amber-700">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
                        <span>このプロジェクトはデモデータです。開発スタジオで実際にコードを作成・保存してから出品してください。</span>
                      </p>
                    </div>
                  )}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700">アプリ名 <span className="text-rose-500">*</span></label>
                    <input type="text" value={publishTitle} onChange={(e) => setPublishTitle(e.target.value)} placeholder="例：就活管理ツール"
                      className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm text-gray-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700">カテゴリ <span className="text-rose-500">*</span></label>
                    <div className="flex flex-wrap gap-1.5">
                      {CATEGORIES.map((cat) => (
                        <button key={cat.id} type="button" onClick={() => setPublishCategory(cat.id)}
                          className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all",
                            publishCategory === cat.id ? "bg-emerald-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700"
                          )}>
                          <CategoryIcon categoryId={cat.id} className="h-4 w-4 shrink-0" />
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700">説明（任意）</label>
                    <textarea value={publishDesc} onChange={(e) => setPublishDesc(e.target.value)} placeholder="アプリの使い方や特徴を簡単に説明..." rows={3}
                      className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20" />
                  </div>
                  <div className="rounded-2xl border border-violet-100 bg-violet-50/70 p-4">
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={publishCodePublic}
                        onChange={(e) => setPublishCodePublic(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-violet-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs leading-relaxed text-violet-900">
                        <span className="font-bold">ソースコードを公開する</span>
                        <br />
                        マイライブラリに追加したユーザーだけが閲覧できます（アプリの実行自体は誰でも可能）
                      </span>
                    </label>
                  </div>
                  {isRepublish && republishAppId && (
                    <button
                      type="button"
                      onClick={() => setShowSecretsModal(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 py-2.5 text-xs font-bold text-violet-800 hover:bg-violet-100"
                    >
                      <Key className="h-3.5 w-3.5" />
                      アプリ用シークレットを管理
                    </button>
                  )}
                  {isRepublish && (
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-gray-700">
                        マイライブラリ登録者への更新内容
                        <span className="ml-1 text-[10px] font-normal text-gray-400">（任意・200字まで）</span>
                      </label>
                      <textarea
                        value={publishUpdateNotes}
                        onChange={(e) => setPublishUpdateNotes(e.target.value)}
                        placeholder={
                          publishResetUserData
                            ? "例：UIを大幅に変更しました。保存データは互換性がないため、アップデート時にリセットされます。"
                            : "例：ダークモードを追加しました。保存データはそのまま使えます。"
                        }
                        rows={3}
                        maxLength={200}
                        className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                      />
                      <p className="mt-1 text-right text-[10px] text-gray-400">{publishUpdateNotes.length}/200</p>
                    </div>
                  )}
                  {isRepublish && (
                    <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-4">
                      <p className="mb-3 text-xs font-bold text-amber-900">マイライブラリ登録者の保存データ</p>
                      <label className="flex cursor-pointer items-start gap-3">
                        <input
                          type="radio"
                          name="resetUserDataProjects"
                          checked={!publishResetUserData}
                          onChange={() => setPublishResetUserData(false)}
                          className="mt-0.5 h-4 w-4 border-amber-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-xs leading-relaxed text-amber-900">
                          <span className="font-bold">データを引き継ぐ</span>
                          <br />
                          ユーザーはアップデートの確認後、保存データを維持したまま新しいコードを選べます
                        </span>
                      </label>
                      <label className="mt-3 flex cursor-pointer items-start gap-3">
                        <input
                          type="radio"
                          name="resetUserDataProjects"
                          checked={publishResetUserData}
                          onChange={() => setPublishResetUserData(true)}
                          className="mt-0.5 h-4 w-4 border-amber-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-xs leading-relaxed text-amber-900">
                          <span className="font-bold">アップデート時にデータをリセット</span>
                          <br />
                          ユーザーがアップデートを選んだ場合、保存データが消える可能性があることを案内します
                        </span>
                      </label>
                    </div>
                  )}
                  {publishError && (
                    <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-xs text-rose-600 ring-1 ring-rose-200">{publishError}</p>
                  )}
                  <button onClick={() => handlePublish(false)} disabled={publishing || publishTarget.isDemo || !publishTitle.trim()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white py-3 text-sm font-bold text-gray-700 transition-all hover:bg-gray-50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
                    {publishing ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />上書き中…</> : <><CheckCircle2 className="h-4 w-4 text-gray-500" />{isRepublish ? "上書きする" : "URLだけ発行する（非公開）"}</>}
                  </button>
                  <button onClick={() => handlePublish(true)} disabled={publishing || publishTarget.isDemo || !publishTitle.trim() || !publishCategory}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-sm font-bold text-white shadow-md shadow-emerald-600/25 transition-all hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
                    {publishing ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />上書き中…</> : <><Upload className="h-4 w-4" />{isRepublish ? "上書きする" : "出品する（トップに掲載）"}</>}
                  </button>
                  <p className="text-center text-[10px] text-gray-400">「URLだけ発行」はカテゴリ未選択でも利用できます</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ══════════ フッター ══════════ */}
      <footer className="border-t border-white/70 bg-white/50 px-4 py-6 text-center backdrop-blur-sm">
        <div className="mb-2 flex justify-center">
          <JisappLogo href="/" />
        </div>
        <p className="text-xs text-gray-400">個人開発ツールが集まるクリエイタープラットフォーム</p>
      </footer>

    </div>
  );
}
