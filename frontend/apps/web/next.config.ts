import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["lucide-react"],
  async rewrites() {
    const backendUrl =
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_BACKEND_PRODUCTION_URL ||
      "https://credlink-20-production.up.railway.app";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl.replace(/\/+$/, '')}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
