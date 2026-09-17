import type { Metadata } from "next";
import Link from "next/link";
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
  title: "Join | Scars of Valor Foundation",
  description:
    "Become a member of Scars of Valor Foundation — a 501(c)(3) nonprofit honoring veterans, first responders, and the community that stands with them.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="sov-page-bg min-h-full flex flex-col text-stone-100">
        <header className="border-b border-stone-800/80 bg-stone-950/60 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <Link href="/" className="group flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-500/50 bg-amber-500/10 text-sm font-bold tracking-tight text-amber-400">
                SoV
              </span>
              <span className="leading-tight">
                <span className="block text-sm font-semibold tracking-wide text-stone-50 group-hover:text-amber-300">
                  Scars of Valor Foundation
                </span>
                <span className="block text-xs text-stone-500">
                  501(c)(3) Nonprofit
                </span>
              </span>
            </Link>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-stone-800/80 bg-stone-950/40">
          <div className="mx-auto max-w-5xl px-4 py-8 text-center text-sm text-stone-500 sm:px-6">
            <p>
              © {new Date().getFullYear()} Scars of Valor Foundation. All
              rights reserved.
            </p>
            <p className="mt-1">
              A 501(c)(3) nonprofit organization. Membership dues support our
              mission.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
