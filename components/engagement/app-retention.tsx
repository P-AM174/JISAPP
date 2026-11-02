"use client";
import { useEffect,useRef,useState } from 'react';
import { useT } from '@/lib/i18n/client';
import { AddToHomeSteps,isStandalone } from '@/components/add-to-home-guide';
import { engagement } from '@/lib/analytics/engagement';
import { IconPicker } from './icon-picker';
type InstallEvent = Event & { prompt:()=>Promise<void>;userChoice:Promise<{outcome:string}> };
export function AppRetention({appId,title,owner,enabled}:{appId:string;title:string;owner:boolean;enabled:boolean}) {
 const t=useT();const [visible,setVisible]=useState(false),[help,setHelp]=useState(false),[install,setInstall]=useState<InstallEvent|null>(null);const tracked=useRef('');
 useEffect(()=>{
  if(tracked.current!==appId){tracked.current=appId;engagement('app_open',appId,{owner,standalone:isStandalone()});
   if(isStandalone())engagement('standalone_open',appId,{owner});
   const u=new URL(window.location.href),sid=u.searchParams.get('share_id');
   if(sid&&/^[a-f0-9-]{36}$/.test(sid))engagement('shared_link_opened',appId,{shareId:sid,channel:u.searchParams.get('utm_source')??'unknown',owner});
  }
  if(enabled&&!isStandalone())try{const raw=JSON.parse(localStorage.getItem(`jisapp:nudge:${appId}`)??'{}');if((raw.count??0)<2&&Date.now()-(raw.at??0)>7*86400000){setVisible(true);engagement('home_shown',appId);}}catch{}
  const before=(e:Event)=>{e.preventDefault();setInstall(e as InstallEvent);};const done=()=>{engagement('home_installed',appId);setVisible(false);setInstall(null);};window.addEventListener('beforeinstallprompt',before);window.addEventListener('appinstalled',done);return()=>{window.removeEventListener('beforeinstallprompt',before);window.removeEventListener('appinstalled',done);};
 },[appId,owner,enabled]);
 function dismiss(){setVisible(false);try{const key=`jisapp:nudge:${appId}`,v=JSON.parse(localStorage.getItem(key)??'{}');localStorage.setItem(key,JSON.stringify({count:(v.count??0)+1,at:Date.now()}));}catch{}}
 async function add(){engagement('home_howto',appId);setHelp(true);if(install){engagement('home_prompt',appId);await install.prompt();const result=await install.userChoice;engagement('home_choice',appId,{outcome:result.outcome});setInstall(null);}}
 return <><div className="shrink-0">{visible&&<div className="flex items-center gap-2 bg-slate-50 px-3 py-2 text-xs"><span className="flex-1">{t('次回はホーム画面からすぐに開けます','Open it from your home screen next time')}</span><button type="button" onClick={()=>void add()} className="font-bold text-emerald-700">{t('追加する','Add')}</button><button type="button" onClick={dismiss} aria-label={t('閉じる','Dismiss')}>×</button></div>}{owner&&<details className="px-3 py-1 text-xs"><summary className="cursor-pointer">{t('アプリアイコン設定','App icon settings')}</summary><IconPicker appId={appId} title={title}/></details>}</div>{help&&<div role="dialog" aria-modal="true" aria-label={t('ホーム画面に追加','Add to home screen')} className="fixed inset-0 z-[700] flex items-center justify-center bg-black/40 p-4"><div className="max-w-sm rounded-2xl bg-white p-5"><AddToHomeSteps/><p className="mt-3 text-xs text-slate-500">{t('端末内だけの保存データは起動方法によって共有されない場合があります。大切な記録はログインして同期してください。','Local-only data may not transfer between launch modes. Sign in to sync important records.')}</p><button type="button" onClick={()=>setHelp(false)} className="mt-4 rounded-lg bg-emerald-700 px-4 py-2 text-white">{t('閉じる','Close')}</button></div></div>}</>;
}
