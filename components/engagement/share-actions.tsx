"use client";
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Check, Link2, Share } from 'lucide-react';
import { useLocale, useT } from '@/lib/i18n/client';
import { getLineShareUrl, getTwitterShareUrl, openShareWindow } from '@/lib/share';
import { engagement, shareLink } from '@/lib/analytics/engagement';
import { LineBrandIcon, MessagesIcon, TelegramBrandIcon, WhatsAppBrandIcon, XBrandIcon } from '@/components/share-button';

type Channel = 'line' | 'x' | 'whatsapp' | 'telegram' | 'sms' | 'native' | 'copy';

/** 送り先ごとの色・マーク。ブランドの色とマークは変えずに使う */
const BRAND: Record<Channel, { bg: string; icon: ReactNode }> = {
  line: { bg: 'bg-[#06C755] text-white hover:brightness-95', icon: <LineBrandIcon className="h-5 w-5" /> },
  x: { bg: 'bg-black text-white hover:bg-slate-800', icon: <XBrandIcon className="h-4 w-4" /> },
  whatsapp: { bg: 'bg-[#25D366] text-white hover:brightness-95', icon: <WhatsAppBrandIcon className="h-5 w-5" /> },
  telegram: { bg: 'bg-[#26A5E4] text-white hover:brightness-95', icon: <TelegramBrandIcon className="h-5 w-5" /> },
  sms: { bg: 'bg-[#34C759] text-white', icon: <MessagesIcon className="h-5 w-5" /> },
  native: { bg: 'bg-sky-500 text-white', icon: <Share className="h-5 w-5" /> },
  copy: { bg: 'bg-slate-700 text-white', icon: <Link2 className="h-5 w-5" /> },
};

export function ShareActions({appId,url,title,kind='public'}:{appId:string;url:string;title:string;kind?:'public'|'group_invite'}) {
 const locale=useLocale(), t=useT(); const [notice,setNotice]=useState('');const [copied,setCopied]=useState(false);const [mobile,setMobile]=useState(false);const seen=useRef('');
 useEffect(()=>{const key=appId+kind;if(seen.current===key)return;seen.current=key;engagement('share_shown',appId,{kind});},[appId,kind]);
 useEffect(()=>{setMobile(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent));},[]);
 const text=kind==='group_invite'?t(`「${title}」を一緒に使いましょう。リンクから参加できます。`,`Join me on “${title}” using this invitation.`):t(`「${title}」を作りました！ブラウザですぐ使えます。`,`I made “${title}”! Try it in your browser.`);
 async function copy(link:string,channel:Channel,shareId:string){
   try{await navigator.clipboard.writeText(link);engagement('share_copied',appId,{channel,kind,shareId});setCopied(true);setNotice(channel==='copy'?t('リンクをコピーしました。トークやメッセージに貼り付けて送れます','Link copied. Paste it into a chat or message'):t('このブラウザでは共有画面を開けないため、リンクをコピーしました','This browser can’t open the share screen, so the link was copied'));window.setTimeout(()=>setCopied(false),2000);}
   catch{setNotice(t('コピーできませんでした','Could not copy'));}
 }
 async function send(channel:Channel){
   setNotice('');
   const link=shareLink(url,channel,kind),shareId=new URL(link).searchParams.get('share_id')!;
   engagement('share_clicked',appId,{channel,kind,shareId});
   if(channel==='native'){
     if(!navigator.share){await copy(link,channel,shareId);return;}
     try {await navigator.share({title,text,url:link});engagement('share_handoff',appId,{channel,kind,shareId});}catch{/* 閉じただけ */}return;
   }
   if(channel==='copy'){await copy(link,channel,shareId);return;}
   if(channel==='sms'){window.location.href=`sms:?&body=${encodeURIComponent(`${text}\n${link}`)}`;return;}
   const destination=channel==='line'?getLineShareUrl(link,text):channel==='whatsapp'?`https://wa.me/?text=${encodeURIComponent(text+'\n'+link)}`:channel==='telegram'?`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`:getTwitterShareUrl(link,text);
   openShareWindow(destination);
 }
 const ja=locale==='ja';
 // 大きく出す送り先：日本は LINE、それ以外は WhatsApp を先に。公開アプリは X も並べる
 const primary:Channel[]=kind==='group_invite'?(ja?['line']:['whatsapp','telegram']):(ja?['line','x']:['x','whatsapp']);
 const secondary:Channel[]=[...(mobile?['sms' as const]:[]),'native','copy'];
 const big:Record<string,string>={line:kind==='group_invite'?t('LINEで招待','Invite on LINE'):t('LINEで送る','Send on LINE'),x:t('Xでシェア','Share on X'),whatsapp:kind==='group_invite'?'Invite on WhatsApp':'WhatsApp',telegram:'Telegram'};
 const small:Record<string,string>={sms:t('メッセージ','Messages'),native:t('ほかのアプリ','More apps'),copy:copied?t('コピー済み','Copied'):t('リンクをコピー','Copy link')};
 return <div className="space-y-3">
  <div className={`grid gap-2 ${primary.length>1?'grid-cols-2':'grid-cols-1'}`}>
   {primary.map(channel=><button key={channel} type="button" onClick={()=>void send(channel)} className={`flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-black shadow-sm transition active:scale-[0.98] ${BRAND[channel].bg}`}>{BRAND[channel].icon}{big[channel]}</button>)}
  </div>
  <div className={`grid gap-2 ${secondary.length>2?'grid-cols-3':'grid-cols-2'}`}>
   {secondary.map(channel=><button key={channel} type="button" onClick={()=>void send(channel)} className="flex flex-col items-center gap-1.5 rounded-xl bg-white py-3 text-[11px] font-bold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 active:scale-[0.97]">
    <span className={`flex h-10 w-10 items-center justify-center rounded-full ${channel==='copy'&&copied?'bg-emerald-600 text-white':BRAND[channel].bg}`}>{channel==='copy'&&copied?<Check className="h-5 w-5"/>:BRAND[channel].icon}</span>
    {small[channel]}
   </button>)}
  </div>
  {notice&&<p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">{notice}</p>}
 </div>;
}
