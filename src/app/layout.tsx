import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import SiteHeader from "@/components/SiteHeader";
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
  title: {
    default: "Join | Scars of Valor Foundation",
    template: "%s | Scars of Valor Foundation",
  },
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
        <SiteHeader />

        <main className="flex-1">{children}</main>

        <footer className="border-t border-stone-800/80 bg-stone-950/40">
          <div className="mx-auto max-w-6xl px-4 py-8 text-center text-sm text-stone-500 sm:px-6">
            <p>
              © {new Date().getFullYear()} Scars of Valor Foundation. All
              rights reserved.
            </p>
            <p className="mt-1">
              A 501(c)(3) nonprofit organization. Membership dues support our
              mission.
            </p>
            <p className="mt-1 text-xs text-stone-600">
              We never ask for your SSN or discharge documents. Your email and phone are never shown to other members.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
