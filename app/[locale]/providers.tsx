"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { LocaleProvider } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n/config";

export function Providers({
  children,
  session,
  locale,
}: {
  children: React.ReactNode;
  session?: Session | null;
  locale: Locale;
}) {
  return (
    <LocaleProvider locale={locale}>
      <SessionProvider session={session}>{children}</SessionProvider>
    </LocaleProvider>
  );
}
