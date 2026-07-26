"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Lock,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { JisappLogo } from "@/components/jisapp-logo";
import { HeroSlideRenderer } from "@/components/home/hero/hero-slide-renderer";
import { EMPTY_SLIDE_INPUT } from "@/lib/hero/defaults";
import {
  HERO_LAYOUT_LABELS,
  HERO_THEME_STYLES,
  HERO_VISUAL_LABELS,
} from "@/lib/hero/themes";
import type { HeroLayout, HeroSlide, HeroSlideInput, HeroTheme, HeroVisual, HeroBgPattern } from "@/lib/hero/types";

type EditableSlide = HeroSlideInput & { id?: string; _key: string };

function toEditable(slide: HeroSlide): EditableSlide {
  return {
    _key: slide.id,
    id: slide.id.startsWith("default-") ? undefined : slide.id,
    sortOrder: slide.sortOrder,
    enabled: slide.enabled,
    badge: slide.badge ?? "",
    title: slide.title,
    subtitle: slide.subtitle,
    ctaEnabled: slide.ctaEnabled,
    ctaLabel: slide.ctaLabel ?? "",
    ctaHref: slide.ctaHref ?? "",
    layout: slide.layout,
    theme: slide.theme,
    visualType: slide.visualType,
    bgPattern: slide.bgPattern,
    featuredAppIds: slide.featuredAppIds ?? [],
  };
}

function toInput(slide: EditableSlide, sortOrder: number): HeroSlideInput {
  return {
    id: slide.id,
    sortOrder,
    enabled: slide.enabled,
    badge: slide.badge || null,
    title: slide.title,
    subtitle: slide.subtitle,
    ctaEnabled: slide.ctaEnabled,
    ctaLabel: slide.ctaEnabled ? slide.ctaLabel || null : null,
    ctaHref: slide.ctaEnabled ? slide.ctaHref || null : null,
    layout: slide.layout,
    theme: slide.theme,
    visualType: slide.visualType,
    bgPattern: slide.bgPattern,
    featuredAppIds: slide.featuredAppIds.filter(Boolean),
  };
}

function toPreviewSlide(slide: EditableSlide): HeroSlide & { featuredApps?: never } {
  return {
    id: slide._key,
    sortOrder: slide.sortOrder,
    enabled: slide.enabled,
    badge: slide.badge || null,
    title: slide.title || "（タイトル未入力）",
    subtitle: slide.subtitle || "（サブタイトル未入力）",
    ctaEnabled: slide.ctaEnabled,
    ctaLabel: slide.ctaLabel || null,
    ctaHref: slide.ctaHref || null,
    layout: slide.layout,
    theme: slide.theme,
    visualType: slide.visualType,
    bgPattern: slide.bgPattern,
    featuredAppIds: slide.featuredAppIds,
  };
}

