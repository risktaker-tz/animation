import type { NextConfig } from "next";

/**
 * BUILD_TARGET=pages → fully static export for GitHub Pages (the repo is
 * served under /animation/, so basePath/assetPrefix must match). Everything
 * in the app is client-side (zustand + localStorage + WebAudio + canvas);
 * the /api/tts route is a dev-machine convenience and is removed during the
 * pages build — playback falls back to the browser's speech synthesis.
 */
const isPages = process.env.BUILD_TARGET === "pages";

const nextConfig: NextConfig = {
  ...(isPages
    ? {
        output: "export" as const,
        basePath: "/animation",
        assetPrefix: "/animation/",
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : { output: "standalone" as const }),
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
