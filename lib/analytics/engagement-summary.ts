type Event = { created_at:string; session_id:string|null; props:Record<string,unknown>|null };
const jstDay=(at:string)=>new Date(new Date(at).getTime()+9*3600000).toISOString().slice(0,10);
/** Deduplicate by browser + app, never add channel-level unique counts together. */
export function summarizeEngagement(events:Event[]) {
 const actions=new Map<string,Set<string>>(), channels=new Map<string,Set<string>>(), days=new Map<string,Set<string>>();
 const openedShares=new Set<string>(),createdShares=new Set<string>();
 const appMap=new Map<string,{opens:Set<string>;shares:Set<string>;home:Set<string>;installs:Set<string>}>();
 // ホーム画面に追加した件数（ホーム画面から初めて起動したとき）と、追加後にホーム画面から開いた日
 const installs=new Map<string,{platform:string;ref:string;owner:boolean}>(),homeDays=new Map<string,Set<string>>();
 for(const e of events){const p=e.props??{},action=String(p.action??''),app=String(p.appId??''),visitor=String(p.visitor||e.session_id||'');if(!app||!visitor)continue;const key=app+':'+visitor;
   const set=actions.get(action)??new Set<string>();set.add(key);actions.set(action,set);
   const row=appMap.get(app)??{opens:new Set<string>(),shares:new Set<string>(),home:new Set<string>(),installs:new Set<string>()};
   if(action==='app_open'){row.opens.add(visitor);if(p.owner===false){const d=days.get(key)??new Set<string>();d.add(jstDay(e.created_at));days.set(key,d);}}
   if(action==='share_clicked'){row.shares.add(visitor);const c=String(p.channel??'unknown'),s=channels.get(c)??new Set<string>();s.add(key);channels.set(c,s);if(p.shareId)createdShares.add(String(p.shareId));}
   if(action==='standalone_open'){row.home.add(visitor);const d=homeDays.get(key)??new Set<string>();d.add(jstDay(e.created_at));homeDays.set(key,d);}
   if(action==='home_first_launch'&&!installs.has(key)){installs.set(key,{platform:String(p.platform??'other'),ref:typeof p.ref==='string'?p.ref:'',owner:p.owner===true});row.installs.add(visitor);}
   if(action==='shared_link_opened'&&p.shareId)openedShares.add(String(p.shareId));
   appMap.set(app,row);
 }
 const count=(a:string)=>actions.get(a)?.size??0;
 const rate=(a:string,b:string)=>{const base=actions.get(b)??new Set<string>(),hit=actions.get(a)??new Set<string>();return {numerator:[...base].filter(k=>hit.has(k)).length,denominator:base.size};};
 // 案内を見た（アプリ×ブラウザ）うち、そのブラウザから追加されたもの。iPhone はホーム画面側のブラウザIDが別になるので ref で結び付ける
 const shown=actions.get('home_shown')??new Set<string>(),guidedFrom=new Set<string>();
 for(const [key,v] of installs){const app=key.slice(0,key.indexOf(':'));const from=v.ref?`${app}:${v.ref}`:key;if(shown.has(from))guidedFrom.add(from);}
 const platforms:Record<string,number>={};for(const v of installs.values())platforms[v.platform]=(platforms[v.platform]??0)+1;
 const homeInstalls={total:installs.size,byOthers:[...installs.values()].filter(v=>!v.owner).length,platforms,guidedRate:{numerator:guidedFrom.size,denominator:shown.size},
  // 追加したあと、ホーム画面から異なる2日以上開いたもの（追加して終わりではなく、使われているか）
  usedOnTwoDays:[...installs.keys()].filter(k=>(homeDays.get(k)?.size??0)>=2).length};
 return {homeInstalls,counts:Object.fromEntries([...actions].map(([k,v])=>[k,v.size])),shareRate:rate('share_clicked','share_shown'),homeGuideRate:rate('home_howto','home_shown'),homeLaunchRate:rate('standalone_open','home_shown'),installed:count('home_installed'),channels:[...channels].map(([channel,s])=>({channel,count:s.size})),openedShareLinks:[...createdShares].filter(x=>openedShares.has(x)).length,createdShareLinks:createdShares.size,repeatAppBrowsers:[...days.values()].filter(x=>x.size>=2).length,apps:[...appMap].map(([appId,r])=>({appId,opens:r.opens.size,shares:r.shares.size,home:r.home.size,installs:r.installs.size})).sort((a,b)=>b.opens-a.opens)};
}
