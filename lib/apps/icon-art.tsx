import { createElement, type ComponentType, type ReactNode } from 'react';
import { Calendar, Check, Notebook, Clock, Heart, Thermometer, Book, Users, ShoppingCart, Wallet, PawPrint, Gamepad2, Trophy, Music, MessageCircle, House, Utensils, Coffee, Dumbbell, Bike, Car, Plane, Camera, Palette, Flower2, Trees, Sun, Moon, Cloud, Star, Flame, Gem, Crown, Gift, Cake, Briefcase, Store, Calculator, ChartColumn, GraduationCap, Languages, Lightbulb, Bot, Code, Target, Timer, ListTodo, MapPin, Ticket, Sprout } from 'lucide-react';
import { ICONS, ICON_COLORS } from './icon-catalog';
const symbols = [Calendar,Check,Notebook,Clock,Heart,Thermometer,Book,Users,ShoppingCart,Wallet,PawPrint,Gamepad2,Trophy,Music,MessageCircle,House,Utensils,Coffee,Dumbbell,Bike,Car,Plane,Camera,Palette,Flower2,Trees,Sun,Moon,Cloud,Star,Flame,Gem,Crown,Gift,Cake,Briefcase,Store,Calculator,ChartColumn,GraduationCap,Languages,Lightbulb,Bot,Code,Target,Timer,ListTodo,MapPin,Ticket,Sprout];

type IconNode = [string, Record<string, string | number>][];
type ForwardRefIcon = { render?: (props: object, ref: null) => { props?: { iconNode?: IconNode } } };

/**
 * lucide のアイコンを「ただの <svg>」として取り出す。
 *
 * ホーム画面のアイコン（/api/apps/[id]/icon）は next/og（Satori）で PNG にしている。
 * Satori は forwardRef のコンポーネントや useContext を描けないため、
 * <Calendar /> をそのまま渡すと記号が消え、背景色だけの画像になっていた（iPhone のホーム画面で背景色しか出ない原因）。
 * そこで forwardRef の中身（フックを使わない部分）から形のデータ（iconNode）だけを取り出し、
 * 自分で <svg><path/>…</svg> を組み立てる。ブラウザでも Satori でも同じ見た目になる。
 */
function iconNodeOf(component: ComponentType): IconNode {
  try {
    return (component as unknown as ForwardRefIcon).render?.({}, null)?.props?.iconNode ?? [];
  } catch {
    return [];
  }
}

export function IconGlyph({ icon, size, color = '#164E55', strokeWidth = 2.4 }: { icon: string; size: number; color?: string; strokeWidth?: number }): ReactNode {
  const index = ICONS.findIndex(x => x[0] === icon);
  const node = iconNodeOf(symbols[index < 0 ? 0 : index] as ComponentType);
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {node.map(([tag, attrs], i) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { key, ...rest } = attrs;
        return createElement(tag, { ...rest, key: i });
      })}
    </svg>
  );
}

export function IconArt({ icon, color, size = 64, square = false }: { icon: string; color: string; size?: number; square?: boolean }) {
  return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', width:size, height:size, backgroundColor:ICON_COLORS.find(x=>x[0]===color)?.[1] ?? ICON_COLORS[0][1], borderRadius:square?0:size*.22, flexShrink:0 }}>
    <IconGlyph icon={icon} size={size*.55} />
  </div>;
}
