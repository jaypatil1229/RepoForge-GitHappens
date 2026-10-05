import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["lucide-react"],
  async rewrites() {
    const backendUrl = (
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_BACKEND_PRODUCTION_URL ||
      "https://credlink-20-production.up.railway.app"
    ).trim().replace(/\/+$/, "").replace(/\/api$/, "");
    // Railway hostnames may be configured without a scheme; retain explicit local HTTP URLs.
    const backendBaseUrl = /^https?:\/\//i.test(backendUrl)
      ? backendUrl
      : `https://${backendUrl}`;
    return [
      {
        source: "/api/:path*",
        destination: `${backendBaseUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
