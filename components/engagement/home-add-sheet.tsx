"use client";
import { useEffect, useState } from 'react';
import { ArrowDown, ArrowLeft, Check, ChevronRight, Lock, SquarePlus, X } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useT } from '@/lib/i18n/client';
import { AddToHomeSteps, detectPlatform, type Platform } from '@/components/add-to-home-guide';
import { engagement } from '@/lib/analytics/engagement';
import { DEFAULT_ICON, ICON_COLORS, ICONS, recommendedIcons } from '@/lib/apps/icon-catalog';
import { IconArt } from '@/lib/apps/icon-art';
import { useLocale } from '@/lib/i18n/client';
import { HomeScreenPreview, IconPicker } from './icon-picker';

type Step = 'icon' | 'edit' | 'steps';

/**
 * 「ホーム画面に追加」のシート。アプリのページの上に下から出す。
 * 1. アイコンの確認（ホーム画面にこう並びます）→ 持ち主は「アイコンを変える」もできる
 * 2. 追加の手順（Safari の共有ボタン → ホーム画面に追加 → 追加）。Android で追加の画面を出せるときはボタン1つで出す
 * アプリのページで案内するので、正しいページ（このアプリ）がホーム画面に追加される
 */
export function HomeAddSheet({appId,title,owner,guestCreator=false,onInstall,onClose,startAt='icon'}:{appId:string;title:string;owner:boolean;
 /** ゲストでこのアプリを公開した人（ログインすると変えられることを案内する） */
 guestCreator?:boolean;
 /** Android などで、ブラウザの「ホーム画面に追加」の画面を出せるとき */
 onInstall?:()=>Promise<void>;onClose:()=>void;startAt?:Step}) {
 const t=useT(),locale=useLocale();const [step,setStep]=useState<Step>(startAt),[appearance,setAppearance]=useState(DEFAULT_ICON),[draft,setDraft]=useState(DEFAULT_ICON),[loaded,setLoaded]=useState(false),[platform,setPlatform]=useState<Platform>('desktop'),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
 useEffect(()=>{setPlatform(detectPlatform());let alive=true;fetch(`/api/apps/${appId}/appearance`).then(r=>r.ok?r.json():null).then(v=>{if(alive&&v){setAppearance(v);setDraft(v);}}).catch(()=>{}).finally(()=>{if(alive)setLoaded(true);});return()=>{alive=false};},[appId]);
 useEffect(()=>{engagement('home_sheet_step',appId,{step});},[appId,step]);
 // 候補：今のアイコンを先頭に、アプリ名に合うものを並べる
 const picks=[...new Set([appearance.icon,...recommendedIcons(title)])].slice(0,5);
 const iconName=(id:string)=>{const x=ICONS.find(i=>i[0]===id);return x?(locale==='ja'?x[1]:x[2]):id;};
 function login(){const u=new URL(window.location.href);u.searchParams.set('home','1');void signIn('google',{callbackUrl:u.pathname+u.search});}
 function choose(v:{icon:string;color:string}){
  if(!owner){setNotice(t('アイコンを変えるには、ログインが必要です。','Sign in to change the icon.'));return;}
  setNotice('');setDraft(v);engagement('icon_pick',appId,{icon:v.icon,color:v.color});
 }
 /** 選んだアイコンを保存してから、追加の手順へ進む */
 async function next(){
  if(owner&&(draft.icon!==appearance.icon||draft.color!==appearance.color)){
   setBusy(true);
   try{const r=await fetch(`/api/apps/${appId}/appearance`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(draft)});if(!r.ok)throw r.status;setAppearance(draft);engagement('icon_saved',appId,{icon:draft.icon,color:draft.color,surface:'home_sheet'});}
   catch{setNotice(t('アイコンを保存できませんでした。もう一度押してください。','Could not save the icon. Please try again.'));setBusy(false);return;}
   setBusy(false);
  }
  setStep('steps');
 }
 const heading=step==='edit'?t('アイコンを変える','Change the icon'):t('ホーム画面に追加','Add to home screen');
 return <div role="dialog" aria-modal="true" aria-label={heading} className="fixed inset-0 z-[700] flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={onClose}>
  <div className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl" onClick={e=>e.stopPropagation()}>
   <div className="flex shrink-0 items-center gap-2 border-b border-slate-100 px-4 py-3">
    {step!=='icon'?<button type="button" onClick={()=>setStep('icon')} aria-label={t('戻る','Back')} className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100"><ArrowLeft className="h-4 w-4"/></button>:<span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100 text-sky-600"><SquarePlus className="h-4 w-4"/></span>}
    <p className="min-w-0 flex-1 text-base font-black text-slate-900">{heading}</p>
    {step!=='edit'&&<span className="text-[11px] font-bold text-slate-400">{step==='icon'?'1 / 2':'2 / 2'}</span>}
    <button type="button" onClick={onClose} aria-label={t('閉じる','Close')} className="rounded-full bg-slate-100 p-1.5 text-slate-500 hover:bg-slate-200"><X className="h-4 w-4"/></button>
   </div>
   <div className="min-h-0 flex-1 overflow-y-auto p-5">
    {step==='icon'&&<div className="space-y-4">
     <div><p className="mb-2 text-sm font-bold text-slate-700">{t('ホーム画面にこう並びます','It will look like this on your home screen')}</p><div className={loaded?'':'opacity-0'}><HomeScreenPreview icon={draft.icon} color={draft.color} title={title}/></div></div>
     {(owner||guestCreator)&&<div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
      <p className="flex items-center gap-1.5 text-xs font-black text-slate-700">{t('ほかのアイコンにする？','Try another icon?')}{!owner&&<span className="ml-auto flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-500 ring-1 ring-slate-200"><Lock className="h-3 w-3"/>{t('ログインで変更','Sign in to edit')}</span>}</p>
      <div className="mt-2 grid grid-cols-6 gap-1.5">
       {picks.map(id=><button key={id} type="button" aria-pressed={draft.icon===id} aria-label={iconName(id)} onClick={()=>choose({...draft,icon:id})} className={`relative flex aspect-square items-center justify-center rounded-[14px] p-0.5 transition ${draft.icon===id?'ring-2 ring-emerald-600':'ring-1 ring-transparent hover:ring-slate-300'}`}><IconArt icon={id} color={draft.color} size={40}/>{draft.icon===id&&<span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white"><Check className="h-2.5 w-2.5" strokeWidth={3}/></span>}</button>)}
       <button type="button" onClick={()=>owner?setStep('edit'):login()} className="flex aspect-square flex-col items-center justify-center rounded-[14px] text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-50">{t('もっと','More')}<ChevronRight className="h-3.5 w-3.5"/></button>
      </div>
      <div className="mt-2 flex items-center gap-2">{ICON_COLORS.map(c=><button key={c[0]} type="button" aria-label={locale==='ja'?c[2]:c[3]} aria-pressed={draft.color===c[0]} onClick={()=>choose({...draft,color:c[0]})} style={{backgroundColor:c[1]}} className={`flex h-7 w-7 items-center justify-center rounded-full ring-1 ring-slate-300 ${draft.color===c[0]?'ring-2 ring-emerald-600 ring-offset-1':''}`}>{draft.color===c[0]&&<Check className="h-3.5 w-3.5 text-[#164E55]" strokeWidth={3}/>}</button>)}</div>
      {notice&&<p role="status" className="mt-2 rounded-lg bg-white px-2.5 py-2 text-[11px] text-slate-700 ring-1 ring-slate-200">{notice}{!owner&&<button type="button" onClick={login} className="ml-1 font-bold text-emerald-700 underline">{t('ログインする','Sign in')}</button>}</p>}
     </div>}
     <button type="button" disabled={busy} onClick={()=>void next()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-base font-black text-white shadow-sm hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-60"><SquarePlus className="h-5 w-5"/>{busy?t('保存中…','Saving…'):t('このアイコンで追加','Add with this icon')}</button>
    </div>}
    {step==='edit'&&<IconPicker appId={appId} title={title} embedded onSaved={v=>{setAppearance(v);setDraft(v);setStep('icon');}}/>}
    {step==='steps'&&<div className="space-y-4">
     {onInstall&&<button type="button" onClick={()=>void onInstall()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-base font-black text-white shadow-sm hover:bg-emerald-700"><SquarePlus className="h-5 w-5"/>{t('ホーム画面に追加','Add to home screen')}</button>}
     {onInstall&&<p className="text-center text-[11px] text-slate-500">{t('うまくいかないときは、下の手順で追加できます','If that doesn’t work, follow these steps')}</p>}
     <AddToHomeSteps/>
     <p className="text-[11px] leading-relaxed text-slate-500">{t('端末内だけの保存データは、ホーム画面から開いたときに引き継がれない場合があります。大切な記録はログインして同期してください。','Data saved only on this device may not carry over when opened from the home screen. Sign in to sync important records.')}</p>
     <button type="button" onClick={onClose} className="w-full rounded-xl py-2.5 text-sm font-bold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50">{t('閉じる','Close')}</button>
    </div>}
   </div>
   {step==='steps'&&(platform==='ios'||platform==='ios_inapp')&&<div className="flex shrink-0 items-center justify-center gap-1.5 bg-sky-500 py-2 text-xs font-black text-white"><ArrowDown className="h-4 w-4 animate-bounce"/>{platform==='ios'?t('共有ボタンは、画面のいちばん下（または上）にあります','The Share button is at the very bottom (or top) of the screen'):t('まず右上（または右下）のメニューから「Safariで開く」','First choose “Open in Safari” from the menu at the top (or bottom) right')}<ArrowDown className="h-4 w-4 animate-bounce"/></div>}
  </div>
 </div>;
}
