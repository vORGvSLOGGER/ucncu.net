import type { NextConfig } from "next";

// On GitHub Pages the site is served from /<repo-name>/ unless a custom
// domain is configured. The deploy workflow injects the correct value.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
