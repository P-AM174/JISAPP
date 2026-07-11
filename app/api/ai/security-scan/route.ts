import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/api-auth";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI審査機能が設定されていません" }, { status: 503 });
  }

  try {
    const { code, title, description } = await req.json();
    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "コードが必要です" }, { status: 400 });
    }

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [
          {
            role: "system",
            content:
              "あなたはアプリマーケットプレイスのセキュリティ審査AIです。提供されたコードを分析し、悪意のあるスクリプト、フィッシング、外部への不正送信の疑いがあるか判定してください。JSONのみで返答: {\"verdict\":\"PASS\"|\"WARN\"|\"REJECT\",\"reason\":\"...\"}",
          },
          {
            role: "user",
            content: `タイトル: ${title ?? ""}\n説明: ${description ?? ""}\n\nコード:\n${code.slice(0, 8000)}`,
          },
        ],
        max_tokens: 256,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "AI審査に失敗しました" }, { status: 500 });
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content ?? "";
    try {
      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json({ verdict: "WARN", reason: raw || "審査結果を解析できませんでした" });
    }
  } catch {
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }
}
