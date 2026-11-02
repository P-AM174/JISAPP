const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
function load(file) {
  const context = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, context);
  return context.exports;
}
const { summarizeEngagement } = load('lib/analytics/engagement-summary.ts');
const ev = (action, visitor, extra = {}, day = '2026-11-01') => ({ created_at: day+'T03:00:00Z', session_id: visitor, props: {action, visitor, appId:'app-1', ...extra} });
const result = summarizeEngagement([
  ev('share_shown','a'), ev('share_shown','a'), ev('share_shown','b'),
  ev('share_clicked','a',{channel:'line',shareId:'s1'}), ev('share_clicked','a',{channel:'x',shareId:'s2'}),
  ev('shared_link_opened','b',{shareId:'s1'}), ev('shared_link_opened','b',{shareId:'s1'}),
  ev('app_open','b',{owner:false}),ev('app_open','b',{owner:false}),ev('app_open','b',{owner:false},'2026-11-02'),
  ev('app_open','a',{owner:true}), ev('app_open','a',{owner:true},'2026-11-02'),
]);
assert.equal(result.shareRate.numerator,1);
assert.equal(result.shareRate.denominator,2);
assert.equal(result.openedShareLinks,1);
assert.equal(result.repeatAppBrowsers,1);
// ホーム画面に追加：iPhone はホーム画面側のブラウザIDが別（h1）になるので、ref（案内を見た Safari 側の a）で結び付ける
const home = summarizeEngagement([
  ev('home_shown','a'), ev('home_shown','c'),
  ev('home_first_launch','h1',{platform:'ios',ref:'a',owner:false}), ev('home_first_launch','h1',{platform:'ios',ref:'a',owner:false}),
  ev('standalone_open','h1',{}), ev('standalone_open','h1',{},'2026-11-02'),
  ev('home_first_launch','c',{platform:'android',owner:true}),
  ev('home_first_launch','x9',{platform:'ios',owner:false}),
]);
assert.equal(home.homeInstalls.total,3);
assert.equal(home.homeInstalls.byOthers,2);
assert.equal(home.homeInstalls.guidedRate.numerator,2);
assert.equal(home.homeInstalls.guidedRate.denominator,2);
assert.equal(home.homeInstalls.usedOnTwoDays,1);
assert.equal(home.homeInstalls.platforms.ios,2);
assert.equal(home.apps[0].installs,3);
// 継続利用・作成数・2つ目のアプリ（全体・日本語版・英語版）
const R = load('lib/analytics/retention.ts');
const NOW = new Date('2026-12-20T03:00:00Z'); // 日本時間 12/20 12:00
const E = (action, visitor, day, extra = {}, locale = 'ja', app = 'app-1') => ({ name:'engagement', locale, created_at: day+'T03:00:00Z', session_id: visitor, props: { action, appId: app, visitor, ...extra } });
const open = (v, day, extra = {}, locale = 'ja', app) => E('app_open', v, day, { owner:false, kind:'saves', ...extra }, locale, app);
const events = [
  open('a','2026-12-01'), open('a','2026-12-02'), E('data_saved','a','2026-12-01'), E('data_saved','a','2026-12-02'), // 翌日も・保存2日
  open('b','2026-12-01'), open('b','2026-12-06'), E('data_saved','b','2026-12-01'),                                       // 5日後
  open('c','2026-12-01'), open('c','2026-12-15'),                                                                         // 7日より後
  open('d','2026-12-18'), open('d','2026-12-19'),                                                                         // まだ7日たっていない
  open('o','2026-12-01',{owner:true}), open('o','2026-12-02',{owner:true}),
  E('publish_shown','o','2026-12-01'), E('share_clicked','o','2026-12-01',{channel:'line'}), E('share_clicked','o','2026-12-01',{channel:'x'}),
  // iPhone：Safari（s）で案内を見て、ホーム画面（h）から別の日に開いた → 同じブラウザ・追加した
  open('s','2026-12-03'), E('home_shown','s','2026-12-03'),
  E('home_first_launch','h','2026-12-04',{ref:'s'}), E('standalone_open','h','2026-12-04'),
  // 英語版：保存しないアプリ（また開かない）・グループ
  open('e1','2026-12-01',{kind:'plain'},'en','app-2'), E('publish_shown','e1','2026-12-01',{},'en','app-2'), E('share_clicked','e1','2026-12-01',{channel:'x'},'en','app-2'),
  E('group_created','e1','2026-12-01',{},'en','app-2'),
  // 公開の記録（作成数の言語別・2つ目のアプリの言語別）
  { name:'publish', locale:'ja', created_at:'2026-12-19T01:00:00Z', session_id:'p', props:{ overwrite:false, appId:'x1' } },
  { name:'publish', locale:'ja', created_at:'2026-12-19T02:00:00Z', session_id:'p', props:{ overwrite:false, appId:'x2' } },
  { name:'publish', locale:'en', created_at:'2026-12-18T01:00:00Z', session_id:'q', props:{ overwrite:false, appId:'y1' } },
  { name:'publish', locale:'ja', created_at:'2026-12-19T03:00:00Z', session_id:'p', props:{ overwrite:true, appId:'x1' } },  // 上書きは数えない
];
const apps = [
  { id:'x1', created_at:'2026-12-19T01:00:00Z', creator_id:'u1' }, { id:'x2', created_at:'2026-12-19T02:00:00Z', creator_id:'u1' },
  { id:'y1', created_at:'2026-12-18T01:00:00Z', creator_id:'u2' }, { id:'z1', created_at:'2026-12-12T01:00:00Z', creator_id:null },
];
const G = R.summarizeGoal({ events, apps, periodDays: 30, now: NOW });
const ja = G.ja, en = G.en, all = G.all;
assert.equal(ja.retention.others.d1.numerator, 2);   // a と s
assert.equal(ja.retention.others.d1.denominator, 4); // a b c s（d はまだ）
assert.equal(ja.retention.others.d7.numerator, 3);   // a b s
assert.equal(ja.retention.owners.d7.numerator, 1);
assert.equal(ja.byHome.installed.numerator, 1); assert.equal(ja.byHome.installed.denominator, 1);
assert.equal(ja.dataSaved.twoDays.numerator, 1); assert.equal(ja.dataSaved.any.numerator, 2);
assert.equal(ja.bySent.sent.denominator, 5);         // app-1 は送ったアプリ
assert.equal(ja.rates.sns.numerator, 1); assert.equal(ja.rates.message.numerator, 1); assert.equal(ja.rates.sns.denominator, 1);
assert.equal(ja.rates.homeAddedAfterGuide.numerator, 1); assert.equal(ja.rates.homeAddedAfterGuide.denominator, 1);
assert.equal(en.byKind.plain.denominator, 1); assert.equal(en.byKind.plain.numerator, 0);
assert.equal(en.groups.created, 1); assert.equal(ja.groups.created, 0);
assert.equal(all.retention.others.d7.denominator, 5);
// 作成数：全体は apps 表、言語別は公開の記録
assert.equal(all.creation.yesterday, 2); assert.equal(all.creation.dayBefore, 1); assert.equal(all.creation.sameDayLastWeek, 1);
assert.equal(all.creation.dayOverDay, 1); assert.equal(all.creation.weekOverWeek, 1);
assert.equal(en.creation.weekOverWeek, null); // 先週の同じ曜日が0件のときは出さない
assert.equal(ja.creation.yesterday, 2); assert.equal(en.creation.dayBefore, 1); assert.equal(en.creation.yesterday, 0);
assert.equal(en.creation.dayOverDay, -1);
// 2つ目のアプリ：u1 は日本語で2つ、u2 は英語で1つ
assert.equal(all.secondApp.overall.numerator, 1); assert.equal(all.secondApp.overall.denominator, 2);
assert.equal(ja.secondApp.overall.numerator, 1); assert.equal(en.secondApp.overall.denominator, 1);
// D30
const late = R.summarizeUsage([open('m','2026-10-01'), open('m','2026-11-05')], NOW);
assert.equal(late.retention.others.d30.numerator, 1);
// 運営・本人を計測から除く
const X = load('lib/analytics/excluded.ts');
assert.equal(X.isExcludedAccount({ name:'P-AM' }), true);
assert.equal(X.isExcludedAccount({ name:'p-am ' }), true);
assert.equal(X.isExcludedAccount({ name:'taro', role:'ADMIN' }), true);
assert.equal(X.isExcludedAccount({ name:'taro', role:'USER' }), false);
assert.equal(X.isExcludedAccount(null), false);
const ex = (name, session_id, props) => ({ name, session_id, props });
const kept = X.filterExcludedEvents([
  ex('publish','s-me',{ appId:'mine', overwrite:false }),
  ex('page_view','s-me',null),                                                     // 本人の訪問 → 除く
  ex('engagement','s-me2',{ action:'app_open', appId:'mine', visitor:'v-me', owner:true }),
  ex('page_view','s-me2',null),                                                    // 本人のブラウザの別の訪問 → 除く
  ex('engagement','s-home',{ action:'home_first_launch', appId:'mine', visitor:'v-home', ref:'v-me' }), // 本人の iPhone のホーム画面 → 除く
  ex('engagement','s-home2',{ action:'standalone_open', appId:'mine', visitor:'v-home' }),
  ex('engagement','s-other',{ action:'app_open', appId:'mine', visitor:'v-other', owner:false }),     // ほかの人が本人のアプリを使う → 残す
  ex('page_view','s-other',null),
  ex('publish','s-x',{ appId:'yours', overwrite:false }),                          // ほかの人のアプリ → 残す
], new Set(['mine']));
assert.equal(kept.length, 3);
assert.ok(kept.every(e => ['s-other','s-x'].includes(e.session_id)));
const {ICONS,ICON_COLORS,validIcon,autoIcon,normalizeColor,iconColorHex,iconInkHex}=load('lib/apps/icon-catalog.ts');
assert.equal(ICONS.length,50);
assert.equal(new Set(ICONS.map(x=>x[0])).size,50);
assert.equal(ICON_COLORS.length,10);
assert.equal(new Set(ICON_COLORS.map(x=>x[0])).size,10);
assert.equal(validIcon('calendar','blue'),true);
assert.equal(validIcon('calendar','mist'),false); // 前の淡い色は、新しく保存はできない
assert.equal(validIcon('<script>','blue'),false);
// 前の淡い色で保存したアプリは、近い新しい色で表示する
assert.equal(normalizeColor('mist'),'teal');
assert.equal(normalizeColor('sage'),'green');
assert.equal(normalizeColor('stone'),'charcoal');
assert.equal(normalizeColor('blue'),'blue');
assert.equal(normalizeColor('nope'),'teal');
assert.equal(iconColorHex('mist'),iconColorHex('teal'));
assert.equal(iconInkHex('yellow'),'#5A3A00');
assert.equal(autoIcon('わんこ日記').icon,'paw-print');
assert.equal(autoIcon('家計簿').icon,'wallet');
assert.equal(autoIcon('部活の出欠表').icon,'users');
assert.equal(autoIcon('なにか').icon,'calendar');
assert.deepEqual(autoIcon('わんこ日記'),autoIcon('わんこ日記'));
assert.ok(ICONS.some(x=>x[0]===autoIcon('Habit tracker').icon)&&ICON_COLORS.some(x=>x[0]===autoIcon('Habit tracker').color));
console.log('Passed: excluded accounts, retention, creation, second app, home installs, auto icon, deduplication, share denominators, repeat use, author exclusion, icon catalog validation.');
