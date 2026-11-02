"use client";
import { useEffect,useRef,useState } from 'react';
import { Palette, Smartphone, SquarePlus, X } from 'lucide-react';
import { useT } from '@/lib/i18n/client';
import { isStandalone } from '@/components/add-to-home-guide';
import { engagement } from '@/lib/analytics/engagement';
import { homePlatform, recordHomeLaunch } from '@/lib/analytics/home-install';
import { HomeAddSheet } from './home-add-sheet';
type InstallEvent = Event & { prompt:()=>Promise<void>;userChoice:Promise<{outcome:string}> };
type Sheet = null | 'icon' | 'edit';
export function AppRetention({appId,title,owner,enabled}:{appId:string;title:string;owner:boolean;enabled:boolean}) {
 const t=useT();const [visible,setVisible]=useState(false),[sheet,setSheet]=useState<Sheet>(null),[install,setInstall]=useState<InstallEvent|null>(null);const tracked=useRef('');const [guestCreator,setGuestCreator]=useState(false);
 useEffect(()=>{
  const u=new URL(window.location.href);
  // ゲストで公開した人の端末には、引き継ぎの印が残っている（アイコンはログインすると変えられると案内する）
  try{setGuestCreator(JSON.parse(localStorage.getItem('jisapp_guest_claims')??'[]').some((c:{appId:string})=>c.appId===appId));}catch{}
  if(tracked.current!==appId){tracked.current=appId;engagement('app_open',appId,{owner,standalone:isStandalone()});
   if(isStandalone())engagement('standalone_open',appId,{owner,platform:homePlatform()});
   // ホーム画面のアイコンから初めて開いたとき＝実際にホーム画面に追加した（iPhone は追加の完了を知らせないため）
   recordHomeLaunch(appId,owner);
   const sid=u.searchParams.get('share_id');
   if(sid&&/^[a-f0-9-]{36}$/.test(sid))engagement('shared_link_opened',appId,{shareId:sid,channel:u.searchParams.get('utm_source')??'unknown',owner});
  }
  // 公開直後の「ホーム画面に追加」から来たとき（?home=1）は、すぐにシートを出す。
  // 読み込み直しで何度も出ないよう、URL から ?home=1 を外す
  if(u.searchParams.get('home')==='1'){
   u.searchParams.delete('home');window.history.replaceState(window.history.state,'',u.pathname+u.search+u.hash);
   if(!isStandalone()){setSheet('icon');engagement('home_howto',appId,{surface:'publish'});}
  } else if(enabled&&!isStandalone())try{const raw=JSON.parse(localStorage.getItem(`jisapp:nudge:${appId}`)??'{}');if((raw.count??0)<2&&Date.now()-(raw.at??0)>7*86400000){setVisible(true);engagement('home_shown',appId);}}catch{}
  const before=(e:Event)=>{e.preventDefault();setInstall(e as InstallEvent);};const done=()=>{engagement('home_installed',appId,{platform:homePlatform()});setVisible(false);setInstall(null);setSheet(null);};window.addEventListener('beforeinstallprompt',before);window.addEventListener('appinstalled',done);return()=>{window.removeEventListener('beforeinstallprompt',before);window.removeEventListener('appinstalled',done);};
 },[appId,owner,enabled]);
 function dismiss(){setVisible(false);try{const key=`jisapp:nudge:${appId}`,v=JSON.parse(localStorage.getItem(key)??'{}');localStorage.setItem(key,JSON.stringify({count:(v.count??0)+1,at:Date.now()}));}catch{}}
 async function prompt(){if(!install)return;engagement('home_prompt',appId);await install.prompt();const result=await install.userChoice;engagement('home_choice',appId,{outcome:result.outcome});setInstall(null);}
 return <><div className="shrink-0">
  {visible&&<div className="flex items-center gap-2.5 border-t border-sky-100 bg-gradient-to-r from-sky-50 to-emerald-50 px-3 py-2 text-xs">
   <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-sky-600 shadow-sm ring-1 ring-sky-100"><Smartphone className="h-4 w-4"/></span>
   <span className="min-w-0 flex-1 font-semibold leading-snug text-sky-950">{t('ホーム画面に追加すると、次からすぐ開けます','Add it to your home screen to open it quickly next time')}</span>
   <button type="button" onClick={()=>{engagement('home_howto',appId);setSheet('icon');}} className="flex shrink-0 items-center gap-1 rounded-full bg-sky-600 px-3 py-1.5 font-bold text-white shadow-sm hover:bg-sky-700"><SquarePlus className="h-3.5 w-3.5"/>{t('追加する','Add')}</button>
   <button type="button" onClick={dismiss} aria-label={t('閉じる','Dismiss')} className="shrink-0 rounded-full p-1 text-sky-700 hover:bg-sky-100"><X className="h-3.5 w-3.5"/></button>
  </div>}
  {owner&&<div className="border-t border-slate-100 px-3 py-1.5">
   <button type="button" onClick={()=>setSheet('edit')} className="flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100"><Palette className="h-3.5 w-3.5 text-emerald-600"/>{t('アプリアイコンを設定','Set app icon')}</button>
  </div>}
 </div>
 {sheet&&<HomeAddSheet appId={appId} title={title} owner={owner} guestCreator={!owner&&guestCreator} startAt={sheet} onInstall={install?prompt:undefined} onClose={()=>setSheet(null)}/>}</>;
}
