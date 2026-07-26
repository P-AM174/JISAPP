import { createPageMetadata } from "@/lib/seo/metadata";
import { SummerResearchGuide } from "@/components/guide/summer-research-guide";

export const metadata = createPageMetadata({
  title: "夏休み自由研究｜アプリの作り方",
  description:
    "小学生向けに、夏休みの自由研究でアプリを作って提出する方法を8ステップで解説。テーマの決め方、AIへの指示、開発スタジオでの公開、レポートの書き方まで。",
  path: "/guide/summer-research",
});

export default function SummerResearchGuidePage() {
  return <SummerResearchGuide />;
}
