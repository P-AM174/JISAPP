import { ImageResponse } from 'next/og';
import { IconArt } from '@/lib/apps/icon-art';
import { DEFAULT_ICON } from '@/lib/apps/icon-catalog';
import { createServerSupabaseClient } from '@/lib/supabase-server';
export const runtime = 'nodejs';
export async function GET(request: Request, {params}: {params:Promise<{id:string}>}) {
  const {id}=await params;
  const db=createServerSupabaseClient();
  const {data:app}=await db.from('apps').select('id').eq('id',id).eq('status','active').maybeSingle();
  if(!app)return new Response(null,{status:404});
  const {data}=await db.from('app_appearance').select('icon,color').eq('app_id',id).maybeSingle();
  const appearance=data??DEFAULT_ICON;
  const query=new URL(request.url).searchParams;
  const requested=Number(query.get('size'));
  // 180: iPhone のホーム画面（apple-touch-icon）、192/512: Android などのマニフェスト
  const size=[180,192,512].includes(requested)?requested:512;
  // ?v=（保存した日時）が付いた URL は中身が変わらないので長く置いてよい。付いていない URL は短く
  const cache=query.get('v')?'public, max-age=31536000, immutable':'public, max-age=300';
  return new ImageResponse(<IconArt {...appearance} size={size} square />, {width:size,height:size,headers:{'Cache-Control':cache}});
}
