/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow HMR from a physical device on the same Wi-Fi network (dev only).
  // In production (Vercel), NODE_ENV is forced to "production" by the platform
  // so this block is never included in the deployed build.
  ...(process.env.NODE_ENV === "development" && {
    allowedDevOrigins: ["192.168.1.34"],
  }),
};

export default nextConfig;