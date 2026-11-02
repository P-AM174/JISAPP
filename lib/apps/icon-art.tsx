import { createElement } from 'react';
import { Calendar, Check, Notebook, Clock, Heart, Thermometer, Book, Users, ShoppingCart, Wallet, PawPrint, Gamepad2, Trophy, Music, MessageCircle, House, Utensils, Coffee, Dumbbell, Bike, Car, Plane, Camera, Palette, Flower2, Trees, Sun, Moon, Cloud, Star, Flame, Gem, Crown, Gift, Cake, Briefcase, Store, Calculator, ChartColumn, GraduationCap, Languages, Lightbulb, Bot, Code, Target, Timer, ListTodo, MapPin, Ticket, Sprout } from 'lucide-react';
import { ICONS, ICON_COLORS } from './icon-catalog';
const symbols = [Calendar,Check,Notebook,Clock,Heart,Thermometer,Book,Users,ShoppingCart,Wallet,PawPrint,Gamepad2,Trophy,Music,MessageCircle,House,Utensils,Coffee,Dumbbell,Bike,Car,Plane,Camera,Palette,Flower2,Trees,Sun,Moon,Cloud,Star,Flame,Gem,Crown,Gift,Cake,Briefcase,Store,Calculator,ChartColumn,GraduationCap,Languages,Lightbulb,Bot,Code,Target,Timer,ListTodo,MapPin,Ticket,Sprout];
export function IconArt({ icon, color, size = 64, square = false }: { icon: string; color: string; size?: number; square?: boolean }) {
  const index = ICONS.findIndex(x => x[0] === icon);
  return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', width:size, height:size, backgroundColor:ICON_COLORS.find(x=>x[0]===color)?.[1] ?? ICON_COLORS[0][1], borderRadius:square?0:size*.22, flexShrink:0 }}>
    {createElement(symbols[index < 0 ? 0 : index], { size: size*.55, color:'#164E55', strokeWidth:2.4 })}
  </div>;
}
