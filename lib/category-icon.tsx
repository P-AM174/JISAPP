import {
  BarChart3,
  BookOpen,
  Bot,
  Briefcase,
  Gamepad2,
  House,
  Palette,
  PartyPopper,
  Sparkles,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";

/** カテゴリID → アイコン（絵文字は使わず、線の太さを揃えたSVGで統一する） */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  business: Briefcase,
  productivity: Zap,
  lifestyle: House,
  education: BookOpen,
  stats: BarChart3,
  ai_tools: Bot,
  entertainment: PartyPopper,
  hobbies: Palette,
  sports: Trophy,
  games: Gamepad2,
  other: Sparkles,
};

export function getCategoryIcon(categoryId?: string | null): LucideIcon {
  if (categoryId && CATEGORY_ICONS[categoryId]) return CATEGORY_ICONS[categoryId];
  return Sparkles;
}

export function CategoryIcon({
  categoryId,
  className = "h-4 w-4",
  strokeWidth = 2.25,
}: {
  categoryId?: string | null;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = getCategoryIcon(categoryId);
  return <Icon className={className} strokeWidth={strokeWidth} aria-hidden />;
}
