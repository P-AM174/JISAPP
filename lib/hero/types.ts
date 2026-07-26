export type HeroLayout = "two_column" | "card" | "theme";
export type HeroTheme = "studio" | "violet" | "summer" | "amber" | "cyan";
export type HeroVisual = "studio" | "summer" | "requests" | "phone" | "none";
export type HeroBgPattern = "grid" | "dots" | "none";

export type HeroSlide = {
  id: string;
  sortOrder: number;
  enabled: boolean;
  badge: string | null;
  title: string;
  subtitle: string;
  ctaEnabled: boolean;
  ctaLabel: string | null;
  ctaHref: string | null;
  layout: HeroLayout;
  theme: HeroTheme;
  visualType: HeroVisual | null;
  bgPattern: HeroBgPattern | null;
  featuredAppIds: string[];
  updatedAt?: string;
};

export type HeroFeaturedApp = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  creator_name: string | null;
};

export type HeroSlidePublic = HeroSlide & {
  featuredApps?: HeroFeaturedApp[];
};

export type HeroSlideInput = Omit<HeroSlide, "id" | "updatedAt"> & { id?: string };

export type HeroSlideRow = {
  id: string;
  sort_order: number;
  enabled: boolean;
  badge: string | null;
  title: string;
  subtitle: string;
  cta_enabled: boolean;
  cta_label: string | null;
  cta_href: string | null;
  layout: HeroLayout;
  theme: HeroTheme;
  visual_type: HeroVisual | null;
  bg_pattern: HeroBgPattern | null;
  featured_app_ids: string[] | null;
  updated_at: string;
};
