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
  const size=new URL(request.url).searchParams.get('size')==='192'?192:512;
  return new ImageResponse(<IconArt {...appearance} size={size} square />, {width:size,height:size,headers:{'Cache-Control':'public, max-age=300'}});
}
