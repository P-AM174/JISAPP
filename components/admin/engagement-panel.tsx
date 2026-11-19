import type { summarizeEngagement } from '@/lib/analytics/engagement-summary';
import { TAP_CLASS, type TrendOpeners } from './trend-openers';
type Summary=ReturnType<typeof summarizeEngagement>;
const percent=(r:{numerator:number;denominator:number})=>r.denominator?`${(100*r.numerator/r.denominator).toFixed(1)}%（${r.numerator}/${r.denominator}）`:'未計測';
/** [見出し, 数字, タップしたときにグラフを出す（日ごとに分けられない数字は undefined）] */
type Item=[string,string|number,(()=>void)|undefined];
/** タップできる数字は、点線の下線をつけてボタンにする */
function Value({value,onClick,className}:{value:string|number;onClick?:()=>void;className:string}){
 return <dd className={className}>{onClick?<button type="button" onClick={onClick} className={`-mx-1 px-1 text-left underline decoration-gray-300 decoration-dotted underline-offset-4 ${TAP_CLASS}`}>{value}</button>:value}</dd>;
}
export function EngagementPanel({data,open}:{data:Summary|null;open?:TrendOpeners|null}){
 if(!data)return null;
 const count=(key:string,title:string,note?:string)=>open?()=>open.count(key,{title,unit:'件',note}):undefined;
 const rate=(key:string,title:string,note:string)=>open?()=>open.rate(key,{title,unit:'件',note}):undefined;
 const homeItems:Item[]=[
  ['追加された件数（作者を含む）',`${data.homeInstalls.total}件`,count('eng:homeInstalls','ホーム画面に追加された件数（作者を含む）','ホーム画面のアイコンから初めて起動した日に数えます。')],
  ['うち作者以外',`${data.homeInstalls.byOthers}件`,count('eng:homeInstallsOthers','ホーム画面に追加された件数（作者以外）','ホーム画面のアイコンから初めて起動した日に数えます。')],
  ['案内を見たブラウザのうち追加した割合',percent(data.homeInstalls.guidedRate),undefined],
  ['追加後に異なる2日以上ホーム画面から開いた',`${data.homeInstalls.usedOnTwoDays}件`,undefined],
  ['端末別',Object.entries(data.homeInstalls.platforms).map(([k,v])=>`${k==='ios'?'iPhone':k==='android'?'Android':'その他'} ${v}`).join('・')||'なし',undefined],
 ];
 const otherItems:Item[]=[
  ['共有操作率（案内表示→共有ボタン）',percent(data.shareRate),rate('eng:shareRate','共有操作率（案内表示→共有ボタン）','その日に共有の案内を見たアプリ×ブラウザのうち、期間内に共有ボタンを押した割合です。')],
  ['ホーム追加手順の表示率',percent(data.homeGuideRate),rate('eng:homeGuideRate','ホーム追加手順の表示率','その日にホーム画面に追加の案内を見たアプリ×ブラウザのうち、期間内に手順を開いた割合です。')],
  ['Androidで追加の完了を検知した件数',data.installed,count('eng:installed','Androidで追加の完了を検知した件数')],
  ['期間内に発行・訪問された共有リンク',`${data.openedShareLinks}/${data.createdShareLinks}`,count('eng:shareLinks','発行された共有リンク','共有ボタンが押されて共有リンクが作られた日に数えます（訪問されたかは数えていません）。')],
  ['作者以外が異なる2日以上使ったアプリ×ブラウザ',data.repeatAppBrowsers,undefined],
 ];
 return <section className="rounded-2xl bg-white p-5 ring-1 ring-gray-200"><h2 className="font-bold">公開後の共有・ホーム画面・再利用</h2><p className="mt-2 text-xs text-gray-500">選択期間内のアプリ×ブラウザ単位。人数ではありません。作者・テスト操作を含む指標があり、保存領域を消すと別ブラウザ扱いになります。</p><div className="mt-4 rounded-xl bg-sky-50 p-4 ring-1 ring-sky-100"><h3 className="text-sm font-bold text-sky-950">ホーム画面に追加された件数</h3><p className="mt-1 text-[11px] text-sky-900/70">ホーム画面のアイコンから初めて起動したときに1件と数えます（iPhoneは追加の完了をページに知らせないため）。追加しただけで一度も開いていないものは数えられません。</p><dl className="mt-3 grid gap-3 sm:grid-cols-3">{
 homeItems.map(([label,value,onClick])=><div key={label}><dt className="text-xs text-sky-900/70">{label}</dt><Value value={value} onClick={onClick} className="font-bold text-sky-950"/></div>)}</dl></div><dl className="my-4 grid gap-3 sm:grid-cols-2">{
 otherItems.map(([label,value,onClick])=><div key={label}><dt className="text-xs text-gray-500">{label}</dt><Value value={value} onClick={onClick} className="font-bold"/></div>)}</dl><p className="text-xs text-gray-500">iPhoneの追加完了は直接取得できないため、ホーム画面からの初回起動で数えます。案内との結び付けは、案内を出したときに起動URLへ載せたランダムなブラウザIDで行います。共有ボタンのクリックは送信完了ではなく、nativeは送信先アプリを取得できません。リンク訪問には本人による確認も含まれます。</p><h3 className="mt-4 font-bold">共有先別の操作数</h3><div className="mt-2 flex flex-wrap gap-3">{data.channels.map(c=><span key={c.channel} className="rounded bg-slate-100 p-2 text-sm">{c.channel}: {c.count}</span>)}</div><details className="mt-4"><summary className="cursor-pointer text-sm font-bold">アプリ別の利用・共有・ホーム画面起動</summary><table className="mt-2 w-full text-left text-xs"><thead><tr><th>アプリ</th><th>利用</th><th>共有操作</th><th>ホーム追加</th><th>ホーム起動</th></tr></thead><tbody>{data.apps.map(a=><tr key={a.appId} className="border-t"><td className="py-2"><a href={`/apps/${encodeURIComponent(a.appId)}`} target="_blank" rel="noreferrer">{a.appId.slice(0,8)}…</a></td><td>{a.opens}</td><td>{a.shares}</td><td>{a.installs}</td><td>{a.home}</td></tr>)}</tbody></table></details></section>;
}
