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
// 継続利用・作成数・2つ目のアプリ
const R = load('lib/analytics/retention.ts');
const NOW = new Date('2026-11-20T03:00:00Z'); // 日本時間 11/20 12:00
const open = (visitor, day, extra = {}) => ({ created_at: day+'T03:00:00Z', session_id: visitor, props: { action:'app_open', appId:'app-1', visitor, owner:false, ...extra } });
const ret = R.summarizeRetention([
  open('a','2026-11-01'), open('a','2026-11-02'),                 // 翌日も開いた
  open('b','2026-11-01'), open('b','2026-11-06'),                 // 5日後に開いた
  open('c','2026-11-01'), open('c','2026-11-15'),                 // 7日より後
  open('d','2026-11-18'), open('d','2026-11-19'),                 // まだ7日たっていない
  open('o','2026-11-01',{owner:true}), open('o','2026-11-02',{owner:true}),
  // iPhone：Safari（s）で開き、ホーム画面（h）から別の日に開いた → 同じブラウザとして数える
  open('s','2026-11-03'),
  { created_at:'2026-11-04T03:00:00Z', session_id:'h', props:{ action:'home_first_launch', appId:'app-1', visitor:'h', ref:'s' } },
  { created_at:'2026-11-04T03:00:00Z', session_id:'h', props:{ action:'standalone_open', appId:'app-1', visitor:'h' } },
], NOW);
assert.equal(ret.others.d1.numerator, 2);   // a と s
assert.equal(ret.others.d1.denominator, 4); // a b c s（d はまだ）
assert.equal(ret.others.d7.numerator, 3);   // a b s
assert.equal(ret.owners.d1.numerator, 1);
assert.equal(ret.owners.d1.denominator, 1);
const apps = [
  ...Array.from({length:3},()=>({created_at:'2026-11-19T01:00:00Z',creator_id:'u1'})), // 昨日（日本時間 11/19）3件
  {created_at:'2026-11-18T01:00:00Z',creator_id:'u2'},                                  // 前日 1件
  ...Array.from({length:2},()=>({created_at:'2026-11-12T01:00:00Z',creator_id:null})),  // 先週の同じ曜日 2件
  {created_at:'2026-11-20T01:00:00Z',creator_id:'u3'},                                  // 今日
];
const cr = R.summarizeCreation(apps, NOW);
assert.equal(cr.yesterday,3); assert.equal(cr.dayBefore,1); assert.equal(cr.sameDayLastWeek,2); assert.equal(cr.today,1);
assert.equal(cr.dayOverDay,2);      // 3/1 - 1
assert.equal(cr.weekOverWeek,0.5);  // 3/2 - 1
assert.equal(cr.last7,4); assert.equal(cr.prev7,2);
const sa = R.summarizeSecondApp([
  {created_at:'2026-11-01T00:00:00Z',creator_id:'p'},{created_at:'2026-11-03T00:00:00Z',creator_id:'p'},  // 2日後に2つ目
  {created_at:'2026-11-01T00:00:00Z',creator_id:'q'},{created_at:'2026-11-12T00:00:00Z',creator_id:'q'},  // 11日後
  {created_at:'2026-11-02T00:00:00Z',creator_id:'r'},                                                      // 1つだけ
  {created_at:'2026-11-18T00:00:00Z',creator_id:'n'},                                                      // まだ7日たっていない
  {created_at:'2026-11-05T00:00:00Z',creator_id:null},
], 30, NOW);
assert.equal(sa.overall.numerator,2); assert.equal(sa.overall.denominator,4);
assert.equal(sa.within7Days.numerator,1); assert.equal(sa.within7Days.denominator,3);
assert.equal(sa.avgDaysToSecond,6.5);
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
console.log('Passed: retention, creation, second app, home installs, auto icon, deduplication, share denominators, repeat use, author exclusion, icon catalog validation.');
