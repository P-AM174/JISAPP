import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/api-auth';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { autoIcon, normalizeColor, validIcon } from '@/lib/apps/icon-catalog';
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, { params }: Context) {
  const { id } = await params;
  const db = createServerSupabaseClient();
  const { data: app } = await db.from('apps').select('id,title,description').eq('id',id).eq('status','active').maybeSingle();
  if (!app) return NextResponse.json({ error:'Not found' },{status:404});
  const { data } = await db.from('app_appearance').select('icon,color').eq('app_id',id).maybeSingle();
  // まだ選んでいないアプリは、アプリ名から選んだアイコンを返す（ホーム画面の画像と同じ）
  return NextResponse.json(data ? { icon: data.icon, color: normalizeColor(data.color) } : autoIcon(app.title ?? '', app.description ?? ''), { headers:{'Cache-Control':'no-store'} });
}
export async function PUT(request: Request, { params }: Context) {
  if (request.headers.get('origin') && request.headers.get('origin') !== new URL(request.url).origin) return new Response(null,{status:403});
  const { id } = await params;
  const body = await request.json().catch(()=>null);
  if (!body || !validIcon(body.icon,body.color)) return NextResponse.json({error:'Invalid icon or color'},{status:400});
  const db = createServerSupabaseClient();
  const userId = await getSessionUserId();
  // アイコンを変えられるのは、ログインしたアプリの持ち主だけ（ゲストのアプリは公開時に自動で選んだアイコンのまま。
  // ログインして引き継ぐと変えられる）
  if (!userId) return NextResponse.json({error:'Sign in to change the icon'},{status:401});
  const { data: app } = await db.from('apps').select('creator_id').eq('id',id).eq('status','active').maybeSingle();
  if (!app) return new Response(null,{status:404});
  if (app.creator_id !== userId) return new Response(null,{status:403});
  const { error } = await db.from('app_appearance').upsert({app_id:id,icon:body.icon,color:body.color,updated_at:new Date().toISOString()});
  if (error) return NextResponse.json({error:'Icon settings are temporarily unavailable'},{status:503});
  return NextResponse.json({ok:true});
}
