/** Stable IDs: existing installations must keep resolving their selected icon. */
export const ICONS = [
  ['calendar','予定','Calendar'], ['check','チェック','Check'], ['notebook','記録','Notes'], ['clock','時計','Clock'], ['heart','健康','Health'],
  ['thermometer','体温','Temperature'], ['book','学習','Study'], ['users','グループ','Group'], ['shopping-cart','買い物','Shopping'], ['wallet','お金','Money'],
  ['paw-print','ペット','Pets'], ['gamepad-2','ゲーム','Games'], ['trophy','トロフィー','Trophy'], ['music','音楽','Music'], ['message-circle','会話','Chat'],
  ['house','家','Home'], ['utensils','料理','Cooking'], ['coffee','カフェ','Coffee'], ['dumbbell','運動','Fitness'], ['bike','自転車','Bike'],
  ['car','車','Car'], ['plane','旅行','Travel'], ['camera','写真','Photo'], ['palette','アート','Art'], ['flower-2','花','Flower'],
  ['trees','自然','Nature'], ['sun','太陽','Sun'], ['moon','睡眠','Sleep'], ['cloud','天気','Weather'], ['star','星','Star'],
  ['flame','習慣','Habit'], ['gem','宝石','Gem'], ['crown','王冠','Crown'], ['gift','贈り物','Gift'], ['cake','誕生日','Birthday'],
  ['briefcase','仕事','Work'], ['store','店舗','Store'], ['calculator','計算','Calculator'], ['chart-column','統計','Statistics'], ['graduation-cap','学校','School'],
  ['languages','語学','Languages'], ['lightbulb','アイデア','Ideas'], ['bot','AI','AI'], ['code','コード','Code'], ['target','目標','Goals'],
  ['timer','タイマー','Timer'], ['list-todo','タスク','Tasks'], ['map-pin','場所','Places'], ['ticket','イベント','Events'], ['sprout','成長','Growth'],
] as const;
export const ICON_COLORS = [
  ['mist','#DCE8E5','ミネラルミスト','Mineral mist'], ['sage','#E1E9E2','シーソルトセージ','Sea salt sage'],
  ['blue','#DCE6ED','パールブルー','Pearl blue'], ['aqua','#D8E9E7','ポーセリンアクア','Porcelain aqua'], ['stone','#E4E7E5','クラウドストーン','Cloud stone'],
] as const;
export const DEFAULT_ICON = { icon: 'calendar', color: 'mist' };
export function iconColorHex(color: string): string {
  return ICON_COLORS.find(x => x[0] === color)?.[1] ?? ICON_COLORS[0][1];
}
export function recommendedIcons(title: string): string[] {
  const q=title.toLowerCase();
  const matches=ICONS.filter(x=>q.includes(x[1])||q.includes(x[2].toLowerCase())).map(x=>x[0]);
  return [...new Set<string>([...matches,'calendar','notebook','check','users','heart','star'])].slice(0,6);
}
export function validIcon(icon: unknown, color: unknown): boolean {
  return ICONS.some(x => x[0] === icon) && ICON_COLORS.some(x => x[0] === color);
}
