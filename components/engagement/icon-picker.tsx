"use client";
import { useEffect,useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { ICONS,ICON_COLORS,DEFAULT_ICON,recommendedIcons } from '@/lib/apps/icon-catalog';
import { IconArt } from '@/lib/apps/icon-art';
import { useLocale,useT } from '@/lib/i18n/client';
import { engagement } from '@/lib/analytics/engagement';

/** スマホのホーム画面に並んだときの見た目（アイコン＋下の名前） */
export function HomeScreenPreview({icon,color,title}:{icon:string;color:string;title:string}) {
 return <div className="flex items-center justify-center gap-5 rounded-2xl bg-gradient-to-br from-sky-400 via-indigo-400 to-fuchsia-400 px-4 py-5">
  {[0,1].map(i=><div key={i} aria-hidden className="h-14 w-14 rounded-[14px] bg-white/25"/>)}
  <div className="flex w-16 flex-col items-center gap-1"><div className="rounded-[14px] shadow-lg ring-1 ring-black/5"><IconArt icon={icon} color={color} size={56}/></div><span className="w-full truncate text-center text-[10px] font-semibold text-white drop-shadow">{title}</span></div>
  <div aria-hidden className="h-14 w-14 rounded-[14px] bg-white/25"/>
 </div>;
}

export function IconPicker({appId,title,defaultOpen=false}:{appId:string;title:string;defaultOpen?:boolean}) {
 const t=useT(),locale=useLocale();const [value,setValue]=useState(DEFAULT_ICON),[query,setQuery]=useState(''),[notice,setNotice]=useState<{ok:boolean;text:string}|null>(null),[busy,setBusy]=useState(false),[ready,setReady]=useState(false),[saved,setSaved]=useState(DEFAULT_ICON);
 const recommended = recommendedIcons(title);
 const catalog = [...ICONS].sort((a,b)=>(recommended.includes(b[0])?1:0)-(recommended.includes(a[0])?1:0));
 useEffect(()=>{let alive=true;setReady(false);fetch(`/api/apps/${appId}/appearance`).then(r=>{if(!r.ok)throw Error();return r.json();}).then(v=>{if(alive){setValue(v);setSaved(v);setReady(true);}}).catch(()=>{if(alive)setNotice({ok:false,text:t('設定を読み込めませんでした。再度開いてください。','Could not load settings. Please reopen.')});});return()=>{alive=false};},[appId,t]);
 async function save(){setBusy(true);setNotice(null);let claimToken:string|undefined;try{claimToken=JSON.parse(localStorage.getItem('jisapp_guest_claims')??'[]').find((c:{appId:string})=>c.appId===appId)?.token;}catch{}
 try{const r=await fetch(`/api/apps/${appId}/appearance`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({...value,claimToken})});if(!r.ok)throw Error();engagement('icon_saved',appId,{icon:value.icon,color:value.color});setSaved(value);setNotice({ok:true,text:t('保存しました。すでにホーム画面に置いている場合は、いったん削除して追加し直すと新しいアイコンになります。','Saved. If it is already on your home screen, remove it and add it again to see the new icon.')});}catch{setNotice({ok:false,text:t('保存できませんでした。所有者としてログインしているか確認してください。','Could not save. Check that you are signed in as the owner.')});}finally{setBusy(false);}}
 const changed=value.icon!==saved.icon||value.color!==saved.color;
 return <details open={defaultOpen} className="group overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
  <summary className="flex cursor-pointer list-none items-center gap-3 p-3 [&::-webkit-details-marker]:hidden">
   <IconArt {...value} size={44}/>
   <span className="min-w-0 flex-1"><span className="block text-sm font-black text-slate-900">{t('ホーム画面のアイコン','Home screen icon')}</span><span className="block text-[11px] text-slate-500">{t('絵と色を選んで、自分のアプリらしく','Pick a symbol and color for your app')}</span></span>
   <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-180"/>
  </summary>
  <div className="space-y-4 border-t border-slate-100 p-4">
   <HomeScreenPreview icon={value.icon} color={value.color} title={title}/>
   <div>
    <p className="mb-2 text-xs font-bold text-slate-700">{t('色','Color')}</p>
    <div className="flex flex-wrap gap-3">{ICON_COLORS.map(c=><button key={c[0]} type="button" title={locale==='ja'?c[2]:c[3]} aria-label={locale==='ja'?c[2]:c[3]} aria-pressed={value.color===c[0]} onClick={()=>setValue({...value,color:c[0]})} style={{backgroundColor:c[1]}} className={`flex h-10 w-10 items-center justify-center rounded-full ring-1 ring-slate-300 transition ${value.color===c[0]?'ring-2 ring-emerald-600 ring-offset-2':''}`}>{value.color===c[0]&&<Check className="h-4 w-4 text-[#164E55]" strokeWidth={3}/>}</button>)}</div>
   </div>
   <div>
    <p className="mb-2 text-xs font-bold text-slate-700">{t('絵','Symbol')}</p>
    <label className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input aria-label={t('アイコン検索','Search icons')} value={query} onChange={e=>setQuery(e.target.value)} placeholder={t('例：予定、お金、ペット','e.g. Calendar, Money, Pets')} className="mb-2 w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm"/></label>
    <div className="grid max-h-60 grid-cols-5 gap-2 overflow-y-auto rounded-xl bg-slate-50 p-2">{catalog.filter(x=>x.join(' ').toLowerCase().includes(query.toLowerCase())).map(x=><button type="button" key={x[0]} aria-label={locale==='ja'?x[1]:x[2]} aria-pressed={value.icon===x[0]} title={locale==='ja'?x[1]:x[2]} onClick={()=>setValue({...value,icon:x[0]})} className={`relative flex flex-col items-center gap-0.5 rounded-xl p-1 transition ${value.icon===x[0]?'bg-white ring-2 ring-emerald-600':'hover:bg-white'}`}><IconArt icon={x[0]} color={value.color} size={40}/><span className="w-full truncate text-center text-[9px] text-slate-500">{locale==='ja'?x[1]:x[2]}</span>{recommended.includes(x[0])&&<span className="absolute -right-1 -top-1 rounded-full bg-amber-400 px-1 text-[8px] font-black text-white">{t('おすすめ','Pick')}</span>}</button>)}</div>
   </div>
   <button type="button" disabled={busy||!ready||!changed} onClick={()=>void save()} className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50">{!changed&&ready?<><Check className="h-4 w-4"/>{t('このアイコンを使っています','This icon is in use')}</>:busy?t('保存中…','Saving…'):t('このアイコンにする','Use this icon')}</button>
   {notice&&<p role="status" className={`rounded-lg px-3 py-2 text-xs ${notice.ok?'bg-emerald-50 text-emerald-800':'bg-rose-50 text-rose-700'}`}>{notice.text}</p>}
  </div>
 </details>;
}
