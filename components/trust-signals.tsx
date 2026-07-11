import { ShieldCheck } from "lucide-react";

export function TrustFooter() {
  return (
    <footer className="container mx-auto border-t border-border px-4 py-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" />
          AI安全審査・エスクロー決済対応（準備中）
        </div>
        <p className="max-w-lg text-sm text-muted-foreground">
          ジサップは個人間ツール売買を安心して行えるマーケットプレイスです。
        </p>
      </div>
    </footer>
  );
}
