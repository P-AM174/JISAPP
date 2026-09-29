"use client";

/**
 * next/link・next/navigation の代わりに使う。
 * サイト内のリンク先に、表示中の言語（英語なら /en）を自動でつける。
 */
import NextLink from "next/link";
import {
  usePathname as useNextPathname,
  useRouter as useNextRouter,
} from "next/navigation";
import { forwardRef, useMemo, type ComponentProps } from "react";
import { localizePath, stripLocale } from "./config";
import { useLocale } from "./client";

type LinkProps = ComponentProps<typeof NextLink>;

const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link({ href, ...rest }, ref) {
  const locale = useLocale();
  let localized: LinkProps["href"] = href;
  if (typeof href === "string") {
    localized = localizePath(href, locale);
  } else if (href && typeof href === "object" && typeof href.pathname === "string") {
    localized = { ...href, pathname: localizePath(href.pathname, locale) };
  }
  return <NextLink ref={ref} href={localized} {...rest} />;
});

export default Link;
export { Link };

/** router.push("/apps/1") が英語表示中は /en/apps/1 に行く */
export function useRouter() {
  const router = useNextRouter();
  const locale = useLocale();
  return useMemo(
    () => ({
      ...router,
      push: (href: string, options?: Parameters<typeof router.push>[1]) =>
        router.push(localizePath(href, locale), options),
      replace: (href: string, options?: Parameters<typeof router.replace>[1]) =>
        router.replace(localizePath(href, locale), options),
      prefetch: (href: string, options?: Parameters<typeof router.prefetch>[1]) =>
        router.prefetch(localizePath(href, locale), options),
    }),
    [router, locale]
  );
}

/** 言語部分を除いたパス（"/en/apps/1" でも "/apps/1"） */
export function usePathname(): string {
  return stripLocale(useNextPathname() ?? "/");
}

/** window.location.href などに使う、言語つきのパス */
export function useLocalizePath() {
  const locale = useLocale();
  return (path: string) => localizePath(path, locale);
}
