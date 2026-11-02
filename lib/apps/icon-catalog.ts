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
/**
 * アイコンの背景色：[ID, 背景色, 日本語名, 英語名, 絵の色]。ホーム画面で見つけやすい、はっきりした色（白い絵。黄色だけ濃い絵）。
 * ID は保存されるので変えない
 */
export const ICON_COLORS = [
  ['red','#FF5A5F','赤','Red','#FFFFFF'], ['orange','#FF8A1F','オレンジ','Orange','#FFFFFF'],
  ['yellow','#FFC233','黄色','Yellow','#5A3A00'], ['green','#22C55E','緑','Green','#FFFFFF'],
  ['teal','#14B8A6','青緑','Teal','#FFFFFF'], ['blue','#3B82F6','青','Blue','#FFFFFF'],
  ['indigo','#6366F1','藍色','Indigo','#FFFFFF'], ['purple','#A855F7','紫','Purple','#FFFFFF'],
  ['pink','#EC4899','ピンク','Pink','#FFFFFF'], ['charcoal','#1F2937','黒','Charcoal','#FFFFFF'],
] as const;

/** 前の淡い色の ID（保存済みのアプリ用）を、近い新しい色に引き継ぐ */
const LEGACY_COLORS: Record<string, string> = { mist: 'teal', sage: 'green', aqua: 'teal', stone: 'charcoal' };

export const DEFAULT_ICON = { icon: 'calendar', color: 'teal' };

/** 保存されている色の ID を、今の色の ID にする（前の色は引き継ぎ先に、知らない ID は既定の色に） */
export function normalizeColor(color: string | null | undefined): string {
  const id = color ? LEGACY_COLORS[color] ?? color : DEFAULT_ICON.color;
  return ICON_COLORS.some(x => x[0] === id) ? id : DEFAULT_ICON.color;
}

function colorEntry(color: string) {
  const id = normalizeColor(color);
  return ICON_COLORS.find(x => x[0] === id)!;
}

/** 背景色 */
export function iconColorHex(color: string): string {
  return colorEntry(color)[1];
}

/** 背景色の上に描く絵の色 */
export function iconInkHex(color: string): string {
  return colorEntry(color)[4];
}
/**
 * アイコンごとの「アプリ名・説明に出てきそうな言葉」。カタログの名前（予定・Calendar など）に加えて照らし合わせる。
 * 先に書いたアイコンほど優先する（「犬の散歩記録」はペットを、記録より先に選ぶ）
 */
