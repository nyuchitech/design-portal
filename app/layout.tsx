import type { Metadata, Viewport } from "next";
import { Noto_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const fontSans = Noto_Sans({ subsets: ["latin"], variable: "--font-sans" });
const fontMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "mukoko -- Component Registry",
  description:
    "A curated collection of production-ready UI components built on the Nyuchi Brand System. Install directly into your project with the shadcn CLI.",
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fontSans.variable} ${fontMono.variable} dark`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
