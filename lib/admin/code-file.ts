/**
 * 運営管理：出品アプリのコードを 1 つのファイルにまとめて、コピー・保存する。
 */

/** HTML・CSS・JS を、そのまま動く 1 つの HTML にまとめる（CSS・JS が空なら HTML をそのまま返す） */
export function combineAppCode(html: string, css: string, js: string): string {
  let out = html;
  if (css.trim()) {
    const style = `<style>\n${css}\n</style>`;
    out = /<\/head>/i.test(out) ? out.replace(/<\/head>/i, `${style}\n</head>`) : `${style}\n${out}`;
  }
  if (js.trim()) {
    const script = `<script>\n${js}\n</script>`;
    out = /<\/body>/i.test(out) ? out.replace(/<\/body>(?![\s\S]*<\/body>)/i, `${script}\n</body>`) : `${out}\n${script}`;
  }
  return out;
}

/** 例: jisapp-0012-タイマー-20260927.txt */
export function codeFileName(title: string, appNumber: number): string {
  const safe = (title.trim() || "app")
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 40);
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  return `jisapp-${String(appNumber).padStart(4, "0")}-${safe}-${stamp}.txt`;
}

/**
 * テキストファイルとして保存する。
 * iPhone は download 属性が使えないことがあるため、共有シート → ダウンロード の順に試す。
 */
export async function saveTextFile(
  text: string,
  fileName: string
): Promise<"shared" | "downloaded" | "cancelled" | "failed"> {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (isMobile && typeof File !== "undefined" && navigator.canShare) {
    const file = new File([text], fileName, { type: "text/plain" });
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        return "shared";
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return "cancelled";
      }
    }
  }

  const anchor = document.createElement("a");
  if (!("download" in anchor)) return "failed";
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return "downloaded";
}
