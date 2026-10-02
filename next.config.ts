import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
