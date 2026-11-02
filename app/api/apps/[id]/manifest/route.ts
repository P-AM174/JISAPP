import { NextResponse } from 'next/server';
import { getShareableAppSeo } from '@/lib/seo/public-apps';
import { localizePath } from '@/lib/i18n/config';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { autoIcon, iconColorHex } from '@/lib/apps/icon-catalog';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  const app=await getShareableAppSeo(id);
  if(!app)return new Response(null,{status:404});
  const db=createServerSupabaseClient();
  const {data:appearance}=await db.from('app_appearance').select('color,updated_at').eq('app_id',id).maybeSingle();
  const backgroundColor=iconColorHex(appearance?.color??autoIcon(app.title,app.description).color);
  const version=appearance?.updated_at?`&v=${encodeURIComponent(new Date(appearance.updated_at).getTime())}`:'';
  const locale=new URL(request.url).searchParams.get('locale')==='en'?'en':'ja';
  const path=localizePath(`/apps/${id}`,locale);
  return NextResponse.json({id:`/apps/${id}`,name:app.title,short_name:app.title.slice(0,24),start_url:`${path}?launch=home`,scope:path,display:'standalone',background_color:backgroundColor,theme_color:backgroundColor,icons:[192,512].flatMap(size=>(['any','maskable'] as const).map(purpose=>({src:`/api/apps/${id}/icon?size=${size}${version}`,sizes:`${size}x${size}`,type:'image/png',purpose})))},{headers:{'Content-Type':'application/manifest+json','Cache-Control':'no-cache'}});
}
