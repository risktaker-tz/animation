import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StoryForge Studio — Make Animated Stories in Your Browser",
  description:
    "Create actors, pick scenes, write dialogue and export animated stories with voices, emotions, camera moves and music. Free, no install, runs in your browser.",
  keywords: [
    "animation maker",
    "animated stories",
    "story creator",
    "character creator",
    "text to speech",
    "cartoon maker",
  ],
  authors: [{ name: "StoryForge Studio" }],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "StoryForge Studio",
    description: "Turn your ideas into animated stories — right in your browser.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f0c18",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
