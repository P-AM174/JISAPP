"use client";

import { CrashScreen } from "@/components/crash-screen";

// 外枠（レイアウト）ごと落ちたときの受け皿。外枠の代わりになるので html・body から書く
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  return (
    <html lang="ja">
      <body style={{ margin: 0 }}>
        <CrashScreen error={error} />
      </body>
    </html>
  );
}
