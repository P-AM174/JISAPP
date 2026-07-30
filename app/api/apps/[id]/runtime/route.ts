import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  getLibrarySnapshot,
  snapshotFromAppRow,
  upsertLibrarySnapshot,
  userHasInLibrary,
} from "@/lib/library/snapshots";
import { getPendingUpdate } from "@/lib/library/pending-updates";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerSupabaseClient();

  let userId: string | null = null;
  try {
    const session = await getServerSession(authOptions);
    userId = (session?.user as { id?: string })?.id ?? null;
  } catch {
    /* noop */
  }

  const { data: app, error } = await supabase
    .from("apps")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !app) {
    return NextResponse.json({ error: "アプリが見つかりません" }, { status: 404 });
  }

  if (app.admin_deleted) {
    return NextResponse.json(
      { error: "このアプリは運営により削除されました", reason: "admin_deleted" },
      { status: 410 }
    );
  }

  const inLibrary = userId ? await userHasInLibrary(supabase, userId, id) : false;

  if (app.status === "deleted" && !inLibrary) {
    return NextResponse.json({ error: "アプリが見つかりません" }, { status: 404 });
  }

  let pendingUpdate = null;
  if (inLibrary && userId) {
    pendingUpdate = await getPendingUpdate(supabase, userId, id);
  }

  const serveSnapshot = async () => {
    if (!userId) return null;
    let snap = await getLibrarySnapshot(supabase, userId, id);
    if (!snap) {
      await upsertLibrarySnapshot(supabase, userId, id, snapshotFromAppRow(app));
      snap = await getLibrarySnapshot(supabase, userId, id);
    }
    return snap;
  };

  if (app.status === "deleted" && inLibrary) {
    const snap = await serveSnapshot();
    if (!snap) {
      return NextResponse.json({ error: "アプリが見つかりません" }, { status: 404 });
    }
    return NextResponse.json({
      app: {
        id,
        title: snap.title,
        description: snap.description,
        html_code: snap.html_code,
        css_code: snap.css_code,
        js_code: snap.js_code,
        category: snap.category,
        creator_name: app.creator_name,
        creator_id: app.creator_id,
        is_listed: false,
        code_public: app.code_public,
        status: "deleted",
        code_version: snap.code_version,
      },
      source: "snapshot",
      inLibrary: true,
      creatorRemoved: true,
      pendingUpdate,
    });
  }

  if (app.status !== "active") {
    return NextResponse.json({ error: "アプリが見つかりません" }, { status: 404 });
  }

  if (inLibrary && pendingUpdate && userId) {
    const snap = await serveSnapshot();
    if (snap) {
      return NextResponse.json({
        app: {
          id,
          title: snap.title,
          description: snap.description ?? app.description,
          html_code: snap.html_code,
          css_code: snap.css_code,
          js_code: snap.js_code,
          category: snap.category ?? app.category,
          creator_name: app.creator_name,
          creator_id: app.creator_id,
          is_listed: app.is_listed,
          code_public: app.code_public,
          status: app.status,
          code_version: snap.code_version,
        },
        source: "snapshot",
        inLibrary: true,
        creatorRemoved: false,
        pendingUpdate,
      });
    }
  }

  return NextResponse.json({
    app: {
      id: app.id,
      title: app.title,
      description: app.description,
      html_code: app.html_code,
      css_code: app.css_code,
      js_code: app.js_code,
      category: app.category,
      creator_name: app.creator_name,
      creator_id: app.creator_id,
      is_listed: app.is_listed,
      code_public: app.code_public,
      status: app.status,
      code_version: app.code_version ?? 1,
    },
    source: "live",
    inLibrary,
    creatorRemoved: false,
    pendingUpdate,
  });
}
