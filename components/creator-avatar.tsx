import { isOfficialCreatorName } from "@/lib/official-name";

/**
 * 作者のアイコンの中身。ジサップ公式だけはロゴの画像、それ以外は名前の頭文字。
 * 置く枠（大きさ・角丸・色）は呼ぶ側のものをそのまま使い、公式のときは画像で枠を埋める。
 */
export function CreatorAvatarContent({ name }: { name: string | null | undefined }) {
  if (isOfficialCreatorName(name)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src="/apple-touch-icon.png" alt="" aria-hidden className="h-full w-full rounded-[inherit] bg-white object-cover" />
    );
  }
  return <>{name?.trim()[0]?.toUpperCase() ?? "?"}</>;
}
