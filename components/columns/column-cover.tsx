import { tagStyle } from "@/lib/columns/tags";

/** 見出し画像。ないときはタグの色と絵で表紙を作る */
export function ColumnCover({ src, tags, className = "", big }: { src: string | null; tags: string[]; className?: string; big?: boolean }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" loading={big ? "eager" : "lazy"} className={`aspect-[1.91/1] w-full object-cover ${className}`} />;
  }
  const s = tagStyle(tags);
  return (
    <div className={`flex aspect-[1.91/1] w-full items-center justify-center ${className}`} style={{ background: s.bg }} aria-hidden>
      <span className={big ? "text-6xl" : "text-3xl"}>{s.emoji}</span>
    </div>
  );
}