export default function AdminHeroPage() {
  const [authed, setAuthed] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [slides, setSlides] = useState<EditableSlide[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [appSearch, setAppSearch] = useState("");
  const [appResults, setAppResults] = useState<{ id: string; title: string; category: string | null }[]>([]);

  const selected = useMemo(
    () => slides.find((s) => s._key === selectedKey) ?? null,
    [slides, selectedKey]
  );

  const notify = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(""), 4000);
  };

  const loadSlides = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/hero");
      if (res.status === 401) {
        setAuthed(false);
        return;
      }
      const data = await res.json();
      const list = (data.slides as HeroSlide[]).map(toEditable);
      setSlides(list);
      if (!selectedKey && list[0]) setSelectedKey(list[0]._key);
      setAuthed(true);
    } catch {
      notify("読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }, [selectedKey]);

  useEffect(() => {
    loadSlides();
  }, [loadSlides]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pwInput }),
    });
    if (res.ok) {
      setAuthed(true);
      setPwError(false);
      await loadSlides();
    } else {
      setPwError(true);
      setPwInput("");
    }
  };

  const updateSelected = (patch: Partial<EditableSlide>) => {
    if (!selectedKey) return;
    setSlides((prev) =>
      prev.map((s) => (s._key === selectedKey ? { ...s, ...patch } : s))
    );
  };

  const moveSlide = (key: string, dir: -1 | 1) => {
    setSlides((prev) => {
      const idx = prev.findIndex((s) => s._key === key);
      if (idx < 0) return prev;
      const next = idx + dir;
      if (next < 0 || next >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[next]] = [copy[next], copy[idx]];
      return copy;
    });
  };

  const addSlide = () => {
    const key = `new-${Date.now()}`;
    const slide: EditableSlide = {
      ...EMPTY_SLIDE_INPUT,
      _key: key,
      title: "新しいスライド",
      subtitle: "サブタイトルを入力してください",
      badge: "新着",
      visualType: "studio",
      bgPattern: "grid",
    };
    setSlides((prev) => [...prev, slide]);
    setSelectedKey(key);
  };

  const removeSlide = (key: string) => {
    if (!confirm("このスライドを削除しますか？")) return;
    setSlides((prev) => {
      const next = prev.filter((s) => s._key !== key);
      if (selectedKey === key) setSelectedKey(next[0]?._key ?? null);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = slides.map((s, i) => toInput(s, i));
      const res = await fetch("/api/admin/hero", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slides: payload }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "保存に失敗しました");
        return;
      }
      const list = (data.slides as HeroSlide[]).map(toEditable);
      setSlides(list);
      if (selectedKey) {
        const idx = slides.findIndex((s) => s._key === selectedKey);
        if (list[idx]) setSelectedKey(list[idx]._key);
        else if (list[0]) setSelectedKey(list[0]._key);
      }
      notify("保存しました。トップページに反映されます。");
    } catch {
      alert("ネットワークエラー");
    } finally {
      setSaving(false);
    }
  };

  const searchApps = async () => {
    if (!appSearch.trim()) return;
    const res = await fetch("/api/admin/hero", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: appSearch }),
    });
    const data = await res.json();
    setAppResults(data.apps ?? []);
  };

  const addFeaturedApp = (id: string) => {
    if (!selected) return;
    if (selected.featuredAppIds.includes(id)) return;
    if (selected.featuredAppIds.length >= 3) {
      alert("最大3件までです");
      return;
    }
    updateSelected({ featuredAppIds: [...selected.featuredAppIds, id] });
  };

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f6f4] p-4">
        <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl ring-1 ring-black/5">
          <div className="mb-6 flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-md">
              <Lock className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-gray-900">ヒーロー編集</h1>
              <p className="mt-0.5 text-xs text-gray-400">管理者パスワードでログイン</p>
            </div>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={pwInput}
                onChange={(e) => { setPwInput(e.target.value); setPwError(false); }}
                placeholder="管理者パスワード"
                className={`w-full rounded-2xl border px-4 py-3 pr-10 text-sm outline-none ${
                  pwError ? "border-rose-300 bg-rose-50" : "border-gray-200 bg-gray-50"
                }`}
              />
              <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {pwError && <p className="text-xs font-semibold text-rose-500">パスワードが正しくありません</p>}
            <button type="submit" className="w-full rounded-2xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700">
              ログイン
            </button>
          </form>
          <Link href="/admin/review" className="mt-4 block text-center text-xs text-gray-400 hover:text-emerald-600">
            ← 運営管理に戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f4f2]">
      <header className="sticky top-0 z-50 border-b border-emerald-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
          <JisappLogo href="/" />
          <span className="text-gray-300">/</span>
          <span className="text-sm font-bold text-gray-700">ヒーロー編集</span>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/admin/review" className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:border-emerald-300 hover:text-emerald-600">
              運営管理
            </Link>
            <button onClick={loadSlides} className="flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:border-emerald-300 hover:text-emerald-600">
              <RefreshCw className="h-3 w-3" />更新
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? "保存中..." : "保存して公開"}
            </button>
          </div>
        </div>
      </header>

      {msg && (
        <div className="fixed top-20 left-1/2 z-[600] -translate-x-1/2 rounded-2xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white shadow-2xl">
          {msg}
        </div>
      )}

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-black text-gray-900">スライド一覧</h2>
            <button onClick={addSlide} className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100">
              <Plus className="h-3.5 w-3.5" />追加
            </button>
          </div>
          {loading ? (
            <p className="py-8 text-center text-xs text-gray-400">読み込み中...</p>
          ) : (
            <div className="space-y-2">
              {slides.map((slide, i) => (
                <div
                  key={slide._key}
                  className={`rounded-xl border p-3 transition-colors ${
                    selectedKey === slide._key ? "border-emerald-400 bg-emerald-50/50" : "border-gray-100 hover:bg-gray-50"
                  }`}
                >
                  <button type="button" onClick={() => setSelectedKey(slide._key)} className="w-full text-left">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${slide.enabled ? "bg-emerald-500" : "bg-gray-300"}`} />
                      <span className="line-clamp-1 flex-1 text-sm font-bold text-gray-800">{slide.title || "（無題）"}</span>
                    </div>
                    <p className="mt-1 text-[10px] text-gray-400">
                      {HERO_LAYOUT_LABELS[slide.layout]} · {HERO_THEME_STYLES[slide.theme].label}
                    </p>
                  </button>
                  <div className="mt-2 flex items-center gap-1">
                    <button type="button" onClick={() => moveSlide(slide._key, -1)} disabled={i === 0} className="rounded p-1 text-gray-400 hover:bg-gray-100 disabled:opacity-30">
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => moveSlide(slide._key, 1)} disabled={i === slides.length - 1} className="rounded p-1 text-gray-400 hover:bg-gray-100 disabled:opacity-30">
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSlides((prev) =>
                          prev.map((s) =>
                            s._key === slide._key ? { ...s, enabled: !s.enabled } : s
                          )
                        )
                      }
                      className="ml-auto rounded px-2 py-0.5 text-[10px] font-bold text-gray-500 hover:bg-gray-100"
                    >
                      {slide.enabled ? "ON" : "OFF"}
                    </button>
                    <button type="button" onClick={() => removeSlide(slide._key)} className="rounded p-1 text-rose-400 hover:bg-rose-50">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>

        <div className="space-y-6">
          {selected ? (
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-black text-gray-900">スライド編集</h2>
                <button
                  onClick={() => setShowPreview(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 hover:border-emerald-300 hover:text-emerald-600"
                >
                  <Eye className="h-3.5 w-3.5" />プレビュー
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="text-xs font-bold text-gray-600">レイアウト</span>
                  <select
                    value={selected.layout}
                    onChange={(e) => updateSelected({ layout: e.target.value as HeroLayout })}
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  >
                    {(Object.keys(HERO_LAYOUT_LABELS) as HeroLayout[]).map((k) => (
                      <option key={k} value={k}>{HERO_LAYOUT_LABELS[k]}</option>
                    ))}
                  </select>
                </label>

                <label className="block sm:col-span-2">
                  <span className="text-xs font-bold text-gray-600">表示</span>
                  <label className="mt-1 flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={selected.enabled} onChange={(e) => updateSelected({ enabled: e.target.checked })} />
                    トップに表示する
                  </label>
                </label>

                <label className="block sm:col-span-2">
                  <span className="text-xs font-bold text-gray-600">バッジ</span>
                  <input value={selected.badge ?? ""} onChange={(e) => updateSelected({ badge: e.target.value })} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" placeholder="例: ジサップ 開発スタジオ" />
                </label>

                <label className="block sm:col-span-2">
                  <span className="text-xs font-bold text-gray-600">タイトル *</span>
                  <input value={selected.title} onChange={(e) => updateSelected({ title: e.target.value })} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
                </label>

                <label className="block sm:col-span-2">
                  <span className="text-xs font-bold text-gray-600">サブタイトル *</span>
                  <textarea value={selected.subtitle} onChange={(e) => updateSelected({ subtitle: e.target.value })} rows={3} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
                </label>

                <label className="block sm:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-600">
                    <input type="checkbox" checked={selected.ctaEnabled} onChange={(e) => updateSelected({ ctaEnabled: e.target.checked })} />
                    CTAボタンを表示
                  </label>
                </label>

                {selected.ctaEnabled && (
                  <>
                    <label className="block">
                      <span className="text-xs font-bold text-gray-600">CTA文言</span>
                      <input value={selected.ctaLabel ?? ""} onChange={(e) => updateSelected({ ctaLabel: e.target.value })} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
                    </label>
                    <label className="block">
                      <span className="text-xs font-bold text-gray-600">CTAリンク</span>
                      <input value={selected.ctaHref ?? ""} onChange={(e) => updateSelected({ ctaHref: e.target.value })} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" placeholder="/playground" />
                    </label>
                  </>
                )}

                <label className="block sm:col-span-2">
                  <span className="text-xs font-bold text-gray-600">テーマ色</span>
                  <select value={selected.theme} onChange={(e) => updateSelected({ theme: e.target.value as HeroTheme })} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm">
                    {(Object.keys(HERO_THEME_STYLES) as HeroTheme[]).map((k) => (
                      <option key={k} value={k}>{HERO_THEME_STYLES[k].label}</option>
                    ))}
                  </select>
                </label>

                {(selected.layout === "two_column" || selected.layout === "theme") && (
                  <label className="block">
                    <span className="text-xs font-bold text-gray-600">右ビジュアル</span>
                    <select value={selected.visualType ?? "none"} onChange={(e) => updateSelected({ visualType: e.target.value as HeroVisual })} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm">
                      {(Object.keys(HERO_VISUAL_LABELS) as HeroVisual[]).map((k) => (
                        <option key={k} value={k}>{HERO_VISUAL_LABELS[k]}</option>
                      ))}
                    </select>
                  </label>
                )}

                {selected.layout === "theme" && (
                  <label className="block">
                    <span className="text-xs font-bold text-gray-600">背景パターン</span>
                    <select value={selected.bgPattern ?? "none"} onChange={(e) => updateSelected({ bgPattern: e.target.value as HeroBgPattern })} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm">
                      <option value="grid">グリッド</option>
                      <option value="dots">ドット</option>
                      <option value="none">なし</option>
                    </select>
                  </label>
                )}

                {selected.layout === "card" && (
                  <div className="sm:col-span-2 space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs font-bold text-gray-600">表示アプリ（最大3件・空なら人気アプリ自動）</p>
                    <div className="flex flex-wrap gap-2">
                      {selected.featuredAppIds.map((id) => (
                        <span key={id} className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[10px] font-mono ring-1 ring-gray-200">
                          {id.slice(0, 8)}…
                          <button type="button" onClick={() => updateSelected({ featuredAppIds: selected.featuredAppIds.filter((x) => x !== id) })} className="text-rose-400"><X className="h-3 w-3" /></button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input value={appSearch} onChange={(e) => setAppSearch(e.target.value)} placeholder="アプリ名で検索" className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm" />
                      <button type="button" onClick={searchApps} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white">検索</button>
                    </div>
                    <div className="space-y-1">
                      {appResults.map((app) => (
                        <button key={app.id} type="button" onClick={() => addFeaturedApp(app.id)} className="flex w-full items-center justify-between rounded-lg bg-white px-3 py-2 text-left text-xs hover:bg-emerald-50">
                          <span className="font-semibold text-gray-800">{app.title}</span>
                          <span className="font-mono text-[10px] text-gray-400">{app.id.slice(0, 8)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-10 text-center text-sm text-gray-400 shadow-sm">スライドを選択してください</div>
          )}

          <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 p-4 text-xs text-emerald-800">
            <p className="font-bold">使い方</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-emerald-700/90">
              <li>編集後は「保存して公開」でトップに反映されます</li>
              <li>レイアウト: 2カラム（訴求）、カード型（アプリ紹介）、テーマ型（キャンペーン）</li>
              <li>Supabase に <code className="rounded bg-white px-1">hero_slides</code> テーブルが必要です（scripts/create-hero-slides.sql）</li>
            </ul>
          </div>
        </div>
      </main>

      {showPreview && selected && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowPreview(false)}>
          <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b px-4 py-3">
              <p className="text-sm font-bold text-gray-800">プレビュー</p>
              <button onClick={() => setShowPreview(false)} className="rounded-full p-1 hover:bg-gray-100"><X className="h-4 w-4" /></button>
            </div>
            <div className="max-h-[calc(90vh-52px)] overflow-y-auto">
              <HeroSlideRenderer slide={toPreviewSlide(selected)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
