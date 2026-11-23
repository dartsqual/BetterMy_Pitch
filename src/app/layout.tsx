import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Mic } from "lucide-react";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BetterMy Pitch — AI sales & demo coach",
  description:
    "Rehearse demos and sales pitches against realistic AI buyers, get live coaching cues and a structured scorecard.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <header className="border-b border-border bg-card/80 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-white">
                <Mic className="size-4" />
              </span>
              BetterMy Pitch
            </Link>
            <nav className="flex items-center gap-4 text-sm text-muted">
              <Link href="/#new" className="hover:text-foreground">New session</Link>
              <Link href="/#history" className="hover:text-foreground">History</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
