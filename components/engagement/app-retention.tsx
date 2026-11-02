"use client";
import { useEffect,useRef,useState } from 'react';
import { Palette, Smartphone, SquarePlus, X } from 'lucide-react';
import { useT } from '@/lib/i18n/client';
import { AddToHomeSteps,isStandalone } from '@/components/add-to-home-guide';
import { engagement } from '@/lib/analytics/engagement';
import { DEFAULT_ICON } from '@/lib/apps/icon-catalog';
import { HomeScreenPreview, IconPicker } from './icon-picker';
type InstallEvent = Event & { prompt:()=>Promise<void>;userChoice:Promise<{outcome:string}> };
export function AppRetention({appId,title,owner,enabled}:{appId:string;title:string;owner:boolean;enabled:boolean}) {
 const t=useT();const [visible,setVisible]=useState(false),[help,setHelp]=useState(false),[install,setInstall]=useState<InstallEvent|null>(null),[iconOpen,setIconOpen]=useState(false),[appearance,setAppearance]=useState(DEFAULT_ICON);const tracked=useRef('');
 useEffect(()=>{
  if(tracked.current!==appId){tracked.current=appId;engagement('app_open',appId,{owner,standalone:isStandalone()});
   if(isStandalone())engagement('standalone_open',appId,{owner});
   const u=new URL(window.location.href),sid=u.searchParams.get('share_id');
   if(sid&&/^[a-f0-9-]{36}$/.test(sid))engagement('shared_link_opened',appId,{shareId:sid,channel:u.searchParams.get('utm_source')??'unknown',owner});
  }
  if(enabled&&!isStandalone())try{const raw=JSON.parse(localStorage.getItem(`jisapp:nudge:${appId}`)??'{}');if((raw.count??0)<2&&Date.now()-(raw.at??0)>7*86400000){setVisible(true);engagement('home_shown',appId);}}catch{}
  const before=(e:Event)=>{e.preventDefault();setInstall(e as InstallEvent);};const done=()=>{engagement('home_installed',appId);setVisible(false);setInstall(null);};window.addEventListener('beforeinstallprompt',before);window.addEventListener('appinstalled',done);return()=>{window.removeEventListener('beforeinstallprompt',before);window.removeEventListener('appinstalled',done);};
 },[appId,owner,enabled]);
 // 案内を開いたときだけ、ホーム画面に並ぶアイコンを読み込んで見せる
 useEffect(()=>{if(!help)return;let alive=true;fetch(`/api/apps/${appId}/appearance`).then(r=>r.ok?r.json():null).then(v=>{if(alive&&v)setAppearance(v);}).catch(()=>{});return()=>{alive=false};},[help,appId]);
 function dismiss(){setVisible(false);try{const key=`jisapp:nudge:${appId}`,v=JSON.parse(localStorage.getItem(key)??'{}');localStorage.setItem(key,JSON.stringify({count:(v.count??0)+1,at:Date.now()}));}catch{}}
 async function add(){engagement('home_howto',appId);setHelp(true);if(install){engagement('home_prompt',appId);await install.prompt();const result=await install.userChoice;engagement('home_choice',appId,{outcome:result.outcome});setInstall(null);}}
 return <><div className="shrink-0">
  {visible&&<div className="flex items-center gap-2.5 border-t border-sky-100 bg-gradient-to-r from-sky-50 to-emerald-50 px-3 py-2 text-xs">
   <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-sky-600 shadow-sm ring-1 ring-sky-100"><Smartphone className="h-4 w-4"/></span>
   <span className="min-w-0 flex-1 font-semibold leading-snug text-sky-950">{t('ホーム画面に置くと、次からすぐ開けます','Add it to your home screen to open it quickly next time')}</span>
   <button type="button" onClick={()=>void add()} className="flex shrink-0 items-center gap-1 rounded-full bg-sky-600 px-3 py-1.5 font-bold text-white shadow-sm hover:bg-sky-700"><SquarePlus className="h-3.5 w-3.5"/>{t('追加する','Add')}</button>
   <button type="button" onClick={dismiss} aria-label={t('閉じる','Dismiss')} className="shrink-0 rounded-full p-1 text-sky-700 hover:bg-sky-100"><X className="h-3.5 w-3.5"/></button>
  </div>}
  {owner&&<div className="border-t border-slate-100 px-3 py-1.5">
   <button type="button" onClick={()=>setIconOpen(v=>!v)} aria-expanded={iconOpen} className="flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100"><Palette className="h-3.5 w-3.5 text-emerald-600"/>{t('アプリアイコンを設定','Set app icon')}</button>
   {iconOpen&&<div className="pb-2 pt-1"><IconPicker appId={appId} title={title} defaultOpen/></div>}
  </div>}
 </div>
 {help&&<div role="dialog" aria-modal="true" aria-label={t('ホーム画面に追加','Add to home screen')} className="fixed inset-0 z-[700] flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={()=>setHelp(false)}>
  <div className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl" onClick={e=>e.stopPropagation()}>
   <div className="flex items-start gap-3">
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-600"><SquarePlus className="h-5 w-5"/></span>
    <div className="min-w-0 flex-1"><p className="text-base font-black text-slate-900">{t('ホーム画面に追加する','Add to your home screen')}</p><p className="mt-0.5 text-xs leading-relaxed text-slate-500">{t('アプリのように、アイコンから1タップで開けます','Open it in one tap from an icon, like an app')}</p></div>
    <button type="button" onClick={()=>setHelp(false)} aria-label={t('閉じる','Close')} className="rounded-full bg-slate-100 p-1.5 text-slate-500 hover:bg-slate-200"><X className="h-4 w-4"/></button>
   </div>
   <div className="mt-4"><AddToHomeSteps preview={<div><p className="mb-1.5 text-[11px] font-bold text-slate-500">{t('ホーム画面にこう並びます','It will look like this')}</p><HomeScreenPreview icon={appearance.icon} color={appearance.color} title={title}/></div>}/></div>
   <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900">{t('端末内だけの保存データは起動方法によって共有されない場合があります。大切な記録はログインして同期してください。','Local-only data may not transfer between launch modes. Sign in to sync important records.')}</p>
   <button type="button" onClick={()=>setHelp(false)} className="mt-4 w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700">{t('わかった','Got it')}</button>
  </div>
 </div>}</>;
}
