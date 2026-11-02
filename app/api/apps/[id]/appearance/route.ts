import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/api-auth';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { hashClaimToken } from '@/lib/apps/claim';
import { DEFAULT_ICON, validIcon } from '@/lib/apps/icon-catalog';
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, { params }: Context) {
  const { id } = await params;
  const db = createServerSupabaseClient();
  const { data: app } = await db.from('apps').select('id').eq('id',id).eq('status','active').maybeSingle();
  if (!app) return NextResponse.json({ error:'Not found' },{status:404});
  const { data } = await db.from('app_appearance').select('icon,color').eq('app_id',id).maybeSingle();
  return NextResponse.json(data ?? DEFAULT_ICON, { headers:{'Cache-Control':'no-store'} });
}
export async function PUT(request: Request, { params }: Context) {
  if (request.headers.get('origin') && request.headers.get('origin') !== new URL(request.url).origin) return new Response(null,{status:403});
  const { id } = await params;
  const body = await request.json().catch(()=>null);
  if (!body || !validIcon(body.icon,body.color)) return NextResponse.json({error:'Invalid icon or color'},{status:400});
  const db = createServerSupabaseClient();
  const userId = await getSessionUserId();
  const { data: app } = await db.from('apps').select('creator_id,claim_token_hash').eq('id',id).eq('status','active').maybeSingle();
  if (!app) return new Response(null,{status:404});
  const owner = !!userId && app.creator_id === userId;
  const guest = !app.creator_id && typeof body.claimToken === 'string' && body.claimToken.length <= 128 && !!app.claim_token_hash && hashClaimToken(body.claimToken) === app.claim_token_hash;
  if (!owner && !guest) return new Response(null,{status:403});
  const { error } = await db.from('app_appearance').upsert({app_id:id,icon:body.icon,color:body.color,updated_at:new Date().toISOString()});
  if (error) return NextResponse.json({error:'Icon settings are temporarily unavailable'},{status:503});
  return NextResponse.json({ok:true});
}
