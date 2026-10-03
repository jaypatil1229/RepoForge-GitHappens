import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["lucide-react"],
  async rewrites() {
    const raw =
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_BACKEND_PRODUCTION_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "https://credlink-20-production.up.railway.app";
    let backendUrl = raw.trim().replace(/\/+$/, '');
    backendUrl = backendUrl.replace(/cred-link-production\.up\.railway\.app/gi, 'credlink-20-production.up.railway.app');
    backendUrl = backendUrl.replace(/https?:\/\/cred-link(-20)?-production\.up\.railway\.app/gi, 'https://credlink-20-production.up.railway.app');
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
