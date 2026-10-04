/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow HMR from a phone on the same Wi-Fi network (dev only), e.g.
  // ALLOWED_DEV_ORIGINS=192.168.1.34 in .env.local. Vercel builds run with
  // NODE_ENV=production, so this block never reaches the deployed app.
  ...(process.env.NODE_ENV === "development" &&
    process.env.ALLOWED_DEV_ORIGINS && {
      allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS.split(",").map((origin) => origin.trim()),
    }),
};

export default nextConfig;
