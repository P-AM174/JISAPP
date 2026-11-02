"use client";
import { useEffect, useState } from 'react';
import { ArrowDown, ArrowLeft, Palette, SquarePlus, X } from 'lucide-react';
import { useT } from '@/lib/i18n/client';
import { AddToHomeSteps, detectPlatform, type Platform } from '@/components/add-to-home-guide';
import { engagement } from '@/lib/analytics/engagement';
import { DEFAULT_ICON } from '@/lib/apps/icon-catalog';
import { HomeScreenPreview, IconPicker } from './icon-picker';

type Step = 'icon' | 'edit' | 'steps';

/**
 * 「ホーム画面に追加」のシート。アプリのページの上に下から出す。
 * 1. アイコンの確認（ホーム画面にこう並びます）→ 持ち主は「アイコンを変える」もできる
 * 2. 追加の手順（Safari の共有ボタン → ホーム画面に追加 → 追加）。Android で追加の画面を出せるときはボタン1つで出す
 * アプリのページで案内するので、正しいページ（このアプリ）がホーム画面に追加される
 */
export function HomeAddSheet({appId,title,owner,onInstall,onClose,startAt='icon'}:{appId:string;title:string;owner:boolean;
 /** Android などで、ブラウザの「ホーム画面に追加」の画面を出せるとき */
 onInstall?:()=>Promise<void>;onClose:()=>void;startAt?:Step}) {
 const t=useT();const [step,setStep]=useState<Step>(startAt),[appearance,setAppearance]=useState(DEFAULT_ICON),[loaded,setLoaded]=useState(false),[platform,setPlatform]=useState<Platform>('desktop');
 useEffect(()=>{setPlatform(detectPlatform());let alive=true;fetch(`/api/apps/${appId}/appearance`).then(r=>r.ok?r.json():null).then(v=>{if(alive&&v)setAppearance(v);}).catch(()=>{}).finally(()=>{if(alive)setLoaded(true);});return()=>{alive=false};},[appId]);
 useEffect(()=>{engagement('home_sheet_step',appId,{step});},[appId,step]);
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
     <div><p className="mb-2 text-sm font-bold text-slate-700">{t('ホーム画面にこう並びます','It will look like this on your home screen')}</p><div className={loaded?'':'opacity-0'}><HomeScreenPreview icon={appearance.icon} color={appearance.color} title={title}/></div></div>
     <button type="button" onClick={()=>setStep('steps')} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-base font-black text-white shadow-sm hover:bg-emerald-700 active:scale-[0.98]"><SquarePlus className="h-5 w-5"/>{t('このアイコンで追加','Add with this icon')}</button>
     {owner&&<button type="button" onClick={()=>setStep('edit')} className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-50"><Palette className="h-4 w-4"/>{t('アイコンを変える','Change the icon')}</button>}
    </div>}
    {step==='edit'&&<IconPicker appId={appId} title={title} embedded onSaved={v=>{setAppearance(v);setStep('icon');}}/>}
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
