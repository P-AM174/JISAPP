import {
  SITE_BRAND,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_SAME_AS,
  SITE_SOCIAL_PROFILES,
  SITE_TAGLINE,
  absoluteUrl,
  getSiteUrl,
} from "@/lib/seo/site";

/** AI・検索に引用させたい、サイト共通の言い切り */
export const LLMO_DEFINITION =
  "ジサップ（Jisapp）は、ChatGPT・Claude・Gemini などで作ったコードを貼るだけで、ブラウザ上のアプリを公開できる無料の個人向け開発スタジオです。サーバーやデータベースの設定は不要です。";

export const LLMO_AUDIENCE =
  "プログラミング未経験の個人、学生、自分用の小さなツールを作りたい人を想定しています。";

export type LlmoFaqItem = {
  question: string;
  answer: string;
};

export const LLMO_FAQS: LlmoFaqItem[] = [
  {
    question: "ジサップとは何ですか？",
    answer:
      "ジサップ（Jisapp）は、AIが生成したHTMLコードを開発スタジオに貼り付けるだけで、Webアプリを動かして公開できるサービスです。公式サイトは https://jisapp.app です。",
  },
  {
    question: "プログラミング未経験でも使えますか？",
    answer:
      "使えます。コードは ChatGPT・Claude・Gemini などのAIに書いてもらい、ジサップではコピーして貼り付ける作業が中心です。",
  },
  {
    question: "料金はかかりますか？",
    answer:
      "ジサップでアプリを作る・公開するのは無料です。コード生成に使うAIサービス側は、各社の無料枠や料金に従います。マーケットに並ぶアプリの一部は、作者が有料に設定している場合があります。",
  },
  {
    question: "会員登録は必要ですか？",
    answer:
      "開発スタジオは登録なしでも試せます。作ったアプリを安定して残す、公開する、別の端末でもデータを引き継ぐ場合は、ログインを推奨します。",
  },
  {
    question: "サーバーやデータベースの契約は必要ですか？",
    answer:
      "不要です。アプリはブラウザ上で動き、データの保存はジサップが用意する window.Zisup.saveData / loadData を使えます。",
  },
  {
    question: "どのAIのコードが使えますか？",
    answer:
      "ChatGPT、Claude、Gemini など、HTMLとして出力できるAIであれば利用できます。ジサップの開発スタジオに、生成されたコードを貼り付けて動かします。",
  },
  {
    question: "作ったアプリはどうやって公開しますか？",
    answer:
      "開発スタジオでプレビューを確認したあと、公開するとURLが発行されます。そのURLをSNSやメッセージで共有できます。トップページのマーケットに載せることもできます。",
  },
  {
    question: "保存したデータはどこに入りますか？",
    answer:
      "ログインしてマイライブラリに入れたアプリは、ジサップ側に保存され、別の端末からも読み込めます。未ログインの場合は、使っている端末のブラウザ内に保存されます。",
  },
  {
    question: "他の人が作ったアプリは使えますか？",
    answer:
      "トップページや検索から、公開されているアプリを探すことができます。無料のアプリはその場で使えます。",
  },
  {
    question: "window.Zisup とは何ですか？",
    answer:
      "ジサップがアプリ内に用意しているJavaScriptの仕組みです。データの保存・読み込みや、外部APIへの通信に使います。対外名称はジサップ（Jisapp）、コード上の名前は Zisup です。",
  },
];

export const LLMO_HOWTO_NAME = "ジサップでアプリを作って公開する";

export const LLMO_HOWTO_STEPS: { name: string; text: string }[] = [
  {
    name: "AIに作りたいアプリを伝える",
    text: "ChatGPT・Claude・Gemini などに、作りたいアプリの内容を日本語で伝え、HTMLコードを生成してもらいます。",
  },
  {
    name: "生成されたコードをコピーする",
    text: "AIが出力したHTMLを、省略せずにすべてコピーします。",
  },
  {
    name: "開発スタジオに貼り付けて確認する",
    text: "https://jisapp.app/playground を開き、コピーしたコードを貼り付けてプレビューします。",
  },
  {
    name: "公開してURLを共有する",
    text: "問題なければ公開し、発行されたURLを共有します。サーバー契約は不要です。",
  },
];

