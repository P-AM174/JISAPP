type Event = { created_at:string; session_id:string|null; props:Record<string,unknown>|null };
/** Deduplicate by browser + app, never add channel-level unique counts together. */
export function summarizeEngagement(events:Event[]) {
 const actions=new Map<string,Set<string>>(), channels=new Map<string,Set<string>>(), days=new Map<string,Set<string>>();
 const openedShares=new Set<string>(),createdShares=new Set<string>();
 const appMap=new Map<string,{opens:Set<string>;shares:Set<string>;home:Set<string>}>();
 for(const e of events){const p=e.props??{},action=String(p.action??''),app=String(p.appId??''),visitor=String(p.visitor||e.session_id||'');if(!app||!visitor)continue;const key=app+':'+visitor;
   const set=actions.get(action)??new Set<string>();set.add(key);actions.set(action,set);
   const row=appMap.get(app)??{opens:new Set<string>(),shares:new Set<string>(),home:new Set<string>()};
   if(action==='app_open'){row.opens.add(visitor);if(p.owner===false){const d=days.get(key)??new Set<string>();d.add(new Date(new Date(e.created_at).getTime()+9*3600000).toISOString().slice(0,10));days.set(key,d);}}
   if(action==='share_clicked'){row.shares.add(visitor);const c=String(p.channel??'unknown'),s=channels.get(c)??new Set<string>();s.add(key);channels.set(c,s);if(p.shareId)createdShares.add(String(p.shareId));}
   if(action==='standalone_open')row.home.add(visitor);
   if(action==='shared_link_opened'&&p.shareId)openedShares.add(String(p.shareId));
   appMap.set(app,row);
 }
 const count=(a:string)=>actions.get(a)?.size??0;
 const rate=(a:string,b:string)=>{const base=actions.get(b)??new Set<string>(),hit=actions.get(a)??new Set<string>();return {numerator:[...base].filter(k=>hit.has(k)).length,denominator:base.size};};
 return {counts:Object.fromEntries([...actions].map(([k,v])=>[k,v.size])),shareRate:rate('share_clicked','share_shown'),homeGuideRate:rate('home_howto','home_shown'),homeLaunchRate:rate('standalone_open','home_shown'),installed:count('home_installed'),channels:[...channels].map(([channel,s])=>({channel,count:s.size})),openedShareLinks:[...createdShares].filter(x=>openedShares.has(x)).length,createdShareLinks:createdShares.size,repeatAppBrowsers:[...days.values()].filter(x=>x.size>=2).length,apps:[...appMap].map(([appId,r])=>({appId,opens:r.opens.size,shares:r.shares.size,home:r.home.size})).sort((a,b)=>b.opens-a.opens)};
}
