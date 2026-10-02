import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ── Performance optimizations ──
  experimental: {
    // Default 1 MB terlalu kecil untuk sertifikat PDF/foto dokumen (file dibatasi 4 MB di lib/storage.ts).
    // 4.5 MB = batas body request fungsi Vercel.
    serverActions: { bodySizeLimit: '4.5mb' },
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
