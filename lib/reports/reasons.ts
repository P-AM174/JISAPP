export const APP_REPORT_REASONS = [
  "不適切なコンテンツ",
  "スパム・詐欺",
  "悪意のあるコード",
  "著作権侵害",
  "その他",
] as const;

export type AppReportReason = (typeof APP_REPORT_REASONS)[number];

export function isValidReportReason(reason: string): reason is AppReportReason {
  return (APP_REPORT_REASONS as readonly string[]).includes(reason);
}
