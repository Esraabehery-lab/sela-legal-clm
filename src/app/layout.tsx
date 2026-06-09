import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { getLocale } from "@/lib/prefs";
import { dir } from "@/lib/i18n";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SELA Legal — Contract Lifecycle Management",
    template: "%s · SELA Legal",
  },
  description:
    "SELA — AI-powered Contract Lifecycle Management platform for the Legal department",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: "/icon.svg",
  },
  themeColor: "#0A0A0A",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = getLocale();
  return (
    <html
      lang={locale}
      dir={dir(locale)}
      className={`${inter.variable} dark`}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
