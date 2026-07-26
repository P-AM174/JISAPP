export const STUDIO_LOGIN_PROMPT_KEY = "jisapp_studio_login_prompt_shown";

export function wasStudioLoginPromptShown(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(STUDIO_LOGIN_PROMPT_KEY) === "1";
  } catch {
    return false;
  }
}

export function markStudioLoginPromptShown(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STUDIO_LOGIN_PROMPT_KEY, "1");
  } catch {
    /* noop */
  }
}
