import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.18.119', 'localhost:3000', '127.0.0.1:3000'],

  // ── Performance optimizations ──
  experimental: {
    // Tree-shake these heavy packages at build time
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      'framer-motion',
      'date-fns',
      'react-icons',
    ],
  },
};

export default nextConfig;
