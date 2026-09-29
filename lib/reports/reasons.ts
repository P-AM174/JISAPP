export const APP_REPORT_REASONS = [
  "不適切なコンテンツ",
  "スパム・詐欺",
  "悪意のあるコード",
  "著作権侵害",
  "その他",
] as const;

/** 英語表示用。送信する値は日本語のまま（運営画面・DB と揃える） */
export const APP_REPORT_REASON_EN: Record<(typeof APP_REPORT_REASONS)[number], string> = {
  不適切なコンテンツ: "Inappropriate content",
  "スパム・詐欺": "Spam or scam",
  悪意のあるコード: "Malicious code",
  著作権侵害: "Copyright infringement",
  その他: "Other",
};

export type AppReportReason = (typeof APP_REPORT_REASONS)[number];

export function isValidReportReason(reason: string): reason is AppReportReason {
  return (APP_REPORT_REASONS as readonly string[]).includes(reason);
}
