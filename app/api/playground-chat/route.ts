import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/api-auth";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPT = `あなたはジサップ（Jisapp）の初心者案内役です。
ユーザーからの「APIキーとは？」「保存ボタンはどこ？」などの環境の質問や、
「〇〇なアプリを作りたいときのAIへのプロンプトのコツ」に、優しく丁寧に答えてください。
コード自体を出力することやコードの読み取りは避けてください。
回答は短く分かりやすく、初心者が理解できる言葉で書いてください。
絵文字を適度に使って親しみやすいトーンを保ってください。`;

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI機能が設定されていません" }, { status: 503 });
  }

  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
    }

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        max_tokens: 512,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error("Groq error:", await response.text());
      return NextResponse.json({ error: "AI response failed" }, { status: 500 });
    }

    const data = await response.json();
    const content =
      data.choices?.[0]?.message?.content ?? "すみません、うまく答えられませんでした😅";

    return NextResponse.json({ content });
  } catch (e) {
    console.error("Chat route error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
