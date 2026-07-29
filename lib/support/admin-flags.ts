export const ADMIN_FLAG_OPTIONS = [
  { id: "attention", label: "要注意" },
  { id: "review", label: "要確認" },
  { id: "issue", label: "問題あり" },
  { id: "vip", label: "VIP" },
] as const;

export type AdminFlagId = (typeof ADMIN_FLAG_OPTIONS)[number]["id"];

export function adminFlagLabel(id: string): string {
  return ADMIN_FLAG_OPTIONS.find((f) => f.id === id)?.label ?? id;
}
