export type StudioAi = {
  id: "chatgpt" | "claude" | "gemini" | "other";
  name: string;
  /** null のときはサイトを開かず、指示文のコピーだけ行う */
  url: string | null;
};

/** プロンプトはURLに入れるには長すぎるため、コピーしてからAIを開く */
export const STUDIO_AIS: StudioAi[] = [
  { id: "chatgpt", name: "ChatGPT", url: "https://chatgpt.com/" },
  { id: "claude", name: "Claude", url: "https://claude.ai/new" },
  { id: "gemini", name: "Gemini", url: "https://gemini.google.com/app" },
  { id: "other", name: "別のAI", url: null },
];

export function findStudioAi(id: string | null | undefined): StudioAi {
  return STUDIO_AIS.find((ai) => ai.id === id) ?? STUDIO_AIS[0];
}

/**
 * クリック処理の中で同期的にコピーする。
 * SNS のアプリ内ブラウザでは navigator.clipboard が使えないことがあるため execCommand も併用する。
 */
export function copyTextNow(text: string): boolean {
  let ok = false;
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "0";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    ok = document.execCommand("copy");
    ta.remove();
  } catch {
    ok = false;
  }
  return ok;
}

/** 同期コピーを試し、だめなら Clipboard API で再挑戦する。成功したかを返す */
export async function copyText(text: string): Promise<boolean> {
  if (copyTextNow(text)) return true;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
