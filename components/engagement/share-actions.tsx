"use client";
import { useEffect, useRef, useState } from 'react';
import { useLocale, useT } from '@/lib/i18n/client';
import { getLineShareUrl,getTwitterShareUrl,openShareWindow } from '@/lib/share';
import { engagement,shareLink } from '@/lib/analytics/engagement';
export function ShareActions({appId,url,title,kind='public'}:{appId:string;url:string;title:string;kind?:'public'|'group_invite'}) {
 const locale=useLocale(), t=useT(); const [notice,setNotice]=useState('');const seen=useRef('');
 useEffect(()=>{const key=appId+kind;if(seen.current===key)return;seen.current=key;engagement('share_shown',appId,{kind});},[appId,kind]);
 const text=kind==='group_invite'?t(`「${title}」を一緒に使いましょう。リンクから参加できます。`,`Join me on “${title}” using this invitation.`):t(`「${title}」を作りました！ブラウザですぐ使えます。`,`I made “${title}”! Try it in your browser.`);
 async function send(channel:string){
   const link=shareLink(url,channel,kind),shareId=new URL(link).searchParams.get('share_id')!;
   engagement('share_clicked',appId,{channel,kind,shareId});
   if(channel==='native'){
     if(!navigator.share){setNotice(t('このブラウザではリンクコピーをご利用ください。','Please use Copy link in this browser.'));return;}
     try {await navigator.share({title,text,url:link});engagement('share_handoff',appId,{channel,kind,shareId});}catch{setNotice(t('共有を中止しました。','Sharing cancelled.'));}return;
   }
   if(channel==='copy'){try{await navigator.clipboard.writeText(link);engagement('share_copied',appId,{channel,kind,shareId});setNotice(t('コピーしました','Copied'));}catch{setNotice(t('コピーできませんでした','Could not copy'));}return;}
   const destination=channel==='line'?getLineShareUrl(link,text):channel==='whatsapp'?`https://wa.me/?text=${encodeURIComponent(text+'\n'+link)}`:channel==='telegram'?`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`:getTwitterShareUrl(link,text);
   openShareWindow(destination);
 }
 const primary=kind==='group_invite'?(locale==='ja'?'line':'whatsapp'):'x';
 const labels:Record<string,string>={line:'LINEで招待',whatsapp:'Invite on WhatsApp',telegram:'Telegram',x:t('Xでシェア','Share on X'),native:t('ほかのアプリで送る','Share via…'),copy:t('リンクをコピー','Copy link')};
 return <div className="space-y-2"><div className="flex flex-wrap gap-2">{[primary,...(kind==='group_invite'&&locale==='en'?['telegram']:[]),'native','copy'].map((channel,i)=><button key={channel} type="button" onClick={()=>void send(channel)} className={`rounded-xl px-4 py-3 text-sm font-bold ${i===0?'bg-emerald-700 text-white':'bg-white text-slate-700 ring-1 ring-slate-200'}`}>{labels[channel]}</button>)}</div>{notice&&<p role="status" className="text-xs text-slate-600">{notice}</p>}</div>;
}
