"use client";

import { CrashScreen } from "@/components/crash-screen";

// ページが落ちたときの受け皿（ヘッダーなどの外枠は残したまま、中身だけ差し替える）
export default function ErrorPage({ error }: { error: Error & { digest?: string } }) {
  return <CrashScreen error={error} />;
}
