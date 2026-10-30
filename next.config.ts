import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [process.env.PREVIEW_HOSTNAME ?? "pv-97c75c058e4c-1d6adea1-7fa6-4e71-93cf-0b2f9590fc13.style.dev"],
  images: { unoptimized: true },
  typescript: { ignoreBuildErrors: false },
  experimental: {
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;

// Enables `next dev` to reach local Cloudflare bindings (D1) via Miniflare.
if (process.env.NODE_ENV === "development") {
  import("@opennextjs/cloudflare").then(({ initOpenNextCloudflareForDev }) => {
    initOpenNextCloudflareForDev();
  });
}