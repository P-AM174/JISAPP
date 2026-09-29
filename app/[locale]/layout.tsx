import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Geist, Geist_Mono, Noto_Sans_JP } from "next/font/google";
import "../globals.css";
import { Providers } from "./providers";
import { JsonLd } from "@/components/seo/json-ld";
import { createRootMetadata, createWebsiteJsonLd } from "@/lib/seo/metadata";
import {
  createOrganizationJsonLd,
  createPlatformSoftwareJsonLd,
} from "@/lib/seo/llmo";
import { LOCALES, isLocale } from "@/lib/i18n/config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  preload: false,
  weight: ["400", "500", "700", "900"],
  display: "swap",
});

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return {
    ...createRootMetadata(locale),
    icons: {
      icon: [
        { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      ],
      shortcut: "/logo-header.png",
      apple: "/apple-touch-icon.png",
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoSansJP.variable} min-h-screen antialiased`}
      >
        <JsonLd data={createWebsiteJsonLd(locale)} />
        <JsonLd data={createOrganizationJsonLd(locale)} />
        <JsonLd data={createPlatformSoftwareJsonLd(locale)} />
        <Providers locale={locale}>{children}</Providers>
      </body>
    </html>
  );
}
