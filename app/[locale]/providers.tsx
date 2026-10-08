"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { LocaleProvider } from "@/lib/i18n/client";
import { PageViewTracker } from "@/components/analytics/page-view-tracker";
import { UsernameSetupGate } from "@/components/username-dialog";
import type { Dictionary, Locale } from "@/lib/i18n/config";

export function Providers({
  children,
  session,
  locale,
  dict,
}: {
  children: React.ReactNode;
  session?: Session | null;
  locale: Locale;
  dict?: Dictionary | null;
}) {
  return (
    <LocaleProvider locale={locale} dict={dict}>
      <PageViewTracker />
      <SessionProvider session={session}>
        {children}
        {/* Google でログインして、まだジサップ用の名前を決めていない人に名前を決めてもらう */}
        <UsernameSetupGate />
      </SessionProvider>
    </LocaleProvider>
  );
}
