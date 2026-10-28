import type { NextConfig } from "next";

/**
 * どのページにも付ける守り。
 * ・HSTS：https 以外でつながせない（なりすましの Wi-Fi などで盗み見されない）
 * ・nosniff：ファイルの種類をブラウザに推測させない
 * ・X-Frame-Options / frame-ancestors：ほかのサイトにジサップを埋め込ませない（クリックをだます攻撃の対策）
 * ・Referrer-Policy：ほかのサイトへ移るとき、ページのアドレス（招待の印など）を渡さない
 * ・Permissions-Policy：ジサップ本体では使わない機能を止める
 */
const SECURITY_HEADERS = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "browsing-topics=(), interest-cohort=(), payment=(), usb=(), serial=(), hid=(), bluetooth=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      // 利用者が作ったアプリの中身（サムネイル）は、ジサップ本体と別の場所として動かす（あとの指定が勝つので最後に書く）
      {
        source: "/api/apps/:id/preview",
        headers: [{ key: "Content-Security-Policy", value: "sandbox allow-scripts allow-forms allow-modals; frame-ancestors 'self'" }],
      },
    ];
  },
  // OGP画像の生成でロゴPNGを実行時に読むため、関数バンドルに同梱する
  outputFileTracingIncludes: {
    "/og/apps/[file]": ["./public/logo-header.png"],
  },
  images: {
    qualities: [75, 100],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
