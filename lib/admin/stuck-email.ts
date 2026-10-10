/**
 * 開発スタジオでうまく作れなかった人に、運営が作ったアプリを届けるメールのひな形。
 * 本文の {link} は、送るときにサーバーでアプリのURLに置き換える。（ベトナム語はネイティブ未確認）
 */
import { contactUrl } from "@/lib/contact-url";

export function stuckDeliveryEmail(lang: "ja" | "en" | "vi", name: string | null): { subject: string; text: string } {
  const n = (name ?? "").trim();
  if (lang === "en") {
    return {
      subject: "We built the app you were making on Jisapp",
      text: [
        `Hi ${n || "there"}, thank you for using Jisapp.`,
        "",
        "It looked like the app you were making in the Studio didn't quite come together, so our team built it from what you wrote:",
        "{link}",
        "",
        "It's yours to use and change however you like. Sign in to Jisapp and you'll find it in My projects.",
        "",
        "[Tip for next time]",
        "Before copying the code from the AI, make sure it has completely finished writing:",
        "・The text has stopped moving",
        '・The send button is back to "↑" (not "■" stop)',
        "・The code ends with </html>",
        "If you press copy while it's still writing, nothing is copied and the prompt you copied earlier gets pasted.",
        "",
        "This address can't receive replies. Questions? Contact us here:",
        contactUrl("en"),
        "",
        "Jisapp team",
      ].join("\n"),
    };
  }
  if (lang === "vi") {
    return {
      subject: "Đội ngũ Jisapp đã làm giúp app bạn đang làm",
      text: [
        `Chào ${n || "bạn"}, cảm ơn bạn đã dùng Jisapp.`,
        "",
        "Có vẻ app bạn làm trong Studio chưa chạy được, nên đội ngũ Jisapp đã làm app từ nội dung bạn viết:",
        "{link}",
        "",
        "Bạn có thể dùng và sửa tùy thích. Đăng nhập Jisapp để xem trong Dự án của tôi.",
        "",
        "[Mẹo cho lần sau]",
        "Trước khi sao chép code từ AI, hãy chắc chắn AI đã viết xong:",
        "・Chữ đã ngừng chạy",
        "・Nút gửi đã trở lại “↑” (không phải “■” dừng)",
        "・Code kết thúc bằng </html>",
        "Nếu bấm sao chép khi AI vẫn đang viết, sẽ không sao chép được và câu lệnh bạn sao chép trước đó sẽ bị dán vào.",
        "",
        "Địa chỉ email này chỉ dùng để gửi. Có câu hỏi, hãy liên hệ tại:",
        contactUrl("vi"),
        "",
        "Đội ngũ Jisapp",
      ].join("\n"),
    };
  }
  return {
    subject: "作ろうとしていたアプリを、ジサップ運営が作りました",
    text: [
      `${n ? `${n}さん、` : ""}ジサップを使ってくださってありがとうございます。`,
      "",
      "開発スタジオで作ろうとしていたアプリが、うまく完成しなかったようでしたので、書いていただいた内容をもとに、運営がアプリを作りました。",
      "{link}",
      "",
      "このアプリは自由に使って、作り変えていただけます。ジサップにログインすると、マイプロジェクトに入っています。",
      "",
      "【次からのコツ】",
      "AIのコードをコピーする前に、AIが★最後まで書き終わったか★を確かめてください。",
      "・AIの文字が動かなくなった",
      "・送信ボタンが「■（停止）」から元の「↑」に戻った",
      "・コードの最後が </html> で終わっている",
      "書いている途中にコピーを押すとコピーできておらず、前にコピーしたプロンプトが貼られてしまいます。",
      "",
      "このメールは送信専用のため、返信いただいても届きません。お問い合わせは次のフォームからお願いします。",
      contactUrl("ja"),
      "",
      "ジサップ運営",
    ].join("\n"),
  };
}
