import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import Providers from "@/components/providers/providers";
import "./globals.css";
import OfflineBanner from "@/components/ui/offline-banner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "G-Fragrance - Premium Perfume Store",
    template: "%s | G-Fragrance",
  },
  description:
    "Shop premium perfumes and exotic fragrances at G-Fragrance. Discover luxury scents crafted for every occasion with fast, reliable shipping.",
  keywords: [
    "perfume",
    "fragrance",
    "luxury perfume",
    "cologne",
    "scents",
    "G-Fragrance",
    "perfume store",
  ],
  applicationName: "G-Fragrance",
  creator: "G-Fragrance",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "G-Fragrance",
    title: "G-Fragrance - Premium Perfume Store",
    description:
      "Shop premium perfumes and exotic fragrances at G-Fragrance. Discover luxury scents crafted for every occasion.",
    images: [
      {
        url: "/logo.png",
        alt: "G-Fragrance",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "G-Fragrance - Premium Perfume Store",
    description:
      "Shop premium perfumes and exotic fragrances at G-Fragrance.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <Script
          id="cloudflare-insights"
          src="https://static.cloudflareinsights.com/beacon.min.js"
          type="module"
          data-cf-beacon='{"token": "1132e014c872484aa2cdffd9604bf676"}'
          strategy="afterInteractive"
        />
        {/* React 19 hoists external async scripts into <head> and runs them
            before hydration without creating a React-managed <script> node. */}
        <script src="/theme-init.js" async />
        <script src="/splash-init.js" async />
      </head>
      <link rel="icon" href="/logo.png" />
      <body className="min-h-full flex flex-col">
        <OfflineBanner />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
