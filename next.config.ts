import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
