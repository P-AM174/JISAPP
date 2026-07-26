import type { HeroSlideInput } from "./types";

const LAYOUTS = new Set(["two_column", "card", "theme"]);
const THEMES = new Set(["studio", "violet", "summer", "amber", "cyan"]);
const VISUALS = new Set(["studio", "summer", "requests", "phone", "none"]);
const PATTERNS = new Set(["grid", "dots", "none"]);

export function validateHeroSlide(input: HeroSlideInput, index = 0): string[] {
  const errors: string[] = [];
  const prefix = `スライド${index + 1}`;

  if (!input.title?.trim()) errors.push(`${prefix}: タイトルは必須です`);
  if (input.title && input.title.length > 80) errors.push(`${prefix}: タイトルは80文字以内`);
  if (!input.subtitle?.trim()) errors.push(`${prefix}: サブタイトルは必須です`);
  if (input.subtitle && input.subtitle.length > 160) errors.push(`${prefix}: サブタイトルは160文字以内`);
  if (input.badge && input.badge.length > 40) errors.push(`${prefix}: バッジは40文字以内`);

  if (!LAYOUTS.has(input.layout)) errors.push(`${prefix}: レイアウトが不正です`);
  if (!THEMES.has(input.theme)) errors.push(`${prefix}: テーマが不正です`);

  if (input.ctaEnabled) {
    if (!input.ctaLabel?.trim()) errors.push(`${prefix}: CTA文言を入力してください`);
    if (!input.ctaHref?.trim()) errors.push(`${prefix}: CTAリンクを入力してください`);
    if (input.ctaHref && !input.ctaHref.startsWith("/")) {
      errors.push(`${prefix}: CTAリンクは / から始めてください`);
    }
    if (input.ctaLabel && input.ctaLabel.length > 30) errors.push(`${prefix}: CTA文言は30文字以内`);
  }

  if (input.visualType && !VISUALS.has(input.visualType)) {
    errors.push(`${prefix}: 右ビジュアルが不正です`);
  }
  if (input.bgPattern && !PATTERNS.has(input.bgPattern)) {
    errors.push(`${prefix}: 背景パターンが不正です`);
  }

  if (input.layout === "card" && (input.featuredAppIds?.length ?? 0) > 3) {
    errors.push(`${prefix}: 表示アプリは最大3件です`);
  }

  return errors;
}

export function validateHeroSlides(slides: HeroSlideInput[]): string[] {
  return slides.flatMap((s, i) => validateHeroSlide(s, i));
}
