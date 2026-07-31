import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/api-auth";
import { detectAiProvider } from "@/lib/secrets/constants";
import { getUserAiSecret } from "@/lib/secrets/user-secrets";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

const SYSTEM_PROMPT = `あなたはジサップ（Jisapp）の初心者案内役です。
ユーザーからの「APIキーとは？」「保存ボタンはどこ？」などの環境の質問や、
「〇〇なアプリを作りたいときのAIへのプロンプトのコツ」に、優しく丁寧に答えてください。
外部APIを使うアプリでは、APIキーをコードに書かず開発スタジオの「シークレット」に登録し、コードでは secret: 'NAME' だけ使うよう案内してください。
コード自体を出力することやコードの読み取りは避けてください。
回答は短く分かりやすく、初心者が理解できる言葉で書いてください。
絵文字を適度に使って親しみやすいトーンを保ってください。`;

async function callAiChat(
  provider: "groq" | "openai",
  apiKey: string,
  messages: Array<{ role: string; content: string }>
): Promise<string> {
  const url = provider === "groq" ? GROQ_API_URL : OPENAI_API_URL;
  const model = provider === "groq" ? "llama3-8b-8192" : "gpt-4o-mini";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      max_tokens: 512,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    console.error("AI provider error:", await response.text());
    throw new Error("AI response failed");
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "すみません、うまく答えられませんでした";
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const apiKey = await getUserAiSecret(userId);
  if (!apiKey) {
    return NextResponse.json(
      {
        error: "AI APIキーを設定してください",
        code: "AI_KEY_REQUIRED",
      },
      { status: 403 }
    );
  }

  const provider = detectAiProvider(apiKey);
  if (!provider) {
    return NextResponse.json(
      { error: "登録されたAPIキーの形式が不正です。設定から再登録してください" },
      { status: 400 }
    );
  }

  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
    }

    const content = await callAiChat(provider, apiKey, messages);
    return NextResponse.json({ content });
  } catch (e) {
    console.error("Chat route error:", e);
    return NextResponse.json({ error: "AI応答に失敗しました。APIキーを確認してください" }, { status: 500 });
  }
}
