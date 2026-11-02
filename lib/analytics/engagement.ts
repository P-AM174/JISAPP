import { trackEvent } from './client';
/** Browser-local random identifier, not a person count. No invite tokens or names. */
export function visitorId(): string {
  try { let id=localStorage.getItem('jisapp:visitor'); if(!id){id=crypto.randomUUID();localStorage.setItem('jisapp:visitor',id);}return id; } catch {return '';}
}
export function engagement(action:string,appId:string,props:Record<string,string|number|boolean>={}) {
  trackEvent('engagement',{action,appId,visitor:visitorId(),...props});
}
export function shareLink(url:string,channel:string,kind:string):string {
  const u=new URL(url,window.location.origin);
  u.searchParams.set('utm_source',channel);u.searchParams.set('utm_medium','share');u.searchParams.set('utm_campaign',kind);
  u.searchParams.set('share_id',crypto.randomUUID());
  return u.toString();
}

/**
 * アプリでデータを保存した（Jisapp.saveData・グループの共有データの書き込み）。
 * 「開いただけ」ではなく本当に使っているかを見るため、アプリ×ブラウザごとに日本時間の1日1回だけ送る
 */
export function recordDataSaved(appId:string,kind:'personal'|'shared') {
  try {
    const day=new Date(Date.now()+9*3600000).toISOString().slice(0,10),key=`jisapp:data_saved_day:${appId}`;
    if(localStorage.getItem(key)===day)return;
    localStorage.setItem(key,day);
  } catch {return;}
  engagement('data_saved',appId,{kind});
}
