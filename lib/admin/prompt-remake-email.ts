/**
 * プロンプトが入っていて動かなかったアプリを、運営が作り直したときに作者へ送るメールのひな形。
 * 本文の {link} は、送るときにサーバーでアプリのURLに置き換える。
 * よくある原因：AIのチャットで自分が送った文章のコピーボタンを押した／AIが書き終わる前にコピーした
 * （ベトナム語はネイティブ未確認）
 */
export type MailLang = "ja" | "en" | "vi";

export function promptRemakeEmail(lang: MailLang, creatorName: string | null, appTitle: string): { subject: string; text: string } {
  const name = (creatorName ?? "").trim();
  if (lang === "en") {
    return {
      subject: `Your app "${appTitle}" now works`,
      text: [
        `Hi ${name || "there"}, thank you for using Jisapp.`,
        "",
        `The app you published, "${appTitle}", contained the message meant for the AI (the prompt) instead of the app's code, so it wasn't working.`,
        "We built the app from that message, and it works now:",
        "{link}",
        "",
        "[A common cause]",
        "In the AI chat, pressing the copy button under the message you sent copies your message, not the code.",
        "Copying before the AI has finished also leaves the code incomplete.",
        "",
        "[Next time]",
        "1. WAIT UNTIL THE AI HAS FINISHED WRITING all the code",
        '2. In the AI\'s reply, press the "Copy" button at the top right of the code box',
        '3. Before pasting into Jisapp, check that what you copied starts with something like "<!DOCTYPE html>" (if it starts with normal sentences, it isn\'t code)',
        "",
        "You're free to change the app however you like. If anything is unclear, just reply to this email.",
        "",
        "Jisapp team",
      ].join("\n"),
    };
  }
  if (lang === "vi") {
    return {
      subject: `App "${appTitle}" của bạn đã chạy được rồi`,
      text: [
        `Chào ${name || "bạn"}, cảm ơn bạn đã dùng Jisapp.`,
        "",
        `App "${appTitle}" bạn đăng chứa đoạn văn gửi cho AI (câu lệnh) thay vì code của app, nên chưa chạy được.`,
        "Đội ngũ Jisapp đã làm app từ đoạn văn đó và giờ app đã chạy được:",
        "{link}",
        "",
        "[Nguyên nhân thường gặp]",
        "Trong khung chat AI, nếu bấm nút sao chép bên dưới tin nhắn bạn đã gửi thì sẽ sao chép tin nhắn đó, không phải code.",
        "Sao chép trước khi AI viết xong thì code cũng sẽ bị thiếu.",
        "",
        "[Lần sau]",
        "1. CHỜ AI VIẾT XONG toàn bộ code",
        "2. Trong câu trả lời của AI, bấm nút \"Sao chép\" ở góc trên bên phải khung code",
        "3. Trước khi dán vào Jisapp, kiểm tra nội dung đã sao chép có bắt đầu bằng \"<!DOCTYPE html>\" hay không (nếu bắt đầu bằng câu chữ bình thường thì đó không phải code)",
        "",
        "Bạn có thể tự do sửa app theo ý mình. Có gì chưa rõ, bạn cứ trả lời email này nhé.",
        "",
        "Đội ngũ Jisapp",
      ].join("\n"),
    };
  }
  return {
    subject: `あなたのアプリ「${appTitle}」が動くようになりました`,
    text: [
      `${name ? `${name}さん、` : ""}ジサップを使ってくださってありがとうございます。`,
      "",
      `公開していただいた「${appTitle}」には、アプリのコードではなく、AI に送るための文章（プロンプト）が入っていたため、動かない状態でした。`,
      "運営でこの文章をもとにアプリを作り、動くようにしました。今はこちらから使えます。",
      "{link}",
      "",
      "【よくある原因】",
      "AI のチャットで、自分が送った文章の下にあるコピーボタンを押すと、コードではなく送った文章がコピーされます。",
      "また、AI がコードを書き終える前にコピーすると、コードが途中までしか入りません。",
      "",
      "【次からのコツ】",
      "1. ★AI がコードを【最後まで書き終わるのを待つ】★",
      "2. AI の返事の中にある、コードの枠の右上の「コピー」を押す",
      "3. ジサップに貼る前に、コピーしたものが「<!DOCTYPE html>」などの英語の記号で始まっているか確かめる（日本語の文章で始まっていたら、それはコードではありません）",
      "",
      "中身は自由に作り変えられます。分からないことがあれば、このメールに返信してください。",
      "",
      "ジサップ運営",
    ].join("\n"),
  };
}
