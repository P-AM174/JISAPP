"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { JisappLogo } from "@/components/jisapp-logo";
import {
  Sparkles,
  Terminal,
  Plus,
  Wrench,
  Rocket,
  Clock,
  Code2,
  FileText,
  Star,
  Search,
  Package,
  FolderOpen,
  ArrowRight,
  MoreHorizontal,
  Trash2,
  ShoppingBag,
  CheckCircle2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORIES, CATEGORY_MAP } from "@/lib/categories";

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
};

function getPlaygroundHref(proj: Project) {
  if (proj.id === "saved_playground") return "/playground?load=1";
  return `/playground?project=${proj.id}`;
}

function mapServerProject(row: {
  id: string;
  title: string;
  description: string | null;
  html_code: string | null;
  app_id: string | null;
  status: string;
  is_listed: boolean;
  category: string | null;
  updated_at: string;
}): Project {
  const code = row.html_code ?? "";
  const status = row.status as Project["status"];
  const meta = {
    draft:    { tag: "作業中",   tagColor: "bg-violet-100 text-violet-700",  gradient: "from-violet-500 to-purple-600" },
    listed:   { tag: "公開中",   tagColor: "bg-emerald-100 text-emerald-700", gradient: "from-emerald-500 to-teal-600" },
    url_only: { tag: "URL発行済", tagColor: "bg-blue-100 text-blue-700",     gradient: "from-blue-500 to-indigo-600" },
  }[status ?? "draft"] ?? { tag: "作業中", tagColor: "bg-violet-100 text-violet-700", gradient: "from-violet-500 to-purple-600" };

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? (status === "draft" ? "コードプレイグラウンドで保存したプロジェクトです。" : "出品・URL発行したアプリです。"),
    updatedAt: new Date(row.updated_at).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" }),
    lines: code ? code.split("\n").length : 0,
    chars: code.length,
    gradient: meta.gradient,
    tag: meta.tag,
    tagColor: meta.tagColor,
    appId: row.app_id ?? undefined,
    url: row.app_id ? `${origin}/apps/${row.app_id}` : undefined,
    status,
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
function ProjectCard({ proj, onDelete, onPublish }: { proj: Project; onDelete?: (id: string) => void; onPublish?: (proj: Project) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-emerald-200">

      {/* グラデーションヘッダー */}
      <div className={`h-24 bg-gradient-to-br ${proj.gradient} relative flex items-end px-4 pb-3`}>
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm border border-white/30">
            <Code2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="rounded-full bg-white/25 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
              {proj.tag}
            </span>
          </div>
        </div>

        {/* 3点メニュー */}
        <div className="absolute right-3 top-3">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm hover:bg-white/30 transition-colors"
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
                  <Rocket className="h-3.5 w-3.5" />
                  出品 / URL発行
                </button>
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
        </div>

        {/* アクションボタン */}
        <div className="mt-auto flex gap-2 pt-1">
          <Link
            href={getPlaygroundHref(proj)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gray-100 py-2 text-xs font-bold text-gray-700 transition-all hover:bg-emerald-100 hover:text-emerald-700 active:scale-[0.98]"
          >
            <Wrench className="h-3.5 w-3.5" />
            🛠️ 編集する
          </Link>
          <button
            onClick={() => onPublish?.(proj)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white shadow-sm shadow-emerald-200 transition-all hover:bg-emerald-700 active:scale-[0.98]"
          >
            <Rocket className="h-3.5 w-3.5" />
            出品 / URL発行
          </button>
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
          {app.rating && (
            <span className="flex items-center gap-0.5">
              <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
              {app.rating}
            </span>
          )}
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
    <div className="flex flex-col items-center gap-4 rounded-3xl bg-white py-16 text-center shadow-sm ring-1 ring-black/5">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
        {tab === "mine"
          ? <Code2 className="h-8 w-8 text-emerald-300" />
          : <Package className="h-8 w-8 text-emerald-300" />}
      </div>
      <div>
        <p className="font-bold text-gray-700">
          {tab === "mine" ? "まだプロジェクトがありません" : "まだGETしたアプリがありません"}
        </p>
        <p className="mt-1 text-xs text-gray-400">
          {tab === "mine"
            ? "プレイグラウンドでコードを作って保存してみよう"
            : "トップページからアプリをGETしてライブラリに追加しよう"}
        </p>
      </div>
      <Link
        href={tab === "mine" ? "/playground" : "/"}
        className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-[0.97]"
      >
        {tab === "mine"
          ? <><Terminal className="h-4 w-4" /> プレイグラウンドを開く</>
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
  const [publishing, setPublishing]           = useState(false);
  const [publishedUrl, setPublishedUrl]       = useState<string | null>(null);
  const [urlCopied, setUrlCopied]             = useState(false);
  const [publishError, setPublishError]       = useState<string | null>(null);

  // 編集モード
  const [editMode, setEditMode]     = useState(false);
  const [saving, setSaving]         = useState(false);
  const [saveError, setSaveError]   = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

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

    if (proj.appId && proj.url) {
      setPublishedUrl(proj.url);
      setPublishTitle(proj.title);
      setPublishDesc(proj.description ?? "");
      setPublishCategory("");
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
        setPublishDesc("");
        setPublishCategory("");
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
      setPublishError("コードが見つかりません。プレイグラウンドでコードを保存してから出品してください。");
      return;
    }

    setPublishing(true);
    setPublishError(null);
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
          project_id: publishTarget.id !== "saved_playground" ? publishTarget.id : undefined,
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
        body: JSON.stringify({ title, description: publishDesc.trim() || null, category: publishCategory || null }),
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
          const savedTitle = localStorage.getItem("jisapp_playground_title") ?? "プレイグラウンドの作業中コード";
          const savedProject: Project = {
            id: "saved_playground",
            title: savedTitle,
            description: "コードプレイグラウンドで保存したコードです。「編集する」からそのまま続きを開発できます。",
            updatedAt: new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" }),
            lines,
            chars,
            gradient: "from-violet-500 to-purple-600",
            tag: "作業中",
            tagColor: "bg-violet-100 text-violet-700",
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
    if (id === "saved_playground") {
      try { localStorage.removeItem("jisapp_playground_code"); } catch { /* noop */ }
    } else {
      try { await fetch(`/api/my-projects/${id}`, { method: "DELETE" }); } catch { /* noop */ }
    }
    try {
      const deleted: string[] = JSON.parse(localStorage.getItem("jisapp_deleted_projects") ?? "[]");
      if (!deleted.includes(id)) {
        localStorage.setItem("jisapp_deleted_projects", JSON.stringify([...deleted, id]));
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
    <div className="min-h-screen bg-emerald-50/40">

      {/* ══════════ ヘッダー ══════════ */}
      <header className="sticky top-0 z-40 border-b border-emerald-200 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">

          <BackButton label="戻る" hideLabelOnMobile />

          <JisappLogo href="/" />
          <span className="text-sm text-gray-400">/</span>

          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 shadow-sm">
              <FolderOpen className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-base font-black text-gray-900">マイプロジェクト</h1>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/playground"
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-md shadow-emerald-200 transition-all hover:bg-emerald-700 active:scale-[0.97]"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">新規プロジェクト作成</span>
              <span className="sm:hidden">新規</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">

        {/* ══════════ ヒーローバナー ══════════ */}
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-6 text-white shadow-lg shadow-emerald-700/30">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300">
                コードプレイグラウンド
              </p>
              <h2 className="mt-1 text-xl font-black">
                あなたのコードが集まる場所 ✨
              </h2>
              <p className="mt-1 text-sm text-emerald-200 leading-relaxed">
                作ったツールをそのままジサップに出品しよう。
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2">
              <Link
                href="/playground"
                className="flex items-center gap-2 rounded-xl bg-white/10 border border-white/20 px-4 py-2.5 text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20 active:scale-[0.97]"
              >
                <Terminal className="h-4 w-4" />
                エディタを開く
              </Link>
            </div>
          </div>

          {/* 統計 */}
          {mounted && (
            <div className="mt-5 flex flex-wrap gap-5 border-t border-white/20 pt-4">
              <div>
                <p className="text-2xl font-black">{myProjects.length}</p>
                <p className="text-xs text-emerald-300">マイプロジェクト</p>
              </div>
              <div>
                <p className="text-2xl font-black">{acquiredApps.length}</p>
                <p className="text-xs text-emerald-300">GETしたアプリ</p>
              </div>
              <div>
                <p className="text-2xl font-black">
                  {myProjects.reduce((s, p) => s + p.lines, 0).toLocaleString()}
                </p>
                <p className="text-xs text-emerald-300">総コード行数</p>
              </div>
            </div>
          )}
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
        <div className="flex gap-1 rounded-2xl bg-gray-100 p-1">
          {([
            { id: "mine",     label: "🛠️ 自分が作ったツール",     count: myProjects.length    },
            { id: "acquired", label: "📦 ジサップでGETしたツール", count: acquiredApps.length  },
          ] as { id: "mine" | "acquired"; label: string; count: number }[]).map((t) => (
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
                <div className="flex items-start gap-3 rounded-2xl bg-blue-50 px-4 py-3 ring-1 ring-blue-100">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                  <p className="text-xs leading-relaxed text-blue-700">
                    💡 プレイグラウンドで保存したコードはここに表示されます。「🚀 出品する」を押すとジサップのマーケットに無料で公開できます。
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredProjects.map((proj) => (
                    <ProjectCard key={proj.id} proj={proj} onDelete={handleDeleteProject} onPublish={openPublishModal} />
                  ))}

                  {/* 新規作成カード */}
                  <Link
                    href="/playground"
                    className="group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-emerald-300 bg-white py-10 text-center transition-all hover:border-emerald-400 hover:bg-emerald-50/50 hover:-translate-y-0.5"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 transition-colors group-hover:bg-emerald-200">
                      <Plus className="h-7 w-7 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-emerald-700">新規プロジェクトを作成</p>
                      <p className="mt-0.5 text-xs text-gray-400">プレイグラウンドが開きます</p>
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
                <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-100">
                  <Package className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <p className="text-xs leading-relaxed text-emerald-700">
                    📦 ジサップでGETしたアプリの一覧です。カードをタップすると詳細ページでソースコードを確認できます。
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
      {publishTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">

            {publishedUrl && !editMode ? (
              /* ─ URL確認画面（出品済み） ─ */
              <>
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                  <h3 className="text-base font-black text-gray-900">📋 出品情報</h3>
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
                      <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", CATEGORY_MAP[publishCategory].tagColor)}>
                        {CATEGORY_MAP[publishCategory].emoji} {CATEGORY_MAP[publishCategory].name}
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
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 ring-1 ring-emerald-200">
                      <span className="flex-1 break-all font-mono text-[11px] text-emerald-700">{publishedUrl}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <button
                        onClick={async () => { await navigator.clipboard.writeText(publishedUrl); setUrlCopied(true); setTimeout(() => setUrlCopied(false), 2000); }}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition-all"
                      >
                        {urlCopied ? "✅ コピー済み" : "🔗 URLをコピー"}
                      </button>
                      <button
                        onClick={() => router.push(publishedUrl.replace(window.location.origin, ""))}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gray-100 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-200 transition-all"
                      >
                        アプリを開く →
                      </button>
                    </div>
                    <button
                      onClick={() => { setEditMode(true); setSaveSuccess(false); }}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all"
                    >
                      ✏️ 出品情報を編集する
                    </button>
                  </div>
                  <button onClick={() => setPublishTarget(null)} className="text-center text-[10px] text-gray-400 hover:text-gray-600 transition-colors">閉じる</button>
                </div>
              </>

            ) : publishedUrl && editMode ? (
              /* ─ 編集画面 ─ */
              <>
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                  <h3 className="text-base font-black text-gray-900">✏️ 出品情報を編集</h3>
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
                          className={cn("rounded-full px-3 py-1.5 text-xs font-bold transition-all",
                            publishCategory === cat.id ? "bg-emerald-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700"
                          )}>
                          {cat.emoji} {cat.name}
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
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-md shadow-emerald-200 hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50"
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
                  <h3 className="text-base font-black text-gray-900">🚀 アプリを出品する</h3>
                  <button onClick={() => setPublishTarget(null)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
                <div className="flex flex-col gap-4 p-6">
                  {publishTarget.isDemo && (
                    <div className="rounded-2xl bg-amber-50 px-4 py-3 ring-1 ring-amber-200">
                      <p className="text-xs text-amber-700">⚠️ このプロジェクトはデモデータです。プレイグラウンドで実際にコードを作成・保存してから出品してください。</p>
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
                          className={cn("rounded-full px-3 py-1.5 text-xs font-bold transition-all",
                            publishCategory === cat.id ? "bg-emerald-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700"
                          )}>
                          {cat.emoji} {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700">説明（任意）</label>
                    <textarea value={publishDesc} onChange={(e) => setPublishDesc(e.target.value)} placeholder="アプリの使い方や特徴を簡単に説明..." rows={3}
                      className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20" />
                  </div>
                  {publishError && (
                    <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-xs text-rose-600 ring-1 ring-rose-200">{publishError}</p>
                  )}
                  <button onClick={() => handlePublish(false)} disabled={publishing || publishTarget.isDemo || !publishTitle.trim()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white py-3 text-sm font-bold text-gray-700 transition-all hover:bg-gray-50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
                    {publishing ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />処理中…</> : <><CheckCircle2 className="h-4 w-4 text-gray-500" />URLだけ発行する（非公開）</>}
                  </button>
                  <button onClick={() => handlePublish(true)} disabled={publishing || publishTarget.isDemo || !publishTitle.trim() || !publishCategory}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-md shadow-emerald-200 transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
                    {publishing ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />出品中…</> : <><Rocket className="h-4 w-4" />出品する（トップに掲載）</>}
                  </button>
                  <p className="text-center text-[10px] text-gray-400">「URLだけ発行」はカテゴリ未選択でも利用できます</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ══════════ フッター ══════════ */}
      <footer className="border-t border-gray-100 bg-white px-4 py-6 text-center">
        <div className="mb-2 flex justify-center">
          <JisappLogo href="/" />
        </div>
        <p className="text-xs text-gray-400">個人開発ツールが集まるクリエイタープラットフォーム</p>
      </footer>

    </div>
  );
}
