import {
  Activity,
  BarChart3,
  BookOpen,
  Bot,
  Briefcase,
  Clapperboard,
  Gamepad2,
  House,
  LayoutGrid,
  ListChecks,
  Palette,
  type LucideIcon,
} from "lucide-react";

/** カテゴリID → アイコン（絵文字は使わず、線の太さを揃えたSVGで統一する） */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  business: Briefcase,
  productivity: ListChecks,
  lifestyle: House,
  education: BookOpen,
  stats: BarChart3,
  ai_tools: Bot,
  entertainment: Clapperboard,
  hobbies: Palette,
  sports: Activity,
  games: Gamepad2,
  other: LayoutGrid,
};

export function getCategoryIcon(categoryId?: string | null): LucideIcon {
  if (categoryId && CATEGORY_ICONS[categoryId]) return CATEGORY_ICONS[categoryId];
  return LayoutGrid;
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
