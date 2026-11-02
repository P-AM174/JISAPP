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
const {ICONS,ICON_COLORS,validIcon,autoIcon}=load('lib/apps/icon-catalog.ts');
assert.equal(ICONS.length,50);
assert.equal(new Set(ICONS.map(x=>x[0])).size,50);
assert.equal(ICON_COLORS.length,5);
assert.equal(validIcon('calendar','mist'),true);
assert.equal(validIcon('<script>','mist'),false);
assert.equal(autoIcon('わんこ日記').icon,'paw-print');
assert.equal(autoIcon('家計簿').icon,'wallet');
assert.equal(autoIcon('部活の出欠表').icon,'users');
assert.equal(autoIcon('なにか').icon,'calendar');
assert.deepEqual(autoIcon('わんこ日記'),autoIcon('わんこ日記'));
assert.ok(ICONS.some(x=>x[0]===autoIcon('Habit tracker').icon)&&ICON_COLORS.some(x=>x[0]===autoIcon('Habit tracker').color));
console.log('Passed: auto icon, deduplication, share denominators, repeat use, author exclusion, icon catalog validation.');
