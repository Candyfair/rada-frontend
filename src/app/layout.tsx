import "@/styles/tokens.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/context/ThemeContext";
import { AccessibilityProvider } from "@/context/AccessibilityContext";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RADA — Renewable Assets Data Analytics",
  description:
    "Real-time monitoring platform for renewable energy fleets. Track batteries, solar farms and wind turbines — live telemetry, historical charts, asset comparison.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <ThemeProvider>
          <AccessibilityProvider>
            {children}
            <Analytics />
          </AccessibilityProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
