import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: 'export',  // ← Enable static export
  images: {
    unoptimized: true, // Required for static export
  },
  // Optional: specify output directory
  distDir: 'out',
};

export default nextConfig;