const KEYWORDS: Record<string, string[]> = {
  'paw-print': ['犬','いぬ','イヌ','わんこ','わんちゃん','猫','ねこ','ネコ','にゃん','うさぎ','ハムスター','金魚','散歩','dog','cat','puppy','kitten','pet'],
  'thermometer': ['体温','検温','thermometer','fever'],
  'heart': ['体重','血圧','健康','服薬','薬','通院','生理','体調','ダイエット','weight','health','medicine','diet'],
  'moon': ['睡眠','眠','sleep','bedtime'],
  'dumbbell': ['筋トレ','トレーニング','運動','ジム','ストレッチ','ランニング','workout','gym','exercise','training','run'],
  'bike': ['自転車','サイクリング','cycling'],
  'utensils': ['料理','レシピ','献立','ごはん','ご飯','食事','弁当','お弁当','cook','recipe','meal','food','lunch'],
  'coffee': ['カフェ','コーヒー','紅茶','お茶','cafe','coffee','tea'],
  'wallet': ['家計','お金','おこづかい','お小遣い','小遣い','節約','貯金','支出','出費','集金','会費','割り勘','money','budget','expense','saving','allowance'],
  'shopping-cart': ['買い物','買物','かいもの','ショッピング','shopping','grocery'],
  'calculator': ['計算','電卓','割引','calculator','calc'],
  'chart-column': ['グラフ','統計','分析','集計','chart','stats','analytics'],
  'gamepad-2': ['ゲーム','クイズ','パズル','すごろく','じゃんけん','ルーレット','game','quiz','puzzle'],
  'trophy': ['ランキング','スコア','大会','試合','優勝','ranking','score','tournament','match'],
  'music': ['音楽','歌','ピアノ','ギター','バンド','カラオケ','music','song','piano','guitar'],
  'book': ['読書','単語','勉強','学習','宿題','ノート','reading','vocab','study','homework'],
  'graduation-cap': ['学校','受験','授業','時間割','テスト','school','exam','class','timetable'],
  'languages': ['英語','英会話','語学','翻訳','english','language','translate'],
  'users': ['部活','サークル','チーム','グループ','みんな','クラス','出欠','出席','メンバー','club','team','group','members','attendance'],
  'message-circle': ['チャット','会話','掲示板','メッセージ','chat','message','board'],
  'gift': ['プレゼント','ギフト','gift','present'],
  'cake': ['誕生日','バースデー','記念日','birthday','anniversary'],
  'ticket': ['イベント','チケット','ライブ','予約','event','ticket','booking'],
  'plane': ['旅行','旅','観光','フライト','travel','trip','flight'],
  'car': ['車','ドライブ','ガソリン','燃費','car','drive'],
  'map-pin': ['地図','場所','スポット','お店','map','place','spot'],
  'camera': ['写真','カメラ','アルバム','photo','camera','album'],
  'palette': ['イラスト','デザイン','お絵かき','art','drawing','design','color'],
  'flower-2': ['花','植物','ガーデニング','flower','plant','garden'],
  'sprout': ['水やり','成長','育成','家庭菜園','grow','sprout'],
  'cloud': ['天気','雨','weather','rain'],
  'flame': ['習慣','継続','連続','チャレンジ','habit','streak','challenge'],
  'target': ['目標','ゴール','goal','target'],
  'timer': ['タイマー','ポモドーロ','ストップウォッチ','カウントダウン','timer','pomodoro','stopwatch','countdown'],
  'clock': ['時計','時間','時刻','clock','time'],
  'list-todo': ['タスク','todo','やること','チェックリスト','やる事','task','checklist','to-do'],
  'check': ['チェック','確認','check'],
  'calendar': ['予定','カレンダー','スケジュール','シフト','日程','calendar','schedule','shift','planner'],
  'notebook': ['日記','記録','メモ','ログ','diary','journal','memo','note','log'],
  'briefcase': ['仕事','業務','勤怠','会議','work','office','meeting'],
  'store': ['ショップ','在庫','売上','注文','store','shop','inventory','sales','order'],
  'house': ['家事','掃除','洗濯','家族','おうち','chore','cleaning','laundry','family','home'],
  'lightbulb': ['アイデア','ひらめき','発想','idea'],
  'bot': ['AI','ロボット','bot','assistant'],
  'code': ['プログラミング','コード','開発','programming','code','developer'],
  'star': ['お気に入り','評価','レビュー','favorite','review','rating'],
};

/** 文章に合うアイコンを、合う順に返す（合うものがなければ空） */
function matchIcons(text: string): string[] {
  const q = text.toLowerCase();
  const hit = (word: string) => word.length > 0 && q.includes(word.toLowerCase());
  const byKeyword = Object.entries(KEYWORDS).filter(([, words]) => words.some(hit)).map(([id]) => id);
  const byName = ICONS.filter(x => hit(x[1]) || hit(x[2])).map(x => x[0] as string);
  return [...new Set([...byKeyword, ...byName])];
}

export function recommendedIcons(title: string, description = ''): string[] {
  return [...new Set<string>([...matchIcons(`${title} ${description}`),'calendar','notebook','check','users','heart','star'])].slice(0,6);
}

/**
 * まだアイコンを選んでいないアプリのアイコン。アプリ名（なければ説明）から合う絵を選び、色はアプリ名から決める。
 * 同じアプリ名なら、いつ呼んでも同じアイコンになる
 */
export function autoIcon(title: string, description = ''): { icon: string; color: string } {
  const icon = matchIcons(title)[0] ?? matchIcons(description)[0] ?? DEFAULT_ICON.icon;
  let hash = 0;
  for (const ch of title) hash = (hash * 31 + ch.codePointAt(0)!) >>> 0;
  return { icon, color: ICON_COLORS[hash % ICON_COLORS.length][0] };
}

export function validIcon(icon: unknown, color: unknown): boolean {
  return ICONS.some(x => x[0] === icon) && ICON_COLORS.some(x => x[0] === color);
}
