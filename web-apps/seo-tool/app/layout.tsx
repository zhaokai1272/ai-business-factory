import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DeepKeyword — AI SEO Long-Tail Keyword Generator",
  description: "Stop guessing keywords. AI analyzes search intent and generates 50+ long-tail keywords in 30 seconds.",
  openGraph: {
    title: "DeepKeyword — AI SEO Keyword Research",
    description: "AI-powered long-tail keyword discovery. Free tier available.",
    images: ["/og-image.png"]
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-dark text-white font-sans antialiased">{children}</body>
    </html>
  );
}
