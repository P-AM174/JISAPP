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
