import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  metadataBase: new URL("https://middlecrownsmultiventures.vercel.app"),
  title: "Middlecrown Multiventures",
  description: "An investment platform for smarter wealth growth.",
  keywords: ["investment", "finance", "wealth", "Middlecrown Multiventures"],
  alternates: {
    canonical: "https://middlecrownsmultiventures.vercel.app",
  },
  openGraph: {
    title: "Middlecrown Multiventures",
    description: "An investment platform for smarter wealth growth.",
    url: "https://middlecrownsmultiventures.vercel.app",
    siteName: "Middlecrown Multiventures",
    images: [
      {
        url: "/og-image.jpg", // must exist in /public folder
        width: 1200,
        height: 630,
        alt: "Middlecrown Multiventures preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Middlecrown Multiventures",
    description: "An investment platform for smarter wealth growth.",
    images: ["/og-image.jpg"],
    creator: "@middlecrown", // optional – replace with your X/Twitter handle if you have one
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
