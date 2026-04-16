import type { NextConfig } from "next";

/**
 * Dev HMR uses WebSockets. If you open the app by LAN IP (e.g. http://192.168.1.4:3000), that
 * origin must be allowlisted or Next blocks `/_next/webpack-hmr`. Add more IPs via env.
 * (Production builds omit this — only applies during `next dev`.)
 */
const fromEnv =
  process.env.NEXT_DEV_ALLOWED_ORIGINS?.split(",")
    .map((s) => s.trim())
    .filter(Boolean) ?? [];
const allowedDevOrigins = [...new Set([...fromEnv, "192.168.1.4"])];

const nextConfig: NextConfig = {
  serverExternalPackages: ["tesseract.js", "@prisma/client"],
  ...(process.env.NODE_ENV !== "production"
    ? {
        allowedDevOrigins,
      }
    : {}),
  /** Optional smaller deploy bundle: `DOCKER_BUILD=1 npm run build` (current Dockerfile uses a full `.next` copy instead). */
  output: process.env.DOCKER_BUILD === "1" ? "standalone" : undefined,
};

export default nextConfig;
