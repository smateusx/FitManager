import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Monorepo: trace files from repo root so Vercel bundles deps correctly
  outputFileTracingRoot: path.join(__dirname, ".."),
};

export default nextConfig;