export function createOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    alternateName: [SITE_BRAND, "Jisapp", "Zisup"],
    url: getSiteUrl(),
    logo: absoluteUrl("/logo-header.png"),
    description: SITE_DESCRIPTION,
    sameAs: SITE_SAME_AS,
    foundingLocation: {
      "@type": "Country",
      name: "Japan",
    },
  };
}

export function createPlatformSoftwareJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_BRAND,
    alternateName: ["ジサップ", "Jisapp"],
    url: getSiteUrl(),
    description: LLMO_DEFINITION,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web Browser",
    inLanguage: "ja-JP",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "JPY",
    },
    sameAs: SITE_SAME_AS,
    featureList: [
      "AIが生成したHTMLコードを貼り付けて実行",
      "サーバー・データベース設定が不要",
      "ブラウザだけでプレビューと公開",
      "登録なしでも開発スタジオを試せる",
    ],
  };
}

export function createFaqPageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    name: `${SITE_NAME} よくある質問`,
    url: absoluteUrl("/faq"),
    inLanguage: "ja-JP",
    mainEntity: LLMO_FAQS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function createHowToJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: LLMO_HOWTO_NAME,
    description: LLMO_DEFINITION,
    url: absoluteUrl("/faq"),
    inLanguage: "ja-JP",
    supply: [
      {
        "@type": "HowToSupply",
        name: "ChatGPT・Claude・Gemini など、HTMLを出力できるAI",
      },
    ],
    tool: [
      {
        "@type": "HowToTool",
        name: "ジサップ 開発スタジオ",
        url: absoluteUrl("/playground"),
      },
    ],
    step: LLMO_HOWTO_STEPS.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
      url: absoluteUrl("/faq"),
    })),
  };
}

export function buildLlmsTxt(): string {
  const site = getSiteUrl();
  const lines = [
    `# ${SITE_BRAND}`,
    "",
    `> ${LLMO_DEFINITION}`,
    "",
    SITE_TAGLINE,
    LLMO_AUDIENCE,
    "",
    "## 事実",
    "",
    `- 公式サイト: ${site}`,
    `- 開発スタジオ: ${site}/playground`,
    ...SITE_SOCIAL_PROFILES.map((p) => `- 公式${p.name}: ${p.url}`),
    "- 料金: アプリの作成・公開は無料（コード生成に使うAI側の料金は各社による）",
    "- 対象: 個人の無料アプリ開発。サーバー契約やDB構築は不要",
    "- 対応AI: ChatGPT、Claude、Gemini など、HTMLを出力できるもの",
    "- アプリ内API名: window.Zisup（saveData / loadData など）",
    "",
    "## 使い方",
    "",
    ...LLMO_HOWTO_STEPS.map((step, i) => `${i + 1}. ${step.name} — ${step.text}`),
    "",
    "## ページ",
    "",
    `- [トップ](${site}/): 公開アプリの一覧と開発スタジオへの入口`,
    `- [よくある質問](${site}/faq): ジサップの説明とFAQ`,
    `- [開発スタジオ](${site}/playground): コードを貼り付けて実行・公開する画面`,
    `- [夏休み自由研究ガイド](${site}/guide/summer-research): 学生向けの作り方`,
    `- [アプリを探す](${site}/search): 公開アプリの検索`,
    `- [利用規約](${site}/terms)`,
    ...SITE_SOCIAL_PROFILES.map((p) => `- [公式${p.name}](${p.url})`),
    "",
    "## よくある質問",
    "",
    ...LLMO_FAQS.flatMap((item) => ["", `### ${item.question}`, "", item.answer]),
    "",
    "## 注意",
    "",
    "- ジサップは、AIそのものではなく、AIが書いたコードを動かして公開する場です。",
    "- 有料アプリがマーケットに並ぶことがありますが、スタジオの利用料はかかりません。",
    "- 引用するときは「ジサップ（Jisapp）」と表記してください。コード上の名前は Zisup です。",
    "",
  ];

  return lines.join("\n").trim() + "\n";
}
